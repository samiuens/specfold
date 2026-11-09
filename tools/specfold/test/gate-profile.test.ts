import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commit, concept, gateRepo, write } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

const KNOWLEDGE =
  "profile: knowledge\ntypes: [Term, Decision, Reference, Capability]\nsource_globs: ['src/**']\n";

beforeEach(() => {
  // no OpenSpec anywhere: the knowledge profile must not need it
  vi.stubEnv("PATH", "/usr/bin:/bin");
});
afterEach(() => vi.unstubAllEnvs());

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

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

describe("gate: G19 source changes need knowledge", () => {
  const settings = `${KNOWLEDGE}gate:\n  escape_label: no-knowledge\n`;

  // spec: specfold-gate#code-without-knowledge
  it("blocks a source change without a knowledge change", async () => {
    const root = gateRepo({ "specfold.yaml": settings });
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const result = await run(["gate", "--base", "main", "--json"], root);
    expect(result.code).toBe(1);
    const g19 = JSON.parse(result.stdout).findings.filter((f: { rule: string }) => f.rule === "G19");
    expect(g19).toHaveLength(1);
    expect(g19[0]).toMatchObject({ effect: "block", path: "src/app.ts" });
    expect(g19[0].fix).toContain("knowledge/");
    expect(g19[0].fix).toContain("no-knowledge");
  });

  // spec: specfold-gate#code-with-a-log-entry
  it("accepts a source change with a log entry", async () => {
    const root = gateRepo({ "specfold.yaml": settings });
    commit(root, {
      "src/app.ts": "export const app = 2;\n",
      "knowledge/log.md": "# Log\n\n## 2026-11-09\n\n* app is 2\n",
    });
    const result = await run(["gate", "--base", "main"], root);
    expect(ruleLines(result.stdout, "G19")).toEqual([]);
  });

  // spec: specfold-gate#knowledge-escape-with-reason
  it("accepts the escape label with a No-knowledge reason line", async () => {
    const root = gateRepo({ "specfold.yaml": settings });
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    write(root, "body.md", "Knowledge: none\n\nNo-knowledge reason: dependency bump\n");
    const result = await run(
      ["gate", "--base", "main", "--label", "no-knowledge", "--pr-body", "body.md"],
      root,
    );
    expect(ruleLines(result.stdout, "G19")).toEqual([]);
    const unreasoned = await run(["gate", "--base", "main", "--label", "no-knowledge"], root);
    expect(ruleLines(unreasoned.stdout, "G19").join("\n")).toContain("No-knowledge reason:");
  });

  it("only warns with --local", async () => {
    const root = gateRepo({ "specfold.yaml": settings });
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const result = await run(["gate", "--base", "main", "--local", "--json"], root);
    const g19 = JSON.parse(result.stdout).findings.filter((f: { rule: string }) => f.rule === "G19");
    expect(g19.map((f: { effect: string }) => f.effect)).toEqual(["warn"]);
  });

  // spec: specfold-gate#full-profile
  it("never runs in the full profile", async () => {
    vi.stubEnv("PATH", `${KIT_BIN}:/usr/bin:/bin`);
    const root = gateRepo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const result = await run(["gate", "--base", "main", "--json"], root);
    const rules = JSON.parse(result.stdout).findings.map((f: { rule: string }) => f.rule);
    expect(rules).toContain("G4");
    expect(rules).not.toContain("G19");
  });
});
