import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { search, words } from "../src/lookup/search.ts";
import { tempDir } from "./helpers.ts";

function bundle(concepts: Record<string, string>): string {
  const root = tempDir();
  for (const [rel, fm] of Object.entries(concepts)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), `---\n${fm}\n---\n\nBody mentions zebra.\n`);
  }
  return root;
}

const titles = (root: string, query: string, type?: string) =>
  search(root, query, type ? { type } : {}).map((h) => h.title);

describe("lookup: search", () => {
  it("tokenizes on non-alphanumerics", () => {
    expect(words("okf_version, OKF-Version!")).toEqual(["okf", "version", "okf", "version"]);
  });

  // spec: specfold-lookup#all-words-must-match
  it("requires every query word to match", () => {
    const root = bundle({
      "a.md": "type: Term\ntitle: Guest checkout",
      "b.md": "type: Term\ntitle: Guest accounts",
    });
    expect(titles(root, "guest check")).toEqual(["Guest checkout"]);
  });

  // spec: specfold-lookup#prefix-match
  it("matches word prefixes case-insensitively", () => {
    const root = bundle({ "a.md": "type: Term\ntitle: A\ndescription: Only verified concepts count." });
    expect(titles(root, "VERIF")).toEqual(["A"]);
    expect(titles(root, "erified")).toEqual([]);
  });

  // spec: specfold-lookup#body-ignored
  it("does not search the body, indexes or the log", () => {
    const root = bundle({ "a.md": "type: Term\ntitle: A" });
    writeFileSync(join(root, "index.md"), "# Term\n\n* [Zebra](a.md) - zebra\n");
    expect(titles(root, "zebra")).toEqual([]);
  });

  // spec: specfold-lookup#title-beats-description
  it("ranks a title match above a description match", () => {
    const root = bundle({
      "a.md": "type: Term\ntitle: Signing\ndescription: Uses a token.",
      "b.md": "type: Term\ntitle: Token rotation",
    });
    expect(search(root, "token").map((h) => [h.title, h.score])).toEqual([
      ["Token rotation", 3],
      ["Signing", 1],
    ]);
  });

  it("weights tags between title and description", () => {
    const root = bundle({
      "a.md": "type: Term\ntitle: A\ndescription: about billing",
      "b.md": "type: Term\ntitle: B\ntags: [billing]",
    });
    expect(search(root, "billing").map((h) => h.score)).toEqual([2, 1]);
  });

  // spec: specfold-lookup#ties-by-path
  it("breaks score ties by path", () => {
    const root = bundle({
      "z/x.md": "type: Term\ntitle: Ledger",
      "a/y.md": "type: Term\ntitle: Ledger entry",
    });
    expect(search(root, "ledger").map((h) => h.rel)).toEqual(["a/y.md", "z/x.md"]);
  });

  // spec: specfold-lookup#only-decisions
  it("filters by type case-insensitively", () => {
    const root = bundle({
      "a.md": "type: Decision\ntitle: Checkout flow",
      "b.md": "type: Term\ntitle: Checkout",
    });
    expect(titles(root, "checkout", "decision")).toEqual(["Checkout flow"]);
  });

  // spec: specfold-lookup#stale-and-unverified
  it("flags deprecated, stale and unverified concepts in order", () => {
    const root = bundle({
      "a.md": "type: Runbook\ntitle: Old runbook\nstatus: deprecated\nstale_after: 2020-01-01T00:00:00Z",
      "b.md":
        "type: Runbook\ntitle: New runbook\nstale_after: 2999-01-01T00:00:00Z\nverified: { by: human:ada, at: 2026-10-26T10:00:00Z }",
    });
    expect(search(root, "runbook").map((h) => [h.title, h.flags])).toEqual([
      ["Old runbook", ["deprecated", "stale", "unverified"]],
      ["New runbook", []],
    ]);
  });
});
