import { readFileSync, writeFileSync } from "node:fs";
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
