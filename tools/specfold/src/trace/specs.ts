import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { walkFiles } from "../glob.ts";
import { scenarioSlug } from "../tasks/scenarios.ts";

export type Section = "main" | "ADDED" | "MODIFIED" | "REMOVED" | "RENAMED";

export interface Scenario {
  /** `<capability-path>#<slug>`. */
  id: string;
  capability: string;
  requirement: string;
  section: Section;
  /** Repository-relative spec file. */
  spec: string;
  line: number;
}

/** Requirements a delta removes, as `<capability>\n<requirement name>`. */
export interface ParsedSpecs {
  scenarios: Scenario[];
  removed: Set<string>;
}

const SECTION = /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements\s*$/;
const REQUIREMENT = /^###\s+Requirement:\s*(.+?)\s*$/;
const SCENARIO = /^####\s+Scenario:\s*(.+?)\s*$/;

/** Scenarios of one spec file; `delta` files take their section from `## ADDED Requirements` and the like. */
function parseSpec(text: string, capability: string, spec: string, delta: boolean, into: ParsedSpecs): void {
  let section: Section = delta ? "ADDED" : "main";
  let requirement = "";
  text.split("\n").forEach((line, i) => {
    const s = delta ? SECTION.exec(line) : null;
    if (s) {
      section = s[1] as Section;
      requirement = "";
      return;
    }
    const r = REQUIREMENT.exec(line);
    if (r) {
      requirement = r[1] as string;
      if (section === "REMOVED") into.removed.add(`${capability}\n${requirement}`);
      return;
    }
    const sc = SCENARIO.exec(line);
    if (sc)
      into.scenarios.push({
        id: `${capability}#${scenarioSlug(sc[1] as string)}`,
        capability,
        requirement,
        section,
        spec,
        line: i + 1,
      });
  });
}

/** Every scenario below `<repoRoot>/<specsRel>` (`openspec/specs` or a change's `specs` folder). */
export function parseSpecs(repoRoot: string, specsRel: string, delta: boolean): ParsedSpecs {
  const parsed: ParsedSpecs = { scenarios: [], removed: new Set() };
  const dir = join(repoRoot, specsRel);
  if (!existsSync(dir)) return parsed;
  for (const rel of walkFiles(dir)) {
    if (!rel.endsWith("/spec.md")) continue;
    const capability = rel.slice(0, -"/spec.md".length);
    parseSpec(readFileSync(join(dir, rel), "utf8"), capability, `${specsRel}/${rel}`, delta, parsed);
  }
  return parsed;
}

/** `ADDED` and `MODIFIED` scenarios: what a change asks tests for. */
export const changedScenarios = (parsed: ParsedSpecs) =>
  parsed.scenarios.filter((s) => s.section === "ADDED" || s.section === "MODIFIED");
