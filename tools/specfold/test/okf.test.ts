import { createHash } from "node:crypto";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/validate/index.ts";
import { run, tempDir } from "./helpers.ts";

const write = (repo: string, rel: string, text: string) => writeFileSync(join(repo, "knowledge", rel), text);
const json = async (repo: string, ...args: string[]) => {
  const result = await run(["validate", "--json", ...args], repo);
  return { code: result.code, ...JSON.parse(result.stdout) };
};

function snapshot(dir: string): string {
  const hash = createHash("sha256");
  for (const name of readdirSync(dir, { recursive: true, encoding: "utf8" }).sort()) {
    hash.update(name);
    try {
      hash.update(readFileSync(join(dir, name)));
    } catch {
      // a directory
    }
  }
  return hash.digest("hex");
}

describe("validate: OKF-1 and OKF-2", () => {
  // spec: specfold-validate#missing-configuration
  it("exits with 2 without specfold.yaml unless --okf-only", async () => {
    const repo = tempDir("valid");
    rmSync(join(repo, "specfold.yaml"));
    const result = await run(["validate", "--bundle", "knowledge"], repo);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no specfold.yaml found");
  });

  // spec: specfold-validate#missing-frontmatter
  it("reports a concept without frontmatter", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/term.md", "# Term\n");
    const out = await json(repo);
    expect(out.code).toBe(1);
    expect(out.findings).toContainEqual(
      expect.objectContaining({ rule: "OKF-1", path: "decisions/term.md", line: 1 }),
    );
  });

  // spec: specfold-validate#invalid-yaml
  it("reports invalid YAML with the line of the parse error", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/bad.md", "---\ntype: Decision\ntitle: [unclosed\n---\n\nBody\n");
    const out = await json(repo);
    const finding = out.findings.find((f: { rule: string }) => f.rule === "OKF-1");
    expect(finding).toMatchObject({ path: "decisions/bad.md", severity: "error" });
    expect(finding.line).toBeGreaterThanOrEqual(3);
  });

  // spec: specfold-validate#empty-type
  it("reports an empty type", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/empty.md", '---\ntitle: X\ntype: ""\n---\n');
    const out = await json(repo, "--okf-only");
    expect(out.findings).toEqual([
      expect.objectContaining({ rule: "OKF-2", path: "decisions/empty.md", line: 3 }),
    ]);
  });

  // spec: specfold-validate#files-unchanged
  it("never modifies files", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/term.md", "# Term\n");
    const before = snapshot(repo);
    await run(["validate"], repo);
    await run(["validate", "--json"], repo);
    expect(snapshot(repo)).toBe(before);
  });

  // spec: specfold-validate#deterministic-order
  it("prints the same findings in the same order on every run", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/b.md", "# B\n");
    write(repo, "decisions/a.md", "---\ntype: ''\n---\n");
    const first = await run(["validate", "--okf-only"], repo);
    const second = await run(["validate", "--okf-only"], repo);
    expect(first.stdout).toBe(second.stdout);
    expect(first.stdout.indexOf("decisions/a.md")).toBeLessThan(first.stdout.indexOf("decisions/b.md"));
  });

  // spec: specfold-validate#machine-readable-result
  it("prints one JSON object with ok false and the error", async () => {
    const repo = tempDir("valid");
    write(repo, "decisions/term.md", "# Term\n");
    const result = await run(["validate", "--json", "--okf-only"], repo);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toMatchObject({ ok: false, errors: 1 });
    expect(parsed.findings).toEqual([expect.objectContaining({ severity: "error", rule: "OKF-1" })]);
  });
});
