import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { walkFiles } from "../glob.ts";

const SCENARIO = /^#### Scenario:\s*(.+?)\s*$/gm;

/** `Ticking tasks.md is not scope widening` → `ticking-tasks-md-is-not-scope-widening`. */
export const scenarioSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function collect(specsDir: string, into: Set<string>): void {
  if (!existsSync(specsDir)) return;
  for (const rel of walkFiles(specsDir)) {
    if (!rel.endsWith("/spec.md")) continue;
    const capability = rel.slice(0, -"/spec.md".length);
    for (const m of readFileSync(join(specsDir, rel), "utf8").matchAll(SCENARIO)) {
      into.add(`${capability}#${scenarioSlug(m[1] as string)}`);
    }
  }
}

/** Scenario ids `<capability-path>#<slug>` from the change's delta specs and from openspec/specs/. */
export function knownScenarioIds(repoRoot: string, changeDir: string): Set<string> {
  const ids = new Set<string>();
  collect(join(changeDir, "specs"), ids);
  collect(join(repoRoot, "openspec", "specs"), ids);
  return ids;
}
