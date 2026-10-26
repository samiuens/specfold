import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Severity } from "../findings.ts";
import { walkFiles } from "../glob.ts";
import { parallelOverlaps } from "./overlap.ts";
import type { Group, TasksFile } from "./parse.ts";

export interface TaskFinding {
  rule: string;
  severity: Severity;
  /** Repository-relative path of the tasks.md, with forward slashes. */
  file: string;
  group: number | null;
  task: string | null;
  line: number | null;
  message: string;
  fix: string;
}

export interface RuleContext {
  repoRoot: string;
  /** Repository-relative path of the tasks.md. */
  file: string;
  knownScenarios: Set<string>;
  maxTasksPerGroup: number;
}

export const DEFAULT_AGENT = "implementer";
export const KNOWLEDGE_GROUP = "Knowledge";

/** Groups in a `depends` cycle, one list per cycle (strongly connected components larger than one group). */
function dependencyCycles(groups: Group[]): number[][] {
  const edges = new Map(groups.map((g) => [g.number, g.meta?.depends ?? []]));
  const index = new Map<number, number>();
  const low = new Map<number, number>();
  const stack: number[] = [];
  const onStack = new Set<number>();
  const cycles: number[][] = [];
  let counter = 0;
  const visit = (v: number) => {
    index.set(v, counter);
    low.set(v, counter++);
    stack.push(v);
    onStack.add(v);
    for (const w of edges.get(v) ?? []) {
      if (!edges.has(w)) continue;
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v) as number, low.get(w) as number));
      } else if (onStack.has(w)) low.set(v, Math.min(low.get(v) as number, index.get(w) as number));
    }
    if (low.get(v) === index.get(v)) {
      const component: number[] = [];
      let w: number;
      do {
        w = stack.pop() as number;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      if (component.length > 1) cycles.push(component.sort((a, b) => a - b));
    }
  };
  for (const g of groups) if (!index.has(g.number)) visit(g.number);
  return cycles;
}

/** Rules T1-T9: everything that can be checked from tasks.md, the specs and the repository files. */
export function checkStatic(tasks: TasksFile, ctx: RuleContext): TaskFinding[] {
  const out: TaskFinding[] = [];
  const add = (
    rule: string,
    severity: Severity,
    group: number | null,
    task: string | null,
    line: number | null,
    message: string,
    fix: string,
  ) => out.push({ rule, severity, file: ctx.file, group, task, line, message, fix });

  const numbers = new Set(tasks.groups.map((g) => g.number));
  tasks.groups.forEach((group, i) => {
    const n = group.number;
    if (group.metaError)
      add(
        "T1",
        "error",
        n,
        null,
        group.metaLine,
        group.metaError,
        "add a yaml block with files, depends, scenarios and agent right after the heading",
      );
    if (n !== i + 1)
      add(
        "T3",
        "error",
        n,
        null,
        group.line,
        `group numbered ${n}, expected ${i + 1}`,
        "number groups 1, 2, 3, … without gaps or repeats",
      );

    let previous = 0;
    for (const task of group.tasks) {
      if (!task.doneWhen)
        add(
          "T2",
          "error",
          n,
          task.id,
          task.line,
          `task ${task.id} has no 'Done when:' line`,
          "add an indented '- Done when: <test, command or scenario>' line",
        );
      if (task.group !== n) {
        add(
          "T3",
          "error",
          n,
          task.id,
          task.line,
          `task ${task.id} is in group ${n}`,
          `number it ${n}.<m> or move it to group ${task.group}`,
        );
        continue;
      }
      if (task.index !== previous + 1)
        add(
          "T3",
          "error",
          n,
          task.id,
          task.line,
          `task ${task.id} follows ${n}.${previous}, expected ${n}.${previous + 1}`,
          "number tasks in a group 1, 2, 3, … without gaps or repeats",
        );
      previous = task.index;
    }

    for (const dep of group.meta?.depends ?? []) {
      if (dep === n)
        add(
          "T4",
          "error",
          n,
          null,
          group.metaLine,
          `group ${n} depends on itself`,
          "remove the group's own number from depends",
        );
      else if (!numbers.has(dep))
        add(
          "T4",
          "error",
          n,
          null,
          group.metaLine,
          `group ${n} depends on missing group ${dep}`,
          "depend only on existing groups",
        );
    }
    for (const id of group.meta?.scenarios ?? []) {
      if (!ctx.knownScenarios.has(id))
        add(
          "T6",
          "error",
          n,
          null,
          group.metaLine,
          `unknown scenario '${id}'`,
          "use <capability-path>#<scenario-title-in-kebab-case> from the delta specs or openspec/specs/",
        );
    }
    const agent = group.meta?.agent;
    if (
      agent &&
      agent !== DEFAULT_AGENT &&
      !existsSync(join(ctx.repoRoot, ".claude", "agents", `${agent}.md`))
    ) {
      add(
        "T7",
        "warning",
        n,
        null,
        group.metaLine,
        `agent '${agent}' has no definition in .claude/agents/`,
        `define the role or use ${DEFAULT_AGENT}`,
      );
    }
    if (group.tasks.length > ctx.maxTasksPerGroup) {
      add(
        "T9",
        "warning",
        n,
        null,
        group.line,
        `group ${n} has ${group.tasks.length} tasks, more than ${ctx.maxTasksPerGroup}`,
        "split the group into smaller groups",
      );
    }
  });

  for (const heading of tasks.strayHeadings)
    add(
      "T3",
      "error",
      null,
      null,
      heading.line,
      `'## ${heading.text}' is not a task group heading`,
      "use '## <n>. <name>' or move the text into '## Workflow follow-up' at the end",
    );
  for (const task of tasks.orphanTasks)
    add(
      "T3",
      "error",
      null,
      task.id,
      task.line,
      `task ${task.id} is outside any group`,
      "move it below a group heading",
    );

  for (const cycle of dependencyCycles(tasks.groups)) {
    const first = tasks.groups.find((g) => g.number === cycle[0]);
    add(
      "T4",
      "error",
      cycle[0] ?? null,
      null,
      first?.metaLine ?? null,
      `groups ${cycle.join(", ")} depend on each other in a cycle`,
      "remove one dependency so the groups can be ordered",
    );
  }

  for (const { first, second, shared } of parallelOverlaps(tasks.groups, () => walkFiles(ctx.repoRoot))) {
    add(
      "T5",
      "error",
      second.number,
      null,
      second.metaLine,
      `groups ${first.number} and ${second.number} may run in parallel but both own ${shared}`,
      `make group ${second.number} depend on group ${first.number} or split the files`,
    );
  }

  const last = tasks.groups.at(-1);
  if (last && last.name !== KNOWLEDGE_GROUP) {
    add(
      "T8",
      "warning",
      last.number,
      null,
      last.line,
      `last group is '${last.name}', not '${KNOWLEDGE_GROUP}'`,
      `end with a '${KNOWLEDGE_GROUP}' group that writes the concepts from knowledge.md`,
    );
  }
  return out;
}
