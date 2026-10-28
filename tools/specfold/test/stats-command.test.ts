import { describe, expect, it } from "vitest";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

describe("specfold stats", () => {
  // spec: specfold-stats#within-budget
  it("reports the set within budget and ends with its total", async () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "x".repeat(400));
    const result = await run(["stats"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toContain("always-loaded set, estimated tokens (characters / 4):\n");
    expect(result.stdout).toMatch(/^ {2}AGENTS\.md +100$/m);
    expect(result.stdout).toMatch(/^ {2}CLAUDE\.md +0 \(missing\)$/m);
    expect(result.stdout).toContain("knowledge, estimated tokens:\n");
    expect(result.stdout).toMatch(/stats: \d+ tokens always loaded, 0 budgets exceeded\n$/);
  });

  // spec: specfold-stats#named-files
  it("estimates named files and folders", async () => {
    const root = tempDir("valid");
    write(root, "notes/a.md", "a".repeat(400));
    write(root, "notes/b.md", "b".repeat(800));
    const result = await run(["stats", "notes/"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/^ {2}notes\/a\.md +100$/m);
    expect(result.stdout).toMatch(/^ {2}notes\/b\.md +200$/m);
    expect(result.stdout).toMatch(/stats: 300 tokens in 2 files\n$/);
  });

  it("fails with 2 for a path that does not exist", async () => {
    const result = await run(["stats", "nowhere.md"], tempDir("valid"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no such file or folder: nowhere.md");
  });

  // spec: specfold-stats#json-over-budget
  it("prints JSON with the overrun and exits 1", async () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "x".repeat(9000));
    const result = await run(["stats", "--json"], root);
    expect(result.code).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.ok).toBe(false);
    expect(data.over).toEqual([{ budget: "agents_md", item: "AGENTS.md", tokens: 2250, limit: 2000 }]);
    expect(data.budgets).toEqual({ agents_md: 2000, total: 4000, skill_description: 60 });
    expect(Object.keys(data)).toEqual(["ok", "set", "total", "budgets", "over", "knowledge"]);
  });

  it("names the overrun in text", async () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "x".repeat(9000));
    const result = await run(["stats"], root);
    expect(result.stdout).toContain("over budget: AGENTS.md 2250 > 2000 (stats.budget.agents_md)\n");
    expect(result.stdout).toMatch(/1 budget exceeded\n$/);
  });
});
