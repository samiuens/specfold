import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

describe("index: code references", () => {
  // spec: specfold-index#reference-listed
  it("lists references under the concept, sorted by path and line", async () => {
    const repo = tempDir("index/repo");
    await run(["index"], repo);
    expect(readFileSync(join(repo, "knowledge/decisions/index.md"), "utf8")).toContain(
      "* [A first](a-first.md) - Comes first.\n  * Referenced from code: src/app.py:1\n  * Referenced from code: src/checkout/token.ts:1\n",
    );
  });

  it("ignores files outside source_globs", async () => {
    const repo = tempDir("index/repo");
    await run(["index"], repo);
    expect(readFileSync(join(repo, "knowledge/decisions/index.md"), "utf8")).not.toContain("docs/notes.md");
  });

  // spec: specfold-index#reference-to-a-missing-concept
  it("warns about a reference to a missing concept without failing", async () => {
    const repo = tempDir("index/repo");
    const result = await run(["index", "--json"], repo);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).findings).toEqual([
      expect.objectContaining({ rule: "I2", severity: "warning", path: "src/checkout/token.ts", line: 4 }),
    ]);
  });
});
