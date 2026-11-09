import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commit, concept, gateRepo } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

const KNOWLEDGE =
  "profile: knowledge\ntypes: [Term, Decision, Reference, Capability]\nsource_globs: ['src/**']\n";

beforeEach(() => {
  // no OpenSpec anywhere: the knowledge profile must not need it
  vi.stubEnv("PATH", "/usr/bin:/bin");
});
afterEach(() => vi.unstubAllEnvs());

const ruleLines = (stdout: string, rule: string) => stdout.split("\n").filter((l) => l.includes(` ${rule} `));

describe("gate: knowledge profile", () => {
  // spec: specfold-gate#knowledge-repository-without-openspec
  it("runs without OpenSpec and reports no G3", async () => {
    const root = gateRepo({ "specfold.yaml": KNOWLEDGE });
    commit(root, { "knowledge/domain/a.md": concept("Term", "See [b](/domain/b.md). More.") });
    const result = await run(["gate", "--base", "main"], root);
    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
    expect(ruleLines(result.stdout, "G3")).toEqual([]);
  });

  // spec: specfold-gate#knowledge-rules-still-run
  it("still reports a broken link with G10", async () => {
    const root = gateRepo({ "specfold.yaml": KNOWLEDGE });
    commit(root, { "knowledge/domain/a.md": concept("Term", "See [gone](/domain/gone.md).") });
    const result = await run(["gate", "--base", "main"], root);
    expect(ruleLines(result.stdout, "G10").length).toBeGreaterThan(0);
  });
});
