import { isMap, isScalar, isSeq, type YAMLMap } from "yaml";
import { EnvError } from "../errors.ts";
import { OMP_CONFIG, ompConfigText, parseOmpConfig } from "../omp/config.ts";
import { ACTION_TABLE, type ActionName, RETIRED } from "./actions.ts";
import { type Level, resolveLevels } from "./render.ts";

// see knowledge: /references/omp.md

export const OMP_LEVELS = ["allow", "prompt", "deny"] as const;
export type OmpLevel = (typeof OMP_LEVELS)[number];

const OMP_LEVEL: Record<Level, OmpLevel> = { allow: "allow", ask: "prompt", deny: "deny" };

/** One `bash.patterns` entry that enters, leaves or moves within the sync's block. */
export interface OmpChange {
  pattern: string;
  from: OmpLevel | "none";
  to: OmpLevel | "none";
  target: typeof OMP_CONFIG;
}

export interface OmpPlan {
  target: typeof OMP_CONFIG;
  changes: OmpChange[];
  /** The new `.omp/config.yml` text; undefined when nothing changes or nothing may be written. */
  text?: string;
}

/**
 * omp match strings of Claude Code Bash patterns: `Bash(` and `)` stripped. A pattern ending in ` *` also
 * yields its bare command, since omp's `git push *` does not match a bare `git push`.
 */
export function ompMatches(patterns: string[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const match = pattern.replace(/^Bash\((.*)\)$/, "$1");
    matches.push(match);
    if (match.endsWith(" *")) matches.push(match.slice(0, -2));
  }
  return matches;
}

/** Every match string the sync owns in `bash.patterns`, current and retired. */
export const OMP_OWNED = new Set(ompMatches([...ACTION_TABLE.flatMap((a) => a.patterns), ...RETIRED]));

export interface OmpEntry {
  match: string;
  approval: OmpLevel;
}

/** The sync's block, in first-match order: deny, then prompt, then allow, each in action-table order. */
export function ompBlock(levels: Record<ActionName, Level>): OmpEntry[] {
  return (["deny", "ask", "allow"] as const).flatMap((level) =>
    ACTION_TABLE.filter((a) => levels[a.name] === level).flatMap((a) =>
      ompMatches(a.patterns).map((match) => ({ match, approval: OMP_LEVEL[level] })),
    ),
  );
}

const field = (node: unknown, key: string): unknown => {
  if (!isMap(node)) return undefined;
  const value = node.get(key);
  return typeof value === "string" ? value : undefined;
};

const levelOf = (node: unknown): OmpLevel | "none" => {
  const approval = field(node, "approval");
  return (OMP_LEVELS as readonly unknown[]).includes(approval) ? (approval as OmpLevel) : "none";
};

const isOwned = (node: unknown): boolean => {
  const match = field(node, "match");
  return typeof match === "string" && OMP_OWNED.has(match);
};

/**
 * The omp part of the sync without I/O: `text` is the current `.omp/config.yml`, undefined when missing.
 * Owned entries leave `bash.patterns` and come back as one block at its start; every other entry and key
 * stays. A file that is not a mapping, or whose `bash.patterns` is not a list, is an environment error.
 */
export function planOmpPermissions(setting: unknown, text: string | undefined): OmpPlan {
  const target = OMP_CONFIG;
  const { levels, problems } = resolveLevels(setting);
  if (problems.length > 0) return { target, changes: [] };
  const doc = parseOmpConfig(text);
  const bash = doc.get("bash", true);
  const empty = (node: unknown) => node === undefined || (isScalar(node) && node.value === null);
  if (!empty(bash) && !isMap(bash))
    throw new EnvError(`${OMP_CONFIG} has a 'bash' value that is not a mapping`);
  const patterns = isMap(bash) ? bash.get("patterns", true) : undefined;
  if (!empty(patterns) && !isSeq(patterns))
    throw new EnvError(`${OMP_CONFIG} has a 'bash.patterns' value that is not a list`);
  const items = isSeq(patterns) ? patterns.items : [];

  const block = ompBlock(levels);
  const wanted = new Set(block.map((e) => e.match));
  const owned = items.filter(isOwned);
  const first = new Map<string, unknown>();
  const changes: OmpChange[] = [];
  for (const node of owned) {
    const match = field(node, "match") as string;
    if (wanted.has(match) && !first.has(match)) first.set(match, node);
    else changes.push({ pattern: match, from: levelOf(node), to: "none", target });
  }
  // an entry out of place but at its level is reported only when nothing else changes
  const moves: OmpChange[] = [];
  block.forEach(({ match, approval }, i) => {
    const at = items[i];
    if (field(at, "match") === match && levelOf(at) === approval) return;
    const node = first.get(match);
    const from = node ? levelOf(node) : "none";
    (from === approval ? moves : changes).push({ pattern: match, from, to: approval, target });
  });
  if (changes.length === 0) changes.push(...moves);
  if (changes.length === 0) return { target, changes };

  const entries = block.map(({ match, approval }) => {
    const node = first.get(match) as YAMLMap | undefined;
    if (!node) return doc.createNode({ match, approval });
    node.set("approval", approval);
    return node;
  });
  const others = items.filter((node) => !isOwned(node));
  if (isSeq(patterns)) patterns.items = [...entries, ...others];
  else if (isMap(bash)) bash.set("patterns", doc.createNode(entries));
  else doc.set("bash", doc.createNode({ patterns: entries }));
  return { target, changes, text: ompConfigText(doc) };
}
