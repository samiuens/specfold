import { fileURLToPath } from "node:url";
import { git } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

/** The kit's real template folder, the source `migrate install --from` takes. */
export const TEMPLATE = fileURLToPath(new URL("../../../template", import.meta.url));

/** A git repository on `main` holding one committed copy of a migration fixture (or nothing). */
export function fixtureRepo(fixture?: "adr-docs" | "cursor-openspec" | "okf-bundle"): string {
  const root = tempDir(fixture ? `migrate/${fixture}` : undefined);
  git(root, "init", "-q", "-b", "main");
  git(root, "add", "-A");
  git(root, "commit", "-q", "--allow-empty", "-m", "initial");
  return root;
}
