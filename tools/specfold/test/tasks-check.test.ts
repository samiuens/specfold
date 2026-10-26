import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

const TASKS = "openspec/changes/demo/tasks.md";

function mutate(repo: string, from: string, to: string): void {
  const path = join(repo, TASKS);
  const text = readFileSync(path, "utf8");
  if (!text.includes(from)) throw new Error(`fixture does not contain ${from}`);
  writeFileSync(path, text.replace(from, to));
}

describe("tasks check: command", () => {
  // spec: specfold-tasks#clean-breakdown
  it("exits with 0 for a breakdown that follows every rule", async () => {
    const result = await run(["tasks", "check", "demo"], tempDir("tasks"));
    expect(result).toMatchObject({ code: 0, stdout: "tasks check demo: 0 errors, 0 warnings\n" });
  });

  // spec: specfold-tasks#unknown-change
  it("exits with 2 for an unknown change", async () => {
    const result = await run(["tasks", "check", "missing-change"], tempDir("tasks"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown change 'missing-change'");
  });

  it("rejects missing or malformed arguments", async () => {
    const repo = tempDir("tasks");
    for (const argv of [
      ["tasks"],
      ["tasks", "lint", "demo"],
      ["tasks", "check"],
      ["tasks", "check", "../x"],
      ["tasks", "check", "archive"],
    ])
      expect((await run(argv, repo)).code, argv.join(" ")).toBe(2);
  });

  // spec: specfold-tasks#json-finding
  it("prints findings as JSON", async () => {
    const repo = tempDir("tasks");
    mutate(
      repo,
      "- [ ] 2.2 Add the receipt template\n  - Done when: npm test -- receipt passes\n",
      "- [ ] 2.2 Add the receipt template\n- [ ] 2.3 Add a footer\n",
    );
    const result = await run(["tasks", "check", "demo", "--json"], repo);
    expect(result.code).toBe(1);
    const out = JSON.parse(result.stdout);
    expect(out).toMatchObject({ ok: false, change: "demo", errors: 2, warnings: 0 });
    expect(out.findings).toContainEqual({
      rule: "T2",
      severity: "error",
      file: TASKS,
      group: 2,
      task: "2.3",
      line: 23,
      message: "task 2.3 has no 'Done when:' line",
      fix: "add an indented '- Done when: <test, command or scenario>' line",
    });
  });

  it("prints error lines and a summary without --json", async () => {
    const repo = tempDir("tasks");
    mutate(repo, "## 3. Knowledge", "## 3. Docs");
    mutate(repo, "#receipt-sent]", "#receipt-mailed]");
    const result = await run(["tasks", "check", "demo"], repo);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe(
      `${TASKS}:15 T6 unknown scenario 'mail#receipt-mailed'\ntasks check demo: 1 error, 1 warning\n`,
    );
  });

  // spec: specfold-tasks#missing-tasks-file
  it("reports T0 when the change has no tasks.md", async () => {
    const result = await run(["tasks", "check", "no-tasks", "--json"], tempDir("tasks"));
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).findings).toEqual([
      expect.objectContaining({ rule: "T0", severity: "error", file: "openspec/changes/no-tasks/tasks.md" }),
    ]);
  });
});
