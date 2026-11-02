import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { insertEntry } from "../src/log/insert.ts";
import { run, tempDir } from "./helpers.ts";

const LOG = "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-01\n\n* **Creation**: First.\n";

describe("log: insertion", () => {
  it("appends to an existing date section", () => {
    expect(insertEntry(LOG, "2026-10-26", "* **Update**: Third.")).toBe(
      "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n* **Update**: Third.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("appends to the last section without leaving a gap", () => {
    expect(insertEntry(LOG, "2026-10-01", "* **Update**: Later.")).toBe(`${LOG}* **Update**: Later.\n`);
  });

  it("inserts a newer date above the newest heading", () => {
    expect(insertEntry(LOG, "2026-10-27", "* **Update**: New.")).toBe(
      "# Log\n\n## 2026-10-27\n\n* **Update**: New.\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("inserts a back-dated section between older and newer dates", () => {
    expect(insertEntry(LOG, "2026-10-10", "* **Update**: Middle.")).toBe(
      "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-10\n\n* **Update**: Middle.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("appends the oldest date at the end", () => {
    expect(insertEntry(LOG, "2026-09-01", "* **Update**: Old.")).toBe(
      `${LOG}\n## 2026-09-01\n\n* **Update**: Old.\n`,
    );
  });

  it("fills an empty date section after one blank line", () => {
    expect(insertEntry("# Log\n\n## 2026-10-26\n", "2026-10-26", "* x")).toBe(
      "# Log\n\n## 2026-10-26\n\n* x\n",
    );
  });

  it("creates a new log", () => {
    expect(insertEntry(undefined, "2026-10-26", "* x")).toBe("# Log\n\n## 2026-10-26\n\n* x\n");
  });

  it("keeps a title and prose before the first heading", () => {
    expect(insertEntry("# History\n\nNotes.\n", "2026-10-26", "* x")).toBe(
      "# History\n\nNotes.\n\n## 2026-10-26\n\n* x\n",
    );
  });
});

describe("log add: command", () => {
  const log = (repo: string) => readFileSync(join(repo, "knowledge/log.md"), "utf8");

  // spec: specfold-log#missing-message
  it("rejects a missing message", async () => {
    const result = await run(["log", "add"], tempDir("valid"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("missing message");
  });

  it("rejects a missing or unknown subcommand and a bad kind", async () => {
    const repo = tempDir("valid");
    expect((await run(["log"], repo)).code).toBe(2);
    expect((await run(["log", "list"], repo)).code).toBe(2);
    expect((await run(["log", "add", "--kind", "update", "x"], repo)).code).toBe(2);
  });

  // spec: specfold-log#invalid-date
  it("rejects an invalid calendar date", async () => {
    const result = await run(["log", "add", "--date", "2026-02-30", "Fixed"], tempDir("valid"));
    expect(result.code).toBe(2);
  });

  // spec: specfold-log#default-kind
  it("writes an Update entry with collapsed whitespace and prints it", async () => {
    const repo = tempDir("valid");
    const result = await run(["log", "add", "--date", "2026-10-26", "Added", "the\n runbook"], repo);
    expect(result).toEqual({ code: 0, stdout: "* **Update**: Added the runbook\n", stderr: "" });
    expect(log(repo)).toContain("* **Update**: Added the runbook\n");
  });

  // spec: specfold-log#existing-heading
  it("adds to an existing date section after its entries", async () => {
    const repo = tempDir("valid");
    await run(["log", "add", "--date", "2026-10-26", "--kind", "Deprecation", "Old", "rule"], repo);
    expect(log(repo)).toContain("* **Update**: Added the runbook.\n* **Deprecation**: Old rule\n");
  });

  // spec: specfold-log#new-newest-date
  it("inserts a newer date above the newest heading", async () => {
    const repo = tempDir("valid");
    await run(["log", "add", "--date", "2026-11-02", "Newer"], repo);
    expect(log(repo)).toMatch(/^# Log\n\n## 2026-11-02\n\n\* \*\*Update\*\*: Newer\n\n## 2026-10-26\n/);
  });

  // spec: specfold-log#back-dated-entry
  it("inserts a back-dated section between existing dates", async () => {
    const repo = tempDir("valid");
    await run(["log", "add", "--date", "2026-10-23", "Between"], repo);
    const text = log(repo);
    expect(text.indexOf("## 2026-10-26")).toBeLessThan(text.indexOf("## 2026-10-23"));
    expect(text.indexOf("## 2026-10-23")).toBeLessThan(text.indexOf("## 2026-10-20"));
  });

  // spec: specfold-log#first-entry
  it("creates log.md when it is missing", async () => {
    const repo = tempDir("valid");
    rmSync(join(repo, "knowledge/log.md"));
    await run(["log", "add", "--date", "2026-10-26", "--kind", "Creation", "Bundle", "created"], repo);
    expect(log(repo)).toBe("# Log\n\n## 2026-10-26\n\n* **Creation**: Bundle created\n");
  });

  // spec: specfold-log#root-index-lists-the-new-log
  it("adds the new log to the root index", async () => {
    const repo = tempDir("valid");
    rmSync(join(repo, "knowledge/log.md"));
    await run(["index"], repo);
    const result = await run(["log", "add", "--date", "2026-10-26", "Bundle created"], repo);
    expect(result.stdout).toContain("knowledge/log.md");
    expect(result.stdout).toContain("knowledge/index.md");
    const index = readFileSync(join(repo, "knowledge/index.md"), "utf8");
    expect(index).toContain("# Log");
    expect((await run(["index", "--check"], repo)).code).toBe(0);
  });

  // spec: specfold-log#still-conformant
  it("keeps log.md conformant after entries in random date order", async () => {
    const repo = tempDir("valid");
    for (const date of ["2026-10-22", "2027-01-01", "2026-10-26", "2026-01-15"]) {
      await run(["log", "add", "--date", date, "Entry", date], repo);
    }
    const result = await run(["validate", "--okf-only", "--json", "knowledge/log.md"], repo);
    expect(JSON.parse(result.stdout).findings).toEqual([]);
  });

  it("uses the local date by default", async () => {
    const repo = tempDir("valid");
    await run(["log", "add", "Today"], repo);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(log(repo)).toContain(`## ${today}`);
  });
});
