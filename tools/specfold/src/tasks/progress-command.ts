import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { type Config, requireConfig } from "../repo.ts";
import { changeDir } from "./command.ts";
import { readCommits, taskIdsFor } from "./git.ts";
import { parseTasks, type TasksFile } from "./parse.ts";
import { type Progress, progressOf } from "./progress.ts";

function readTasks(config: Config, change: string): TasksFile | undefined {
  const path = join(changeDir(config, change), "tasks.md");
  return existsSync(path) ? parseTasks(readFileSync(path, "utf8")) : undefined;
}

function activeChanges(config: Config): string[] {
  const dir = join(config.root, "openspec", "changes");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "archive" && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

/** Short sha of the commit carrying each task's trailer on HEAD; empty outside a git repository. */
function commitsByTask(config: Config, change: string): Map<string, string> {
  const out = new Map<string, string>();
  try {
    for (const commit of readCommits(config.root, "HEAD", false)) {
      for (const id of taskIdsFor(commit, change)) out.set(id, commit.sha.slice(0, 7));
    }
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
  }
  return out;
}

const nextJson = (p: Progress) => (p.next ? { task: p.next.task.id, text: p.next.task.text } : null);

function nextLine(p: Progress): string {
  if (p.next) return `next: ${p.next.task.id} ${p.next.task.text}`;
  return p.done === p.total ? "next: none, all tasks done" : "next: none, every open group is blocked";
}

register({
  name: "status",
  summary: "show task progress per group and the next open task",
  usage: "specfold status [<change>] [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 1) throw new UsageError(`unexpected argument '${positionals[1]}'`);
    const config = requireConfig(io.cwd);
    const [change] = positionals;

    if (change === undefined) {
      const rows = activeChanges(config).map((name) => {
        const tasks = readTasks(config, name);
        return { change: name, tasks, progress: tasks && progressOf(tasks) };
      });
      if (values.json) {
        const changes = rows.map(({ change: name, progress: p }) =>
          p
            ? { change: name, done: p.done, total: p.total, next: nextJson(p) }
            : { change: name, done: 0, total: 0, next: null, tasksFile: false },
        );
        io.stdout(`${JSON.stringify({ changes }, null, 2)}\n`);
      } else {
        const width = Math.max(0, ...rows.map((r) => r.change.length));
        const lines = rows.map(({ change: name, progress: p }) =>
          p
            ? `${name.padEnd(width)}  ${p.done}/${p.total}  ${nextLine(p)}`
            : `${name.padEnd(width)}  no tasks.md`,
        );
        io.stdout(lines.length > 0 ? `${lines.join("\n")}\n` : "no active changes\n");
      }
      return 0;
    }

    const tasks = readTasks(config, change);
    if (!tasks) throw new EnvError(`change '${change}' has no tasks.md`);
    const p = progressOf(tasks);
    if (values.json) {
      const commits = commitsByTask(config, change);
      const groups = p.groups.map((g) => ({
        group: g.group.number,
        name: g.group.name,
        done: g.done,
        total: g.total,
        state: g.state,
        blockedBy: g.blockedBy,
        tasks: g.group.tasks.map((t) => ({
          task: t.id,
          text: t.text,
          done: t.done,
          commit: commits.get(t.id) ?? null,
        })),
      }));
      io.stdout(
        `${JSON.stringify({ change, done: p.done, total: p.total, groups, next: nextJson(p) }, null, 2)}\n`,
      );
      return 0;
    }
    const label = (g: Progress["groups"][number]) => `${g.group.number}. ${g.group.name}`;
    const width = Math.max(0, ...p.groups.map((g) => label(g).length));
    const states = p.groups.map((g) =>
      g.state === "blocked" ? `blocked by ${g.blockedBy.join(", ")}` : g.state,
    );
    const stateWidth = Math.max(0, ...states.map((s) => s.length));
    const lines = [
      `${change}: ${p.done}/${p.total} tasks`,
      ...p.groups.map(
        (g, i) =>
          `  ${label(g).padEnd(width)}  ${(states[i] as string).padEnd(stateWidth)}  ${g.done}/${g.total}`,
      ),
      nextLine(p),
    ];
    io.stdout(`${lines.join("\n")}\n`);
    return 0;
  },
});

register({
  name: "resume",
  summary: "print the next open task with its group context",
  usage: "specfold resume <change> [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [change, ...extra] = positionals;
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const config = requireConfig(io.cwd);
    const tasks = readTasks(config, change as string);
    if (!tasks) throw new EnvError(`change '${change}' has no tasks.md`);
    const p = progressOf(tasks);
    const allDone = p.done === p.total;
    const blocked = p.groups
      .filter((g) => g.state === "blocked")
      .map((g) => ({ group: g.group.number, blockedBy: g.blockedBy }));
    const next = p.next;
    const remaining = next ? next.group.tasks.filter((t) => !t.done && t !== next.task) : [];
    const meta = next?.group.meta;
    const trailer = next ? `Task: ${change}#${next.task.id}` : null;

    if (values.json) {
      io.stdout(
        `${JSON.stringify(
          {
            change,
            allDone,
            next: next
              ? { task: next.task.id, text: next.task.text, doneWhen: next.task.doneWhen ?? null }
              : null,
            group: next
              ? {
                  group: next.group.number,
                  name: next.group.name,
                  files: meta?.files ?? [],
                  depends: meta?.depends ?? [],
                  scenarios: meta?.scenarios ?? [],
                  agent: meta?.agent ?? null,
                }
              : null,
            remaining: remaining.map((t) => ({ task: t.id, text: t.text })),
            trailer,
            blocked: next || allDone ? [] : blocked,
          },
          null,
          2,
        )}\n`,
      );
    } else if (next) {
      const list = (xs: (string | number)[]) => (xs.length > 0 ? xs.join(", ") : "none");
      io.stdout(
        `${[
          `Next task: ${next.task.id} ${next.task.text}`,
          `Done when: ${next.task.doneWhen ?? "(missing)"}`,
          `Group: ${next.group.number}. ${next.group.name}`,
          `  files: ${list(meta?.files ?? [])}`,
          `  depends: ${list(meta?.depends ?? [])}`,
          `  scenarios: ${list(meta?.scenarios ?? [])}`,
          `  agent: ${meta?.agent ?? "(missing)"}`,
          `Remaining in group: ${remaining.length > 0 ? remaining.map((t) => `${t.id} ${t.text}`).join("; ") : "none"}`,
          `Trailer: ${trailer}`,
        ].join("\n")}\n`,
      );
    } else if (allDone) {
      io.stdout(`All tasks of ${change} are done.\n`);
    } else {
      io.stdout(
        `No open task can start: ${blocked.map((b) => `group ${b.group} is blocked by ${b.blockedBy.join(", ")}`).join("; ")}\n`,
      );
    }
    return next || allDone ? 0 : 1;
  },
});
