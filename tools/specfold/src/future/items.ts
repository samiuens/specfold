import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseFile, RESERVED, walk } from "../bundle.ts";
import { UsageError } from "../errors.ts";
import { editFrontmatter } from "../sync/frontmatter.ts";
import { isRecord } from "../validate/okf.ts";

/** The future-facing kinds with commands: where their concepts live and which type they have. */
export const KINDS = {
  backlog: { folder: "backlog", type: "Backlog Item", noun: "backlog item" },
  commitments: { folder: "commitments", type: "Deferred Commitment", noun: "commitment" },
} as const;
export type Kind = keyof typeof KINDS;

export interface Item {
  /** Bundle-relative path. */
  rel: string;
  abs: string;
  title: string;
  data: Record<string, unknown>;
}

const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Concepts of a type anywhere in the bundle, sorted by path. */
export function conceptsOfType(bundleRoot: string, type: string): Item[] {
  const items: Item[] = [];
  for (const entry of walk(bundleRoot)) {
    const name = entry.rel.slice(entry.rel.lastIndexOf("/") + 1);
    if (entry.isDir || !name.endsWith(".md") || RESERVED.has(name)) continue;
    const data = parseFile(bundleRoot, entry.rel).frontmatter?.data;
    if (!isRecord(data) || data.type !== type) continue;
    items.push({ rel: entry.rel, abs: join(bundleRoot, entry.rel), title: text(data.title) || name, data });
  }
  return items;
}

/** The kind's concepts inside its folder. */
export const listItems = (bundleRoot: string, kind: Kind): Item[] =>
  conceptsOfType(bundleRoot, KINDS[kind].type).filter((i) => i.rel.startsWith(`${KINDS[kind].folder}/`));

/**
 * Resolves `dark-mode`, `dark-mode.md`, `backlog/dark-mode.md` or `knowledge/backlog/dark-mode.md`;
 * anything else is a usage error that names the argument.
 */
export function findItem(repoRoot: string, bundleRoot: string, kind: Kind, arg: string): Item {
  const { folder, noun } = KINDS[kind];
  const prefix = `${relative(repoRoot, bundleRoot).split(sep).join("/")}/`;
  let rel = arg.replace(/^\/+/, "");
  if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
  if (!rel.startsWith(`${folder}/`)) rel = `${folder}/${rel}`;
  if (!rel.endsWith(".md")) rel = `${rel}.md`;
  const item = listItems(bundleRoot, kind).find((i) => i.rel === rel);
  if (!item) throw new UsageError(`unknown ${noun} '${arg}': no ${KINDS[kind].type} at ${prefix}${rel}`);
  return item;
}

/** A trigger's due date: `YYYY-MM-DD` (start of that day, local time) or an ISO 8601 timestamp; else undefined. */
export function dueDate(trigger: unknown): Date | undefined {
  if (typeof trigger !== "string") return undefined;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trigger.trim());
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trigger.trim())) return undefined;
  const ms = Date.parse(trigger);
  return Number.isNaN(ms) ? undefined : new Date(ms);
}

/** Sets frontmatter keys of an item in place, line by line. */
export function setKeys(item: Item, keys: Record<string, string>): void {
  writeFileSync(item.abs, editFrontmatter(readFileSync(item.abs, "utf8"), { set: keys }).text);
}
