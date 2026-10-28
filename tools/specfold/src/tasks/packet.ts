import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitSections } from "../change/brief.ts";
import { UsageError } from "../errors.ts";
import type { Config } from "../repo.ts";
import { parseSpecs, type Scenario } from "../trace/specs.ts";
import { changeDir } from "./command.ts";
import { parseTasks } from "./parse.ts";

export interface Packet {
  change: string;
  group: number;
  name: string;
  tasks: { id: string; text: string; doneWhen: string | null; done: boolean }[];
  files: string[];
  depends: number[];
  scenarios: { id: string; text: string | null }[];
  wish: string;
  decisions: string;
  knowledge: string[];
}

const CONCEPT_LINK = /\]\((\/[a-z0-9][a-z0-9/-]*\.md)\)/g;

const section = (text: string, name: string) =>
  (
    splitSections(text)
      .get(name)
      ?.lines.map((l) => l.text)
      .join("\n") ?? ""
  ).trim();

/** The scenario's heading and its lines up to the next heading. */
function scenarioText(root: string, s: Scenario): string {
  const lines = readFileSync(join(root, s.spec), "utf8").split("\n");
  const end = lines.findIndex((l, i) => i >= s.line && /^#{1,4}\s/.test(l));
  return lines
    .slice(s.line - 1, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

/** Everything an implementer needs for one task group, and nothing about the other groups. */
export function buildPacket(config: Config, change: string, groupNumber: number): Packet {
  const dir = changeDir(config, change);
  const rel = `openspec/changes/${change}`;
  const tasksPath = join(dir, "tasks.md");
  if (!existsSync(tasksPath)) throw new UsageError(`change '${change}' has no tasks.md`);
  const groups = parseTasks(readFileSync(tasksPath, "utf8")).groups;
  const group = groups.find((g) => g.number === groupNumber);
  if (!group)
    throw new UsageError(
      `change '${change}' has no group ${groupNumber}; its groups are ${groups.map((g) => g.number).join(", ")}`,
    );
  // the change's own delta specs come first, so a modified scenario shows its new text
  const known = [
    ...parseSpecs(config.root, `${rel}/specs`, true).scenarios,
    ...parseSpecs(config.root, "openspec/specs", false).scenarios,
  ];
  const read = (name: string) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8") : "");
  const proposal = read("proposal.md");
  const brief = read("brief.md");
  return {
    change,
    group: group.number,
    name: group.name,
    tasks: group.tasks.map((t) => ({ id: t.id, text: t.text, doneWhen: t.doneWhen ?? null, done: t.done })),
    files: group.meta?.files ?? [],
    depends: group.meta?.depends ?? [],
    scenarios: (group.meta?.scenarios ?? []).map((id) => {
      const found = known.find((s) => s.id === id);
      return { id, text: found ? scenarioText(config.root, found) : null };
    }),
    wish: section(brief, "Wish"),
    decisions: section(brief, "Decisions"),
    knowledge: [...new Set([...proposal.matchAll(CONCEPT_LINK)].map((m) => `knowledge${m[1]}`))],
  };
}

/** The packet as Markdown, passed verbatim to the implementer. */
export function renderPacket(p: Packet): string {
  const list = (items: string[], empty: string) => (items.length > 0 ? items.map((i) => `- ${i}`) : [empty]);
  return [
    `# Task packet: ${p.change}, group ${p.group}. ${p.name}`,
    "",
    "## Tasks",
    "",
    ...p.tasks.flatMap((t) => [
      `- ${t.done ? "[done] " : ""}${t.id} ${t.text}`,
      `  - Done when: ${t.doneWhen ?? "(not stated)"}`,
    ]),
    "",
    "## Files you own",
    "",
    ...list(
      p.files.map((f) => `\`${f}\``),
      "none",
    ),
    "",
    "## Depends on",
    "",
    ...list(
      p.depends.map((d) => `group ${d} (merged before you start)`),
      "nothing",
    ),
    "",
    "## Scenarios",
    "",
    ...(p.scenarios.length > 0
      ? p.scenarios.flatMap((s) => [`### ${s.id}`, "", s.text ?? "unknown scenario id", ""])
      : ["none", ""]),
    "## Wish",
    "",
    p.wish || "(no brief)",
    "",
    "## Decisions",
    "",
    p.decisions || "(none)",
    "",
    "## Knowledge",
    "",
    ...list(p.knowledge, "none linked from the proposal"),
    "",
    "## Rules",
    "",
    `- Start at the first task not marked [done] and work in order; tick each in \`openspec/changes/${p.change}/tasks.md\` and commit it alone with the trailer \`Task: ${p.change}#${p.group}.<m>\`.`,
    "- Change only the files you own (and the tick in tasks.md).",
    "- If a task needs another file or clearly exceeds its size, stop and return a SPLIT PROPOSAL instead of widening your scope.",
    "",
  ].join("\n");
}
