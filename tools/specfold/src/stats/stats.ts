import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { parse } from "yaml";
import { parseText, walk } from "../bundle.ts";
import { sessionStart } from "../hooks/claude.ts";
import type { Config } from "../repo.ts";

export type SetItem =
  | { kind: "file"; path: string; tokens: number; missing?: true }
  | { kind: "context"; path: string; tokens: number; missing?: true }
  | { kind: "skill"; name: string; path: string; tokens: number }
  | { kind: "hook"; tokens: number };

export type BudgetKey = "agents_md" | "total" | "skill_description";

export interface Overrun {
  budget: BudgetKey;
  /** The item over its budget; null for the whole set. */
  item: SetItem | null;
  tokens: number;
  limit: number;
}

export const OPENSPEC_CONFIG = "openspec/config.yaml";
const SKILLS_DIR = ".agents/skills";
const ROOT_FILES = ["AGENTS.md", "CLAUDE.md"];

/** Characters / 4, rounded up: the same estimate `migrate inventory` uses. */
export const estimate = (text: string) => Math.ceil(text.length / 4);

const posix = (p: string) => p.split(sep).join("/");

/** `@<path>` imports outside code, as Claude Code reads them; a path needs a `.` or `/` to count. */
export function importsOf(text: string): string[] {
  const prose = text.replace(/^(```|~~~)[\s\S]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
  return [...prose.matchAll(/(?:^|\s)@([^\s`]+)/gm)]
    .map((m) => (m[1] as string).replace(/[.,;:)]+$/, ""))
    .filter((p) => /[./]/.test(p));
}

/** `AGENTS.md`, `CLAUDE.md` and everything they import, transitively, each once and in the order reached. */
export function loadedFiles(root: string): { path: string; missing: boolean }[] {
  const seen = new Map<string, boolean>();
  const visit = (path: string) => {
    if (seen.has(path)) return;
    const abs = join(root, path);
    const exists = existsSync(abs) && statSync(abs).isFile();
    seen.set(path, !exists);
    if (!exists) return;
    for (const target of importsOf(readFileSync(abs, "utf8"))) {
      const resolved = resolve(dirname(abs), target);
      const rel = posix(relative(root, resolved));
      if (rel.startsWith("..") || rel === "") continue; // outside the repository
      visit(rel);
    }
  };
  for (const f of ROOT_FILES) visit(f);
  return [...seen].map(([path, missing]) => ({ path, missing }));
}

function contextItem(root: string): SetItem {
  const abs = join(root, OPENSPEC_CONFIG);
  if (!existsSync(abs)) return { kind: "context", path: OPENSPEC_CONFIG, tokens: 0, missing: true };
  let context: unknown;
  try {
    context = (parse(readFileSync(abs, "utf8")) as { context?: unknown } | null)?.context;
  } catch {
    context = undefined;
  }
  return {
    kind: "context",
    path: OPENSPEC_CONFIG,
    tokens: estimate(typeof context === "string" ? context : ""),
  };
}

function skillItems(root: string): SetItem[] {
  const dir = join(root, SKILLS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith(".") && existsSync(join(dir, name, "SKILL.md")))
    .sort()
    .map((name) => {
      const path = `${SKILLS_DIR}/${name}/SKILL.md`;
      const data = parseText(path, readFileSync(join(root, path), "utf8")).frontmatter?.data as
        | { name?: unknown; description?: unknown }
        | undefined;
      const text = `${String(data?.name ?? "")}${String(data?.description ?? "")}`;
      return { kind: "skill", name, path, tokens: estimate(text) };
    });
}

function hookItem(config: Config): SetItem {
  let out = "";
  try {
    sessionStart({ config, io: { cwd: config.root, stdout: (t) => (out += t), stderr: () => {} }, args: [] });
  } catch {
    // a broken bundle shows up in validate; the hook then prints nothing here
  }
  return { kind: "hook", tokens: estimate(out) };
}

/** Everything an agent loads before it reads a file, in a fixed order. */
export function alwaysLoaded(config: Config): SetItem[] {
  const files: SetItem[] = loadedFiles(config.root).map(({ path, missing }) =>
    missing
      ? { kind: "file", path, tokens: 0, missing: true }
      : { kind: "file", path, tokens: estimate(readFileSync(join(config.root, path), "utf8")) },
  );
  return [...files, contextItem(config.root), ...skillItems(config.root), hookItem(config)];
}

export const total = (set: SetItem[]) => set.reduce((sum, i) => sum + i.tokens, 0);

/** Skills other tools write (OpenSpec, graphify); their descriptions are not ours to shorten. */
const otherToolsSkill = (name: string) => name.startsWith("openspec-") || name === "graphify";

/** Each exceeded budget; skills other tools write count only toward the total. */
export function overBudget(set: SetItem[], budget: Config["statsBudget"]): Overrun[] {
  const out: Overrun[] = [];
  for (const item of set) {
    if (item.kind === "file" && item.path === "AGENTS.md" && item.tokens > budget.agentsMd)
      out.push({ budget: "agents_md", item, tokens: item.tokens, limit: budget.agentsMd });
    if (item.kind === "skill" && !otherToolsSkill(item.name) && item.tokens > budget.skillDescription)
      out.push({ budget: "skill_description", item, tokens: item.tokens, limit: budget.skillDescription });
  }
  const sum = total(set);
  if (sum > budget.total) out.push({ budget: "total", item: null, tokens: sum, limit: budget.total });
  return out;
}

/** The bundle's tokens per top-level folder, with `(root)` for files at the bundle root. */
export function knowledgeFolders(bundleRoot: string): { folder: string; tokens: number }[] {
  const sums = new Map<string, number>();
  for (const e of walk(bundleRoot)) {
    if (e.isDir) continue;
    const folder = e.rel.includes("/") ? (e.rel.split("/")[0] as string) : "(root)";
    sums.set(folder, (sums.get(folder) ?? 0) + estimate(readFileSync(join(bundleRoot, e.rel), "utf8")));
  }
  return [...sums]
    .sort(([a], [b]) => (a === "(root)" ? -1 : b === "(root)" ? 1 : a < b ? -1 : 1))
    .map(([folder, tokens]) => ({ folder, tokens }));
}

/** Each file named, a folder standing for every file below it; paths relative to `root`, sorted. */
export function estimateFiles(root: string, paths: string[]): { path: string; tokens: number }[] {
  const files = new Set<string>();
  const add = (abs: string) => {
    if (statSync(abs).isDirectory()) {
      for (const name of readdirSync(abs)) add(join(abs, name));
    } else files.add(abs);
  };
  for (const p of paths) add(resolve(root, p));
  return [...files]
    .map((abs) => ({ path: posix(relative(root, abs)), tokens: estimate(readFileSync(abs, "utf8")) }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}
