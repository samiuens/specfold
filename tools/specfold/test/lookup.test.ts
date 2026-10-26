import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

function concept(repo: string, rel: string, fm: string) {
  mkdirSync(join(repo, "knowledge", rel, ".."), { recursive: true });
  writeFileSync(join(repo, "knowledge", rel), `---\n${fm}\n---\n`);
}

describe("lookup: command", () => {
  // spec: specfold-lookup#missing-query
  it("rejects a missing query", async () => {
    const result = await run(["lookup"], tempDir("valid"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("missing query");
  });

  // spec: specfold-lookup#invalid-limit
  it("rejects a limit that is not a positive integer", async () => {
    const repo = tempDir("valid");
    for (const limit of ["0", "-1", "ten"])
      expect((await run(["lookup", "x", "--limit", limit], repo)).code, limit).toBe(2);
  });

  // spec: specfold-lookup#limit-applied
  it("prints at most 10 results by default", async () => {
    const repo = tempDir("valid");
    for (let i = 0; i < 12; i++)
      concept(repo, `domain/term-${String(i).padStart(2, "0")}.md`, `type: Term\ntitle: Ledger ${i}`);
    const result = await run(["lookup", "ledger"], repo);
    expect(result.stdout.trim().split("\n")).toHaveLength(10);
    expect((await run(["lookup", "ledger", "--limit", "3"], repo)).stdout.trim().split("\n")).toHaveLength(3);
  });

  // spec: specfold-lookup#one-line-per-hit
  it("prints path, title, description and flags in one line", async () => {
    const repo = tempDir("valid");
    concept(
      repo,
      "decisions/old-checkout.md",
      "type: Decision\ntitle: Old checkout\ndescription: Replaced.\nstatus: deprecated",
    );
    const result = await run(["lookup", "old", "checkout"], repo);
    expect(result).toEqual({
      code: 0,
      stdout: "knowledge/decisions/old-checkout.md - Old checkout: Replaced. [deprecated, unverified]\n",
      stderr: "",
    });
  });

  it("prints paths relative to the repository root from a subdirectory", async () => {
    const repo = tempDir("valid");
    const result = await run(["lookup", "rotate"], join(repo, "knowledge", "runbooks"));
    expect(result.stdout).toMatch(
      /^knowledge\/runbooks\/rotate-keys\.md - Rotate keys: How to rotate signing keys\./,
    );
  });

  // spec: specfold-lookup#no-hits
  it("prints 'no matches' and exits with 0 when nothing matches", async () => {
    expect(await run(["lookup", "nothing-like-this"], tempDir("valid"))).toEqual({
      code: 0,
      stdout: "no matches\n",
      stderr: "",
    });
  });

  // spec: specfold-lookup#machine-readable-hits
  it("prints JSON with path, score and flags", async () => {
    const repo = tempDir("valid");
    concept(
      repo,
      "runbooks/drain-queue.md",
      "type: Runbook\ntitle: Drain queue\nstale_after: 2999-01-01T00:00:00Z\nverified: { by: human:ada, at: 2026-10-26T10:00:00Z }",
    );
    const result = await run(["lookup", "drain", "--json"], repo);
    expect(JSON.parse(result.stdout)).toEqual({
      query: "drain",
      results: [
        {
          path: "knowledge/runbooks/drain-queue.md",
          title: "Drain queue",
          description: null,
          type: "Runbook",
          score: 3,
          flags: [],
        },
      ],
    });
  });
});
