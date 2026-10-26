import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/validate/index.ts";
import { run, tempDir } from "./helpers.ts";

const RUNBOOK = "knowledge/runbooks/rotate-keys.md";

/** Rewrites one fixture file's frontmatter line, keeping the rest valid. */
function edit(repo: string, rel: string, from: string | RegExp, to: string) {
  const path = join(repo, rel);
  const text = readFileSync(path, "utf8");
  const next = text.replace(from, to);
  if (next === text) throw new Error(`no match for ${from} in ${rel}`);
  writeFileSync(path, next);
}

async function findings(repo: string) {
  const result = await run(["validate", "--json"], repo);
  return JSON.parse(result.stdout).findings as {
    rule: string;
    path: string;
    line: number;
    severity: string;
    message: string;
  }[];
}

describe("validate: profile P1-P4", () => {
  it("accepts the valid fixture", async () => {
    expect(await findings(tempDir("valid"))).toEqual([]);
  });

  // spec: specfold-validate#unknown-type
  it("P1 reports a type missing from specfold.yaml", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "type: Runbook", "type: Glossary");
    const [f] = await findings(repo);
    expect(f).toMatchObject({ rule: "P1", line: 2 });
    expect((await run(["validate", "--json"], repo)).stdout).toContain("use one of: Term, Decision");
  });

  // spec: specfold-validate#description-too-long
  it("P2 reports a description over 160 characters", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "description: How to rotate signing keys.", `description: ${"x".repeat(161)}`);
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P2", line: 4 })]);
  });

  it("P2 accepts a description of exactly 160 characters", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "description: How to rotate signing keys.", `description: ${"x".repeat(160)}`);
    expect(await findings(repo)).toEqual([]);
  });

  // spec: specfold-validate#multi-line-description
  it("P2 reports a description with a line break", async () => {
    const repo = tempDir("valid");
    edit(
      repo,
      RUNBOOK,
      "description: How to rotate signing keys.",
      "description: |\n  How to rotate\n  signing keys.",
    );
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P2" })]);
  });

  it("P2 reports a missing title", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "title: Rotate keys\n", "");
    expect(await findings(repo)).toEqual([
      expect.objectContaining({ rule: "P2", message: "missing or empty 'title'" }),
    ]);
  });

  // spec: specfold-validate#missing-status
  it("P3 reports a missing status", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "status: draft\n", "");
    expect(await findings(repo)).toEqual([
      expect.objectContaining({ rule: "P3", message: "missing 'status'" }),
    ]);
  });

  it("P3 reports an unknown status", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "status: draft", "status: final");
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P3", line: 5 })]);
  });

  // spec: specfold-validate#neither-field
  it("P4 reports a concept with neither generated nor verified", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, /verified: .*\n/, "");
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P4" })]);
  });

  // spec: specfold-validate#bare-verified-mapping-accepted
  it("P4 accepts a bare verified mapping", async () => {
    const repo = tempDir("valid");
    const text = readFileSync(join(repo, RUNBOOK), "utf8");
    expect(text).toContain("verified: { by: human:ada");
    expect(await findings(repo)).toEqual([]);
  });

  // spec: specfold-validate#malformed-actor
  it("P4 reports a malformed actor", async () => {
    const repo = tempDir("valid");
    edit(repo, "knowledge/references/okf.md", "by: claude-code/test-model", "by: claude");
    const [f] = await findings(repo);
    expect(f).toMatchObject({ rule: "P4", path: "references/okf.md" });
    expect(f?.message).toContain("'claude'");
  });

  it("P4 reports a verified entry without at", async () => {
    const repo = tempDir("valid");
    edit(
      repo,
      RUNBOOK,
      "verified: { by: human:ada, at: 2026-10-21T09:00:00Z }",
      "verified: [{ by: human:ada }]",
    );
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P4" })]);
  });
});

describe("validate: profile P5-P8", () => {
  // spec: specfold-validate#offset-missing
  it("P5 reports a timestamp without offset", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "stale_after: 2027-01-01T00:00:00+01:00", "stale_after: 2027-01-01T00:00:00");
    expect(await findings(repo)).toEqual([expect.objectContaining({ rule: "P5", line: 7 })]);
  });

  it("P5 reports a date without time and an impossible date", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, "stale_after: 2027-01-01T00:00:00+01:00", "stale_after: 2027-02-30T00:00:00Z");
    edit(
      repo,
      "knowledge/references/okf.md",
      "last_modified: 2026-08-21T00:00:00Z",
      "last_modified: 2026-08-21",
    );
    expect((await findings(repo)).map((f) => f.rule)).toEqual(["P5", "P5"]);
  });

  // spec: specfold-validate#z-and-numeric-offsets-accepted
  it("P5 accepts Z and numeric offsets", async () => {
    const repo = tempDir("valid");
    const text = readFileSync(join(repo, "knowledge/decisions/use-yaml.md"), "utf8");
    expect(text).toContain("+02:00");
    expect(text).toContain("09:00:00Z");
    expect(await findings(repo)).toEqual([]);
  });

  // spec: specfold-validate#decision-without-sources
  it("P6 reports a Decision without sources", async () => {
    const repo = tempDir("valid");
    edit(
      repo,
      "knowledge/decisions/use-yaml.md",
      /sources:\n {2}- id: notes\n {4}resource: \.\.\/\.\.\/docs\/notes\.md\n/,
      "",
    );
    expect(await findings(repo)).toEqual([
      expect.objectContaining({ rule: "P6", path: "decisions/use-yaml.md" }),
    ]);
  });

  // spec: specfold-validate#source-without-resource
  it("P6 reports a source without resource", async () => {
    const repo = tempDir("valid");
    edit(
      repo,
      "knowledge/references/okf.md",
      "    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md\n",
      "",
    );
    expect(await findings(repo)).toEqual([
      expect.objectContaining({ rule: "P6", path: "references/okf.md" }),
    ]);
  });

  // spec: specfold-validate#runbook-without-stale-after
  it("P7 reports a Runbook without stale_after", async () => {
    const repo = tempDir("valid");
    edit(repo, RUNBOOK, /stale_after: .*\n/, "");
    expect(await findings(repo)).toEqual([
      expect.objectContaining({ rule: "P7", path: "runbooks/rotate-keys.md" }),
    ]);
  });

  // spec: specfold-validate#camel-case-file-name
  it("P8 reports file and folder names that are not kebab-case", async () => {
    const repo = tempDir("valid");
    const text = readFileSync(join(repo, RUNBOOK), "utf8");
    writeFileSync(join(repo, "knowledge/runbooks/RotateKeys.md"), text);
    mkdirSync(join(repo, "knowledge/Data_Flows"));
    writeFileSync(join(repo, "knowledge/Data_Flows/index.md"), "# Data flows\n");
    const p8 = (await findings(repo)).filter((f) => f.rule === "P8").map((f) => f.path);
    expect(p8).toEqual(["Data_Flows", "runbooks/RotateKeys.md"]);
  });
});
