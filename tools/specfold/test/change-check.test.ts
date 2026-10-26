import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

const CHANGE = "openspec/changes/demo";

function mutate(repo: string, file: string, from: string, to: string): void {
  const path = join(repo, CHANGE, file);
  const text = readFileSync(path, "utf8");
  if (!text.includes(from)) throw new Error(`${file} does not contain ${from}`);
  writeFileSync(path, text.replace(from, to));
}

describe("change check: command", () => {
  // spec: specfold-change-check#clean-change
  it("exits with 0 for a valid change", async () => {
    const result = await run(["change", "check", "demo"], tempDir("change"));
    expect(result).toMatchObject({ code: 0, stdout: "change check demo: 0 errors, 0 warnings\n" });
  });

  // spec: specfold-change-check#unknown-change
  it("exits with 2 for an unknown change", async () => {
    const result = await run(["change", "check", "missing-change"], tempDir("change"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown change 'missing-change'");
  });

  it("rejects missing or malformed arguments", async () => {
    const repo = tempDir("change");
    for (const argv of [
      ["change"],
      ["change", "lint", "demo"],
      ["change", "check"],
      ["change", "check", "a", "b"],
    ])
      expect((await run(argv, repo)).code, argv.join(" ")).toBe(2);
  });

  // spec: specfold-change-check#json-output
  it("prints findings as JSON with the file relative to the repository", async () => {
    const repo = tempDir("change");
    mutate(
      repo,
      "brief.md",
      "## Confirmation\n\nconfirmed_by: human:samiuens\nconfirmed_at: 2026-10-26T10:00:00+01:00\n",
      "",
    );
    const result = await run(["change", "check", "demo", "--json"], repo);
    expect(result.code).toBe(1);
    const out = JSON.parse(result.stdout);
    expect(out).toMatchObject({ ok: false, change: "demo", errors: 1, warnings: 0 });
    expect(out.findings).toEqual([
      expect.objectContaining({
        rule: "B1",
        severity: "error",
        file: `${CHANGE}/brief.md`,
        group: null,
        task: null,
      }),
    ]);
  });

  // spec: specfold-change-check#tasks-error-fails-change-check
  it("includes tasks findings and fails on a tasks error", async () => {
    const repo = tempDir("change");
    mutate(repo, "tasks.md", "files: [src/mail/**]", "files: [src/mail/**]\ndepends: [3]");
    const result = await run(["change", "check", "demo"], repo);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe(
      `${CHANGE}/tasks.md:15 T4 groups 2, 3 depend on each other in a cycle\nchange check demo: 1 error, 0 warnings\n`,
    );
  });

  it("orders findings by file and accepts the short brief of a skip_specs change", async () => {
    const repo = tempDir("change");
    writeFileSync(join(repo, CHANGE, ".openspec.yaml"), "schema: specfold\nskip_specs: true\n");
    mutate(repo, "brief.md", "## Out of scope\n\n- Refunds\n\n", "");
    mutate(repo, "knowledge.md", "path: capabilities/guest-checkout.md", "path: capabilities/other.md");
    expect((await run(["change", "check", "demo"], repo)).code).toBe(0);
    writeFileSync(join(repo, CHANGE, ".openspec.yaml"), "schema: specfold\n");
    const out = JSON.parse((await run(["change", "check", "demo", "--json"], repo)).stdout);
    expect(out.findings.map((f: { rule: string }) => f.rule)).toEqual(["B1", "K5"]);
  });
});
