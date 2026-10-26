import { parse as parseYaml } from "yaml";

export interface Task {
  /** `<n>.<m>` as written. */
  id: string;
  /** Group number as written in the id. */
  group: number;
  index: number;
  done: boolean;
  text: string;
  line: number;
  /** The `Done when:` text, or undefined when the next line is not a done line. */
  doneWhen?: string;
}

export interface GroupMeta {
  files: string[];
  depends: number[];
  scenarios: string[];
  agent: string;
}

export interface Group {
  number: number;
  name: string;
  line: number;
  /** Parsed metadata, or undefined when the block is missing or invalid (see `metaError`). */
  meta?: GroupMeta;
  metaError?: string;
  /** Line of the metadata block's opening fence, or the heading line when there is none. */
  metaLine: number;
  tasks: Task[];
}

export interface StrayHeading {
  text: string;
  line: number;
}

export interface TasksFile {
  groups: Group[];
  strayHeadings: StrayHeading[];
  /** Task lines outside any group. */
  orphanTasks: Task[];
  followUpLine?: number;
}

export const FOLLOW_UP = "Workflow follow-up";
const GROUP = /^## (\d+)\. (.+?)\s*$/;
const H2 = /^## (.*?)\s*$/;
const TASK = /^- \[([ xX])\] (\d+)\.(\d+)(?: (.*))?$/;
const DONE = /^\s+- Done when:(.*)$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function parseMeta(source: string): { meta?: GroupMeta; error?: string } {
  let data: unknown;
  try {
    data = parseYaml(source);
  } catch (error) {
    return { error: `metadata is not valid YAML: ${(error as Error).message.split("\n")[0]}` };
  }
  if (!isRecord(data)) return { error: "metadata must be a mapping" };
  const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
  if (data.files === undefined) return { error: "metadata has no 'files'" };
  if (!strings(data.files)) return { error: "'files' must be a list of globs" };
  if ((data.files as string[]).length === 0) return { error: "'files' must not be empty" };
  const depends = data.depends ?? [];
  if (!Array.isArray(depends) || !depends.every((x) => Number.isInteger(x) && x >= 1))
    return { error: "'depends' must be a list of group numbers" };
  const scenarios = data.scenarios ?? [];
  if (!strings(scenarios)) return { error: "'scenarios' must be a list of scenario ids" };
  const agent = data.agent ?? "implementer";
  if (typeof agent !== "string" || agent === "") return { error: "'agent' must be a role name" };
  return { meta: { files: data.files as string[], depends, scenarios: scenarios as string[], agent } };
}

/** Parses a tasks.md breakdown; never throws, problems surface as missing fields for the rules. */
export function parseTasks(text: string): TasksFile {
  const lines = text.split(/\r?\n/);
  const result: TasksFile = { groups: [], strayHeadings: [], orphanTasks: [] };
  let current: Group | undefined;
  let inFollowUp = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const lineNo = i + 1;
    const group = GROUP.exec(line);
    const h2 = H2.exec(line);
    if (h2 && !group) {
      if (h2[1] === FOLLOW_UP && result.followUpLine === undefined) {
        result.followUpLine = lineNo;
        inFollowUp = true;
      } else result.strayHeadings.push({ text: h2[1] as string, line: lineNo });
      current = undefined;
      continue;
    }
    if (group) {
      if (inFollowUp) {
        result.strayHeadings.push({ text: line.slice(3), line: lineNo });
        continue;
      }
      current = {
        number: Number(group[1]),
        name: group[2] as string,
        line: lineNo,
        metaLine: lineNo,
        tasks: [],
      };
      result.groups.push(current);
      // The metadata block must follow the heading, with only blank lines between.
      let j = i + 1;
      while (j < lines.length && (lines[j] as string).trim() === "") j++;
      if (/^```ya?ml\s*$/.test(lines[j] ?? "")) {
        const end = lines.findIndex((l, k) => k > j && l.trim() === "```");
        current.metaLine = j + 1;
        if (end === -1) current.metaError = "metadata block is not closed";
        else {
          const { meta, error } = parseMeta(lines.slice(j + 1, end).join("\n"));
          if (meta) current.meta = meta;
          else current.metaError = error ?? "invalid metadata";
          i = end;
        }
      } else current.metaError = "no metadata block after the heading";
      continue;
    }
    if (inFollowUp) continue;
    const task = TASK.exec(line);
    if (!task) continue;
    const done = DONE.exec(lines[i + 1] ?? "");
    const entry: Task = {
      id: `${task[2]}.${task[3]}`,
      group: Number(task[2]),
      index: Number(task[3]),
      done: task[1] !== " ",
      text: (task[4] ?? "").trim(),
      line: lineNo,
      ...(done && (done[1] as string).trim() !== "" ? { doneWhen: (done[1] as string).trim() } : {}),
    };
    (current ? current.tasks : result.orphanTasks).push(entry);
  }
  return result;
}
