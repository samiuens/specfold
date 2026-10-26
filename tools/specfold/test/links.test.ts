import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

const OKF = "knowledge/references/okf.md";

function append(repo: string, rel: string, text: string) {
  const path = join(repo, rel);
  writeFileSync(path, `${readFileSync(path, "utf8")}${text}`);
}

async function result(repo: string) {
  const r = await run(["validate", "--json"], repo);
  return { code: r.code, findings: JSON.parse(r.stdout).findings };
}

describe("validate: links", () => {
  // spec: specfold-validate#broken-bundle-absolute-link
  it("L1 reports a broken bundle-absolute link at its line", async () => {
    const repo = tempDir("valid");
    append(repo, OKF, "\nSee [payments](/architecture/missing.md).\n");
    const { code, findings } = await result(repo);
    expect(code).toBe(1);
    expect(findings).toEqual([
      expect.objectContaining({ rule: "L1", severity: "error", path: "references/okf.md", line: 18 }),
    ]);
  });

  it("L1 reports relative links that leave the bundle or do not exist", async () => {
    const repo = tempDir("valid");
    append(repo, OKF, "\n[a](../../docs/notes.md) and [b](missing.md) and [c](../runbooks/rotate-keys.md)\n");
    const { findings } = await result(repo);
    expect(findings.map((f: { message: string }) => f.message)).toEqual([
      "broken link '../../docs/notes.md'",
      "broken link 'missing.md'",
    ]);
  });

  // spec: specfold-validate#external-links-ignored
  it("L1 ignores external links, anchors and links in code", async () => {
    const repo = tempDir("valid");
    append(
      repo,
      OKF,
      "\n[x](https://example.com/x.md) [y](#summary) [m](mailto:a@b.c) `[z](/nope.md)`\n\n```\n[w](/nope.md)\n```\n",
    );
    expect((await result(repo)).findings).toEqual([]);
  });

  // spec: specfold-validate#configured-as-warning
  it("L1 is a warning when block_on_broken_links is false", async () => {
    const repo = tempDir("valid");
    writeFileSync(
      join(repo, "specfold.yaml"),
      "types: [Term, Decision, Capability, Runbook, Reference]\ngate:\n  block_on_broken_links: false\n",
    );
    append(repo, OKF, "\nSee [payments](/architecture/missing.md).\n");
    const { code, findings } = await result(repo);
    expect(code).toBe(0);
    expect(findings).toEqual([expect.objectContaining({ rule: "L1", severity: "warning" })]);
  });

  it("L1 is not checked under --okf-only", async () => {
    const repo = tempDir("valid");
    append(repo, OKF, "\nSee [payments](/architecture/missing.md).\n");
    expect((await run(["validate", "--okf-only"], repo)).code).toBe(0);
  });

  // spec: specfold-validate#missing-source-file
  it("L2 reports a source path that does not exist", async () => {
    const repo = tempDir("valid");
    const path = join(repo, "knowledge/decisions/use-yaml.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("../../docs/notes.md", "../../docs/missing.md"));
    expect((await result(repo)).findings).toEqual([
      expect.objectContaining({ rule: "L2", path: "decisions/use-yaml.md", line: 10 }),
    ]);
  });
});
