import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { EnvError } from "../errors.ts";
import { git, gitSucceeds } from "../git.ts";
import { globToRegExp } from "../glob.ts";
import { writeIfChanged } from "../hooks/install.ts";
import { defaultBranch } from "../migrate/repo.ts";
import { activeChanges } from "./plan.ts";

export const WORKTREES = ".claude/worktrees";
export const INDEX_FILE = ".specfold/wt-index";
const INCLUDE_FILE = ".worktreeinclude";

export interface Worktree {
  path: string;
  branch: string | undefined;
  locked: boolean;
}

export interface Outcome {
  lines: string[];
  /** False when something was refused or kept. */
  ok: boolean;
}

const LOCKFILES: [string, string[]][] = [
  ["package-lock.json", ["npm", "ci", "--prefer-offline"]],
  ["pnpm-lock.yaml", ["pnpm", "install", "--frozen-lockfile", "--prefer-offline"]],
  ["yarn.lock", ["yarn", "install", "--frozen-lockfile"]],
  ["bun.lock", ["bun", "install", "--frozen-lockfile"]],
  ["bun.lockb", ["bun", "install", "--frozen-lockfile"]],
];

const posix = (p: string) => p.split(sep).join("/");
const same = (a: string, b: string) => realpathSync(a) === realpathSync(b);

/** Every worktree of the repository, the main checkout first, from `git worktree list --porcelain`. */
export function listWorktrees(cwd: string): Worktree[] {
  return git(cwd, ["worktree", "list", "--porcelain"])
    .split("\n\n")
    .filter((block) => block.startsWith("worktree "))
    .map((block) => {
      const lines = block.split("\n");
      const field = (name: string) => lines.find((l) => l === name || l.startsWith(`${name} `));
      return {
        path: (field("worktree") as string).slice("worktree ".length),
        branch: field("branch")?.slice("branch refs/heads/".length),
        locked: field("locked") !== undefined,
      };
    });
}

/** Installs dependencies from the lockfile and records this worktree's index for test ports. */
export function setupWorktree(cwd: string, log: (text: string) => void): Outcome {
  const top = git(cwd, ["rev-parse", "--show-toplevel"]).trim();
  const lines: string[] = [];
  const lock = LOCKFILES.find(([file]) => existsSync(join(top, file)));
  if (lock) {
    const [command, ...args] = lock[1] as [string, ...string[]];
    const run = spawnSync(command, args, { cwd: top, encoding: "utf8" });
    log(`${run.stdout ?? ""}${run.stderr ?? ""}`);
    if (run.error || run.status !== 0)
      throw new EnvError(
        `${lock[1].join(" ")} failed${run.error ? `: ${run.error.message}` : ` with exit ${run.status}`}`,
      );
    lines.push(`install: ${lock[1].join(" ")}`);
  } else lines.push("install: no lockfile found, nothing installed");
  const index = listWorktrees(top).findIndex((w) => existsSync(w.path) && same(w.path, top));
  writeIfChanged(join(top, INDEX_FILE), `${index}\n`);
  lines.push(`index: ${index} (${INDEX_FILE})`);
  return { lines, ok: true };
}

/** `.worktreeinclude` patterns: a trailing `/` names a folder, no `/` matches a base name anywhere. */
function includes(pattern: string, entry: string): boolean {
  const p = pattern.replace(/^\//, "");
  const path = entry.replace(/\/$/, "");
  if (p.endsWith("/")) return entry === p || entry.startsWith(p);
  if (!p.includes("/")) return globToRegExp(p).test(basename(path));
  return globToRegExp(p).test(path);
}

/** Copies the gitignored files `.worktreeinclude` names from `root` into `target`. */
function copyIncluded(root: string, target: string): string[] {
  const file = join(root, INCLUDE_FILE);
  if (!existsSync(file)) return [];
  const patterns = readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
  const ignored = git(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory"])
    .split("\n")
    .filter(Boolean);
  const copied = ignored.filter((entry) => patterns.some((p) => includes(p, entry)));
  for (const entry of copied) cpSync(join(root, entry), join(target, entry), { recursive: true });
  return copied;
}

/** A worktree for an active change on a branch of the same name, with its included files and setup. */
export function newWorktree(root: string, change: string, log: (text: string) => void): Outcome {
  const path = join(root, WORKTREES, change);
  const rel = posix(relative(root, path));
  if (!activeChanges(root).some((c) => c.name === change))
    return { lines: [`'${change}' is not an active change in openspec/changes/`], ok: false };
  if (existsSync(path)) return { lines: [`${rel} already exists`], ok: false };
  if (git(root, ["branch", "--list", change]).trim() !== "")
    return { lines: [`branch '${change}' already exists`], ok: false };
  git(root, ["worktree", "add", "--quiet", "-b", change, path, "HEAD"]);
  const lines = [`created ${rel} on branch ${change}`];
  for (const entry of copyIncluded(root, path)) lines.push(`copied ${entry}`);
  lines.push(...setupWorktree(path, log).lines);
  return { lines, ok: true };
}

/** Commits on `branch` that `base` lacks; rebased commits count as merged. */
const unmerged = (root: string, base: string, branch: string) =>
  git(root, ["cherry", base, branch])
    .split("\n")
    .filter((l) => l.startsWith("+")).length;

/** Removes clean worktrees under `.claude/worktrees/` merged into `ref` (default branch by default) and lists the others. */
export function cleanWorktrees(root: string, ref?: string): Outcome {
  if (ref !== undefined && !gitSucceeds(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]))
    throw new EnvError(`unknown base '${ref}'; nothing was removed`);
  const folder = join(root, WORKTREES);
  /** A folder directly inside `.claude/worktrees/`. */
  const isCandidate = (w: Worktree) => {
    if (!existsSync(folder) || !existsSync(w.path)) return false;
    const rel = relative(realpathSync(folder), realpathSync(w.path));
    return rel !== "" && !rel.startsWith("..") && !rel.includes(sep);
  };
  const candidates = listWorktrees(root).filter(isCandidate);
  if (candidates.length === 0) return { lines: [`no worktrees under ${WORKTREES}/`], ok: true };
  const base = ref ?? defaultBranch(root, undefined);
  const lines: string[] = [];
  let ok = true;
  for (const w of candidates) {
    const rel = posix(relative(realpathSync(root), realpathSync(w.path)));
    const reason = w.locked
      ? "locked, probably by a running agent"
      : w.branch === undefined
        ? "no branch"
        : git(w.path, ["status", "--porcelain"]).trim() !== ""
          ? "uncommitted changes"
          : unmerged(root, base, w.branch) > 0
            ? `not merged into ${base}`
            : undefined;
    if (reason) {
      lines.push(`kept ${rel}: ${reason}`);
      ok = false;
      continue;
    }
    git(root, ["worktree", "remove", w.path]);
    git(root, ["branch", "-D", w.branch as string]);
    lines.push(`removed ${rel} and branch ${w.branch}`);
  }
  return { lines, ok };
}
