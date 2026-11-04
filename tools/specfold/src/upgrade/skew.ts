// see knowledge: /architecture/upgrade-flow.md
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EnvError } from "../errors.ts";
import { MANIFEST_PATH } from "../migrate/install.ts";
import { findRepoRoot } from "../repo.ts";
import { compareVersions, isVersion } from "./version.ts";

type Values = Record<string, string | boolean | undefined>;

/** The commands that write files, by name; every other command and subcommand only reads. */
const WRITES: Record<string, (positionals: string[], values: Values) => boolean> = {
  agents: (p, v) => p[0] === "sync" && v.check !== true,
  backlog: (p) => p[0] !== undefined && p[0] !== "list",
  commitments: (p) => p[0] !== undefined && p[0] !== "list",
  graphify: (p) => p[0] === "setup",
  hooks: (p) => p[0] === "install",
  index: (_p, v) => v.check !== true,
  init: (_p, v) => v["dry-run"] !== true,
  log: (p) => p[0] === "add",
  migrate: (p) => p[0] !== undefined && p[0] !== "status",
  new: () => true,
  parallel: (p) => p[0] === "set",
  permissions: (p, v) => p[0] === "sync" && v.check !== true,
  sync: (_p, v) => v["dry-run"] !== true,
  verify: () => true,
  wt: (p) => p[0] !== undefined && p[0] !== "plan",
};

export const writes = (command: string, positionals: string[], values: Values) =>
  WRITES[command]?.(positionals, values) ?? false;

/**
 * Stops a write command when the nearest Specfold root's manifest was written by a newer kit than the
 * running CLI; a version that isn't semver on either side skips the check.
 */
export function refuseSkew(cwd: string, cliVersion: string): void {
  const root = findRepoRoot(cwd);
  if (!root || !isVersion(cliVersion)) return;
  let recorded: unknown;
  try {
    recorded = (JSON.parse(readFileSync(join(root, MANIFEST_PATH), "utf8")) as { kit_version?: unknown })
      .kit_version;
  } catch {
    return;
  }
  if (typeof recorded !== "string" || !isVersion(recorded) || compareVersions(recorded, cliVersion) <= 0)
    return;
  throw new EnvError(
    `${MANIFEST_PATH} was written by Specfold ${recorded}, newer than this CLI (${cliVersion}); run 'specfold upgrade' or use the repository's own scripts/specfold.mjs`,
  );
}
