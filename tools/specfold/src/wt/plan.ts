import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { git } from "../git.ts";
import { sharedFiles } from "../tasks/overlap.ts";
import { parseTasks } from "../tasks/parse.ts";
import { KNOWLEDGE_GROUP } from "../tasks/rules.ts";

export interface ActiveChange {
  name: string;
  capabilities: string[];
  /** Owned globs of every group except "Knowledge"; undefined without `tasks.md`. */
  files: string[] | undefined;
}

export interface Conflict {
  first: string;
  second: string;
  reason: string;
}

const CHANGES = "openspec/changes";
const dirs = (path: string) =>
  existsSync(path)
    ? readdirSync(path)
        .filter((d) => !d.startsWith(".") && statSync(join(path, d)).isDirectory())
        .sort()
    : [];

/** The active changes with the capabilities their delta specs touch and the files their groups own. */
export function activeChanges(root: string): ActiveChange[] {
  return dirs(join(root, CHANGES))
    .filter((d) => d !== "archive")
    .map((name) => {
      const tasks = join(root, CHANGES, name, "tasks.md");
      const files = existsSync(tasks)
        ? parseTasks(readFileSync(tasks, "utf8"))
            .groups.filter((g) => g.name !== KNOWLEDGE_GROUP)
            .flatMap((g) => g.meta?.files ?? [])
        : undefined;
      return { name, capabilities: dirs(join(root, CHANGES, name, "specs")), files };
    });
}

/** Why two changes must not run at the same time, or undefined when they may. */
function conflictOf(a: ActiveChange, b: ActiveChange, repoFiles: () => string[]): string | undefined {
  const shared = a.capabilities.find((c) => b.capabilities.includes(c));
  if (shared) return `both change capability ${shared}`;
  if (a.files === undefined || b.files === undefined)
    return `${a.files === undefined ? a.name : b.name} has no tasks.md yet`;
  const files = sharedFiles(a.files, b.files, repoFiles);
  return files ? `both own ${files}` : undefined;
}

/** Conflicting pairs, and batches of changes that may run in parallel, each at most `limit` long. */
export function planBatches(root: string, limit: number): { conflicts: Conflict[]; batches: string[][] } {
  const changes = activeChanges(root);
  let files: string[] | undefined;
  const repoFiles = () => {
    files ??= git(root, ["ls-files"]).split("\n").filter(Boolean);
    return files;
  };
  const conflicts: Conflict[] = [];
  for (let i = 0; i < changes.length; i++)
    for (let j = i + 1; j < changes.length; j++) {
      const reason = conflictOf(changes[i] as ActiveChange, changes[j] as ActiveChange, repoFiles);
      if (reason)
        conflicts.push({
          first: (changes[i] as ActiveChange).name,
          second: (changes[j] as ActiveChange).name,
          reason,
        });
    }
  const clash = (a: string, b: string) =>
    conflicts.some((c) => (c.first === a && c.second === b) || (c.first === b && c.second === a));
  const batches: string[][] = [];
  for (const { name } of changes) {
    const batch = batches.find((b) => b.length < limit && b.every((other) => !clash(name, other)));
    if (batch) batch.push(name);
    else batches.push([name]);
  }
  return { conflicts, batches };
}
