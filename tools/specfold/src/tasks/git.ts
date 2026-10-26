import { git } from "../git.ts";
import { matchesAny } from "../glob.ts";
import type { Task, TasksFile } from "./parse.ts";
import type { TaskFinding } from "./rules.ts";

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

export interface TrailerContext {
  change: string;
  /** Repository-relative path of the change's tasks.md, never counted against scope or size. */
  file: string;
  maxFilesPerTask: number;
}

/** Rules T10 and T11: task commits against the breakdown. */
export function checkTrailers(tasks: TasksFile, commits: Commit[], ctx: TrailerContext): TaskFinding[] {
  const out: TaskFinding[] = [];
  const add = (rule: string, task: Task | null, group: number | null, message: string, fix: string) =>
    out.push({
      rule,
      severity: "warning",
      file: ctx.file,
      group,
      task: task?.id ?? null,
      line: task?.line ?? null,
      message,
      fix,
    });

  const byTask = new Map<string, Commit[]>();
  for (const commit of commits) {
    for (const id of taskIdsFor(commit, ctx.change)) byTask.set(id, [...(byTask.get(id) ?? []), commit]);
  }
  const known = new Map(
    tasks.groups.flatMap((g) => g.tasks.map((t) => [t.id, { task: t, group: g }] as const)),
  );

  for (const [id, list] of byTask) {
    if (!known.has(id)) {
      for (const c of list)
        add(
          "T11",
          null,
          null,
          `commit ${c.sha.slice(0, 7)} names unknown task ${ctx.change}#${id}`,
          "fix the trailer or add the task to tasks.md",
        );
    }
  }
  for (const group of tasks.groups) {
    for (const task of group.tasks) {
      const list = byTask.get(task.id) ?? [];
      if (task.done && list.length === 0)
        add(
          "T11",
          task,
          group.number,
          `task ${task.id} is ticked but no commit carries 'Task: ${ctx.change}#${task.id}'`,
          "commit the task's work with its trailer",
        );
      if (list.length > 1)
        add(
          "T11",
          task,
          group.number,
          `task ${task.id} has ${list.length} commits: ${list.map((c) => c.sha.slice(0, 7)).join(", ")}`,
          "complete each task in exactly one commit",
        );
      const files = new Set(list.flatMap((c) => c.files).filter((f) => f !== ctx.file));
      const owned = group.meta?.files;
      if (owned) {
        for (const f of files) {
          if (!matchesAny(f, owned))
            add(
              "T11",
              task,
              group.number,
              `task ${task.id} changed ${f}, outside group ${group.number}'s files`,
              "split the work or ask to widen the group's files",
            );
        }
      }
      if (files.size > ctx.maxFilesPerTask)
        add(
          "T10",
          task,
          group.number,
          `task ${task.id} changed ${files.size} files, more than ${ctx.maxFilesPerTask}`,
          "split the task into smaller tasks",
        );
    }
  }
  return out;
}
