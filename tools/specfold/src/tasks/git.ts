import { execFileSync } from "node:child_process";
import { EnvError } from "../errors.ts";

export interface Commit {
  sha: string;
  /** Values of every `Task:` trailer, as written. */
  tasks: string[];
  /** Files the commit changed, repository-relative. */
  files: string[];
}

const RECORD = "\x1d";
const FIELD = "\x1f";
const VALUE = "\x1e";

function git(repoRoot: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? "")
      .trim()
      .split("\n")[0];
    throw new EnvError(`git ${args[0]} failed${stderr ? `: ${stderr}` : ""}`);
  }
}

/** Commits in `range` (oldest first) with their `Task:` trailers and changed files. */
export function readCommits(repoRoot: string, range: string, withFiles = true): Commit[] {
  const format = `--format=${RECORD}%H${FIELD}%(trailers:key=Task,valueonly,separator=%x1e)`;
  const args = ["log", "--reverse", format, ...(withFiles ? ["--name-only"] : []), range, "--"];
  return git(repoRoot, args)
    .split(RECORD)
    .filter((chunk) => chunk.trim() !== "")
    .map((chunk) => {
      const [header = "", ...rest] = chunk.split("\n");
      const [sha = "", values = ""] = header.split(FIELD);
      return {
        sha,
        tasks: values
          .split(VALUE)
          .map((v) => v.trim())
          .filter(Boolean),
        files: rest.map((l) => l.trim()).filter(Boolean),
      };
    });
}

/** Commits from the merge base of `base` and HEAD up to HEAD; an unknown base is an environment error. */
export function commitsSinceBase(repoRoot: string, base: string): Commit[] {
  const mergeBase = git(repoRoot, ["merge-base", base, "HEAD"]).trim();
  return readCommits(repoRoot, `${mergeBase}..HEAD`);
}

/** Task ids of `change` named by a commit's trailers. */
export const taskIdsFor = (commit: Commit, change: string): string[] =>
  commit.tasks.filter((t) => t.startsWith(`${change}#`)).map((t) => t.slice(change.length + 1));
