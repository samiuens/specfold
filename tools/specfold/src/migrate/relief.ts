import { readFileSync } from "node:fs";
import { join } from "node:path";
import { git } from "../git.ts";
import { readState } from "./state.ts";

/** What hooks may relieve while a migration's conversion is under way. */
export interface MigrationRelief {
  /** `.specfold/migration/state.json` exists and `convert` is not marked. */
  active: boolean;
  /** Whether a repository-relative file under `knowledge/` still equals the migration's base commit. */
  isOriginal(path: string): boolean;
}

const NONE: MigrationRelief = { active: false, isOriginal: () => false };

/** The relief for `root`; inactive without a migration, after `convert`, or without a base commit. */
export function migrationRelief(root: string): MigrationRelief {
  const state = readState(root);
  if (Object.keys(state.steps).length === 0 || state.steps.convert || !state.base) return NONE;
  const base = state.base;
  const cache = new Map<string, boolean>();
  return {
    active: true,
    isOriginal(path) {
      if (!path.startsWith("knowledge/")) return false;
      const known = cache.get(path);
      if (known !== undefined) return known;
      let same = false;
      try {
        same = git(root, ["show", `${base}:${path}`]) === readFileSync(join(root, path), "utf8");
      } catch {
        // not in the base commit, or gone from the working tree
      }
      cache.set(path, same);
      return same;
    },
  };
}

/** During a migration's conversion, link findings and findings in unchanged originals only warn. */
export const relieved = (relief: MigrationRelief, f: { rule: string }, path: string) =>
  relief.active && (f.rule === "L1" || f.rule === "L2" || relief.isOriginal(path));
