import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { EnvError } from "../errors.ts";
import { git, gitSucceeds } from "../git.ts";

export interface GateDiff {
  /** The ref the gate was given. */
  ref: string;
  /** Merge base of the ref and HEAD. */
  mergeBase: string;
  /** Changed files, repository-relative and sorted; deleted files included. */
  files: string[];
  /** Active change names with a changed file whose folder still exists. */
  activeChanges: string[];
  /** Archived change ids whose folder exists now but not at the merge base. */
  archivedChanges: string[];
  /** True when the merge base has no specfold.yaml: the branch adopts Specfold. */
  adoption: boolean;
}

const ACTIVE = /^openspec\/changes\/([^/]+)\//;
const ARCHIVED = /^openspec\/changes\/archive\/([^/]+)\//;
const lines = (text: string) => text.split("\n").filter((l) => l !== "");
const isDir = (path: string) => existsSync(path) && statSync(path).isDirectory();

/** What a branch changes against `ref`, relative to `root`; with `local`, uncommitted and untracked files too. */
export function computeDiff(root: string, ref: string, local: boolean): GateDiff {
  if (!gitSucceeds(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]))
    throw new EnvError(`unknown base '${ref}': not a git ref`);
  const mergeBase = git(root, ["merge-base", ref, "HEAD"]).trim();
  const files = new Set(
    lines(git(root, ["diff", "--name-only", "--no-renames", "--relative", mergeBase, "HEAD"])),
  );
  if (local) {
    for (const f of lines(git(root, ["diff", "--name-only", "--no-renames", "--relative", "HEAD"])))
      files.add(f);
    for (const f of lines(git(root, ["ls-files", "--others", "--exclude-standard"]))) files.add(f);
  }
  const sorted = [...files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const active = new Set<string>();
  const archived = new Set<string>();
  for (const f of sorted) {
    const id = ARCHIVED.exec(f)?.[1];
    if (id !== undefined) {
      archived.add(id);
      continue;
    }
    const name = ACTIVE.exec(f)?.[1];
    if (name !== undefined && name !== "archive") active.add(name);
  }
  return {
    ref,
    mergeBase,
    files: sorted,
    activeChanges: [...active].filter((n) => isDir(join(root, "openspec", "changes", n))),
    archivedChanges: [...archived].filter(
      (id) =>
        isDir(join(root, "openspec", "changes", "archive", id)) &&
        !gitSucceeds(root, ["cat-file", "-e", `${mergeBase}:./openspec/changes/archive/${id}`]),
    ),
    adoption: !gitSucceeds(root, ["cat-file", "-e", `${mergeBase}:./specfold.yaml`]),
  };
}
