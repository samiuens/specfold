import { EnvError, UsageError } from "../errors.ts";
import { git, gitSucceeds } from "../git.ts";

export const MIGRATION_BRANCH = "specfold/migration";
export const STATE_PATH = ".specfold/migration/state.json";
export const STATE_IGNORE_PATH = ".specfold/migration/.gitignore";

/** The root of the git working tree holding `cwd`; migrate runs before specfold.yaml exists. */
export function gitRoot(cwd: string): string {
  try {
    return git(cwd, ["rev-parse", "--show-toplevel"]).trim();
  } catch {
    throw new EnvError("specfold migrate needs a git repository: run it inside one, or run git init first");
  }
}

/** The checked-out branch, or undefined for a detached HEAD. */
export function currentBranch(root: string): string | undefined {
  try {
    return git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).trim() || undefined;
  } catch {
    return undefined;
  }
}

export const branchExists = (root: string, name: string) =>
  gitSucceeds(root, ["show-ref", "--verify", "--quiet", `refs/heads/${name}`]);

/** `--default-branch`, else the target of origin/HEAD, else exactly one of main and master. */
export function defaultBranch(root: string, flag: string | undefined): string {
  if (flag) return flag;
  try {
    const ref = git(root, ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"]).trim();
    if (ref.startsWith("refs/remotes/origin/")) return ref.slice("refs/remotes/origin/".length);
  } catch {
    // no remote default; fall back to the usual names
  }
  const current = currentBranch(root);
  // an unborn branch has no ref yet, but it is the branch being worked on
  const known = ["main", "master"].filter((b) => branchExists(root, b) || b === current);
  if (known.length === 1) return known[0] as string;
  throw new UsageError(
    `cannot tell the default branch (${known.length === 0 ? "no main or master" : "both main and master exist"}): pass --default-branch <name>`,
  );
}

/** Changed or untracked paths, without the migration state file and its .gitignore. */
export function dirtyPaths(root: string): string[] {
  return git(root, ["status", "--porcelain", "--untracked-files=all"])
    .split("\n")
    .filter((l) => l !== "")
    .map((l) => l.slice(3))
    .filter((p) => p !== STATE_PATH && p !== STATE_IGNORE_PATH);
}
