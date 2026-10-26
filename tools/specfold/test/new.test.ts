import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { isoWithOffset, scalar } from "../src/new/command.ts";
import { run, tempDir } from "./helpers.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

const frontmatter = (repo: string, rel: string) =>
  parse(readFileSync(join(repo, rel), "utf8").split("---\n")[1] ?? "", { schema: "core" }) as Record<
    string,
    unknown
  >;

async function findings(repo: string) {
  const result = await run(["validate", "--json"], repo);
  return JSON.parse(result.stdout).findings.map((f: { rule: string; path: string }) => `${f.rule} ${f.path}`);
}

describe("new: command", () => {
  // spec: specfold-new#unknown-type
  it("rejects a type that is not configured", async () => {
    const result = await run(["new", "Glossary", "domain/x.md"], tempDir("valid"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Term, Decision");
  });

  // spec: specfold-new#path-not-kebab-case
  it("rejects a path that is not kebab-case", async () => {
    const repo = tempDir("valid");
    for (const path of ["decisions/UseYaml.md", "decisions/x.txt", "../x.md", "decisions/index.md"]) {
      expect((await run(["new", "Decision", path], repo)).code, path).toBe(2);
    }
  });

  // spec: specfold-new#new-concept-in-a-new-folder
  it("creates the file and missing folders, and prints the path", async () => {
    vi.stubEnv("SPECFOLD_MODEL", "");
    const repo = tempDir("valid");
    const result = await run(["new", "Runbook", "/operations/restart-workers.md"], repo);
    expect(result).toEqual({ code: 0, stdout: "knowledge/operations/restart-workers.md\n", stderr: "" });
    expect(existsSync(join(repo, "knowledge/operations/restart-workers.md"))).toBe(true);
  });

  // spec: specfold-new#existing-file
  it("refuses to overwrite an existing file", async () => {
    const repo = tempDir("valid");
    const path = join(repo, "knowledge/runbooks/rotate-keys.md");
    const before = readFileSync(path, "utf8");
    const result = await run(["new", "Runbook", "runbooks/rotate-keys.md"], repo);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("already exists");
    expect(readFileSync(path, "utf8")).toBe(before);
  });

  // spec: specfold-new#derived-title
  it("derives the title and writes draft status and a timestamp with offset", async () => {
    vi.stubEnv("SPECFOLD_MODEL", "");
    const repo = tempDir("valid");
    await run(["new", "Decision", "decisions/guest-orders.md"], repo);
    const fm = frontmatter(repo, "knowledge/decisions/guest-orders.md");
    expect(fm).toMatchObject({
      type: "Decision",
      title: "Guest orders",
      description: "",
      status: "draft",
      decision: "accepted",
      sources: [],
    });
    expect((fm.generated as { at: string }).at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );
    expect((fm.generated as { by: string }).by).toBe("process:specfold-new");
    expect(readFileSync(join(repo, "knowledge/decisions/guest-orders.md"), "utf8")).toContain(
      "# Rejected alternatives",
    );
    expect(await findings(repo)).toEqual(["P2 decisions/guest-orders.md", "P6 decisions/guest-orders.md"]);
  });

  // spec: specfold-new#model-from-the-environment
  it("builds the actor from agent_prefix and SPECFOLD_MODEL", async () => {
    vi.stubEnv("SPECFOLD_MODEL", "sonnet");
    const repo = tempDir("valid");
    writeFileSync(
      join(repo, "specfold.yaml"),
      `${readFileSync(join(repo, "specfold.yaml"), "utf8")}actors:\n  agent_prefix: "claude-code/"\n`,
    );
    await run(["new", "Term", "domain/ledger.md", "--description", "An append-only record."], repo);
    expect(frontmatter(repo, "knowledge/domain/ledger.md").generated).toMatchObject({
      by: "claude-code/sonnet",
    });
    expect(await findings(repo)).toEqual([]);
  });

  // spec: specfold-new#human-actor-refused
  it("refuses a human actor and creates nothing", async () => {
    const repo = tempDir("valid");
    const result = await run(["new", "Decision", "decisions/x.md", "--by", "human:ada"], repo);
    expect(result.code).toBe(2);
    expect(existsSync(join(repo, "knowledge/decisions/x.md"))).toBe(false);
  });

  // spec: specfold-new#runbook-review-date
  it("gives a Runbook a stale_after 90 days after generated.at", async () => {
    const repo = tempDir("valid");
    await run(["new", "Runbook", "runbooks/restart.md", "--description", "How to restart."], repo);
    const fm = frontmatter(repo, "knowledge/runbooks/restart.md");
    const at = Date.parse((fm.generated as { at: string }).at);
    expect(Date.parse(fm.stale_after as string) - at).toBe(90 * 24 * 60 * 60 * 1000);
    expect(await findings(repo)).toEqual([]);
  });

  // spec: specfold-new#created-path-in-json
  it("prints the created path as JSON", async () => {
    const repo = tempDir("valid");
    const result = await run(["new", "Term", "domain/ledger.md", "--json"], repo);
    expect(JSON.parse(result.stdout)).toEqual({ created: "knowledge/domain/ledger.md" });
    const again = await run(["new", "Term", "domain/ledger.md", "--json"], repo);
    expect(JSON.parse(again.stdout)).toEqual({
      created: null,
      error: "knowledge/domain/ledger.md already exists",
    });
  });

  it("quotes titles that are not safe as plain YAML", async () => {
    const repo = tempDir("valid");
    await run(["new", "Term", "domain/odd.md", "--title", "Ratio: net #1", "--description", "yes"], repo);
    expect(frontmatter(repo, "knowledge/domain/odd.md")).toMatchObject({
      title: "Ratio: net #1",
      description: "yes",
    });
  });
});

describe("new: helpers", () => {
  it("keeps safe scalars plain and quotes the rest", () => {
    expect(scalar("Guest orders")).toBe("Guest orders");
    expect(scalar("")).toBe('""');
    expect(scalar("null")).toBe('"null"');
    expect(scalar("a: b")).toBe('"a: b"');
  });

  it("formats local time with its offset", () => {
    expect(isoWithOffset(new Date())).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });
});
