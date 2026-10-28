// see knowledge: /architecture/upgrade-flow.md
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { EnvError } from "../errors.ts";

/** What a migration's default export receives. */
export interface MigrationContext {
  /** The Specfold root being upgraded. */
  root: string;
  /** The unpacked target release. */
  from: string;
  /** The migration's own version. */
  version: string;
  /** Adds a line to the upgrade report. */
  report: (line: string) => void;
}

/**
 * Runs `upgrade/migrations/<version>.mjs` of the release in `from` for each version, in the given order.
 * Migrations are idempotent; one that throws stops the upgrade before the commit.
 */
export async function runMigrations(
  root: string,
  from: string,
  versions: string[],
  report: (version: string, line: string) => void,
): Promise<void> {
  for (const version of versions) {
    const file = join(from, "upgrade/migrations", `${version}.mjs`);
    try {
      const module = (await import(pathToFileURL(file).href)) as { default?: unknown };
      if (typeof module.default !== "function") throw new Error("has no default export function");
      await module.default({ root, from, version, report: (line: string) => report(version, line) });
    } catch (error) {
      throw new EnvError(`migration ${version} failed: ${(error as Error).message}; nothing was committed`);
    }
  }
}
