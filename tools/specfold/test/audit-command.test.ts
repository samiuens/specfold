import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

const write = (root: string, rel: string, content: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

function repo(staleAfter?: string): string {
  const root = tempDir();
  const at = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  write(root, "specfold.yaml", "types: [Term]\n");
  const stale = staleAfter ? `\nstale_after: ${staleAfter}` : "";
  write(
    root,
    "knowledge/domain/a.md",
    `---\ntype: Term\nstatus: draft\ngenerated: { by: x/y, at: ${at} }${stale}\n---\n\n[b](b.md)\n`,
  );
  write(
    root,
    "knowledge/domain/b.md",
    `---\ntype: Term\nstatus: draft\ngenerated: { by: x/y, at: ${at} }\n---\n\n[a](a.md)\n`,
  );
  return root;
}

describe("audit: command", () => {
  // spec: specfold-audit#clean-bundle
  it("prints a summary with 0 findings and exits with 0", async () => {
    expect(await run(["audit"], repo())).toMatchObject({ code: 0, stdout: "audit: 0 findings\n" });
  });

  // spec: specfold-audit#json-report
  it("prints findings and counts as JSON and exits with 1", async () => {
    const result = await run(["audit", "--json"], repo("2020-01-01T00:00:00Z"));
    expect(result.code).toBe(1);
    const out = JSON.parse(result.stdout);
    expect(out).toMatchObject({ ok: false, counts: { A1: 1 } });
    expect(out.findings).toEqual([
      expect.objectContaining({ rule: "A1", severity: "warning", path: "domain/a.md" }),
    ]);
  });

  it("prints one line per finding and counts per rule", async () => {
    const result = await run(["audit"], repo("2020-01-01T00:00:00Z"));
    expect(result.stdout).toBe(
      "domain/a.md:5 A1 stale since 2020-01-01T00:00:00Z\naudit: 1 finding (A1 1)\n",
    );
  });

  it("rejects extra arguments", async () => {
    expect((await run(["audit", "x"], repo())).code).toBe(2);
  });
});
