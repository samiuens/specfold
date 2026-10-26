import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

describe("index: check mode and output", () => {
  // spec: specfold-index#broken-concept-skipped
  it("skips an unparseable concept, writes the rest and exits with 1", async () => {
    const repo = tempDir("index/repo");
    writeFileSync(join(repo, "knowledge/decisions/bad.md"), "---\ntype: Decision\ntitle: [x\n---\n");
    const result = await run(["index", "--json"], repo);
    const out = JSON.parse(result.stdout);
    expect(result.code).toBe(1);
    expect(out.findings).toContainEqual(
      expect.objectContaining({ rule: "I1", severity: "error", path: "knowledge/decisions/bad.md" }),
    );
    expect(out.written).toContain("knowledge/decisions/index.md");
    expect(readFileSync(join(repo, "knowledge/decisions/index.md"), "utf8")).not.toContain("bad.md");
  });

  // spec: specfold-index#outdated-index
  it("lists outdated indexes without writing and exits with 1", async () => {
    const repo = tempDir("index/repo");
    await run(["index"], repo);
    writeFileSync(join(repo, "knowledge/references/new.md"), "---\ntype: Reference\ntitle: New\n---\n");
    const before = readFileSync(join(repo, "knowledge/references/index.md"), "utf8");
    const result = await run(["index", "--check"], repo);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("outdated knowledge/references/index.md");
    expect(readFileSync(join(repo, "knowledge/references/index.md"), "utf8")).toBe(before);
  });

  // spec: specfold-index#up-to-date
  it("exits with 0 when every index matches", async () => {
    const repo = tempDir("index/repo");
    await run(["index"], repo);
    const result = await run(["index", "--check"], repo);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("6 indexes, 0 outdated: 0 errors, 1 warning\n");
  });

  // spec: specfold-index#json-in-check-mode
  it("reports outdated indexes in JSON with an empty written list", async () => {
    const repo = tempDir("index/repo");
    await run(["index"], repo);
    writeFileSync(join(repo, "knowledge/references/index.md"), "stale\n");
    const result = await run(["index", "--check", "--json"], repo);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      written: [],
      outdated: ["knowledge/references/index.md"],
    });
  });
});
