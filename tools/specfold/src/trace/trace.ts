import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "../repo.ts";
import { scanTestReferences, type TestReference } from "./refs.ts";
import { changedScenarios, type ParsedSpecs, parseSpecs, type Scenario } from "./specs.ts";

export interface TracedScenario {
  id: string;
  /** Repository-relative spec file that defines the scenario. */
  spec: string;
  line: number;
  refs: { file: string; line: number }[];
}

export interface TraceReport {
  scenarios: TracedScenario[];
  dangling: TestReference[];
}

/** Specs and references of a repository, read once and shared by `trace` and gate rule G15. */
export interface TraceIndex {
  main: ParsedSpecs;
  /** Parsed delta specs per active change name. */
  active: Map<string, ParsedSpecs>;
  /** Every known scenario id, first definition wins (main specs first). */
  known: Map<string, Scenario>;
  refs: TestReference[];
}

const CHANGES = join("openspec", "changes");

const activeChangeNames = (root: string) =>
  existsSync(join(root, CHANGES))
    ? readdirSync(join(root, CHANGES), { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== "archive" && !d.name.startsWith("."))
        .map((d) => d.name)
        .sort()
    : [];

export const changeSpecs = (root: string, changeRel: string) => parseSpecs(root, `${changeRel}/specs`, true);

export function buildTraceIndex(config: Config): TraceIndex {
  const root = config.root;
  const main = parseSpecs(root, "openspec/specs", false);
  const active = new Map(activeChangeNames(root).map((n) => [n, changeSpecs(root, `openspec/changes/${n}`)]));
  const removed = new Set([...active.values()].flatMap((p) => [...p.removed]));
  const known = new Map<string, Scenario>();
  const add = (s: Scenario) => {
    if (!known.has(s.id)) known.set(s.id, s);
  };
  main.scenarios.filter((s) => !removed.has(`${s.capability}\n${s.requirement}`)).forEach(add);
  for (const p of active.values()) changedScenarios(p).forEach(add);
  return { main, active, known, refs: scanTestReferences(root, config.traceTestGlobs) };
}

/** Scenarios with their references, for the given scenarios or every known one, plus all dangling references. */
export function traceReport(index: TraceIndex, scope?: Scenario[]): TraceReport {
  const byId = new Map<string, { file: string; line: number }[]>();
  for (const r of index.refs) byId.set(r.id, [...(byId.get(r.id) ?? []), { file: r.file, line: r.line }]);
  const seen = new Set<string>();
  const scenarios: TracedScenario[] = [];
  for (const s of scope ?? [...index.known.values()]) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    scenarios.push({ id: s.id, spec: s.spec, line: s.line, refs: byId.get(s.id) ?? [] });
  }
  return { scenarios, dangling: index.refs.filter((r) => !index.known.has(r.id)) };
}
