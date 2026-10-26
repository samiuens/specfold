import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateIndexes } from "../src/indexes/generate.ts";
import { loadConfig } from "../src/repo.ts";
import { tempDir } from "./helpers.ts";

const EXPECTED = new URL("./fixtures/index/expected/", import.meta.url).pathname;

function generate(repo: string) {
  return generateIndexes(join(repo, "knowledge"), loadConfig(repo)).indexes;
}

const expected = (rel: string) => readFileSync(join(EXPECTED, rel), "utf8");

describe("index: generation", () => {
  it("matches every golden file", () => {
    const indexes = generate(tempDir("index/repo"));
    const golden = readdirSync(EXPECTED, { recursive: true, encoding: "utf8" })
      .filter((p) => p.endsWith("index.md"))
      .map((p) => p.split("\\").join("/"))
      .sort();
    expect([...indexes.keys()].sort()).toEqual(golden);
    for (const rel of golden) expect(indexes.get(rel), rel).toBe(expected(rel));
  });

  // spec: specfold-index#root-index-frontmatter
  it("starts the root index with okf_version only", () => {
    expect(generate(tempDir("index/repo")).get("index.md")).toMatch(/^---\nokf_version: "0.2"\n---\n\n/);
  });

  // spec: specfold-index#configured-folder
  it("uses configured folder titles and descriptions", () => {
    expect(generate(tempDir("index/repo")).get("index.md")).toContain(
      "* [Decisions](decisions/) - Decisions about the product",
    );
  });

  // spec: specfold-index#unconfigured-folder
  it("derives the title of an unconfigured folder from its name", () => {
    const repo = tempDir("index/repo");
    mkdirSync(join(repo, "knowledge/data-flows"));
    writeFileSync(join(repo, "knowledge/data-flows/index.md"), "");
    expect(generate(repo).get("index.md")).toContain("* [Data flows](data-flows/)\n");
  });

  // spec: specfold-index#log-listed
  it("lists log.md last in the root index", () => {
    expect(generate(tempDir("index/repo")).get("index.md")).toMatch(
      /\n# Log\n\n\* \[Log\]\(log\.md\) - Dated record of changes to this bundle\n$/,
    );
  });

  // spec: specfold-index#grouping-and-order
  it("groups by configured type order, then unknown types alphabetically, titles case-insensitive", () => {
    const text = generate(tempDir("index/repo")).get("decisions/index.md") ?? "";
    const headings = text.split("\n").filter((l) => l.startsWith("# "));
    expect(headings).toEqual(["# Term", "# Decision", "# Alpha Kind", "# Metric"]);
    expect(text.indexOf("[A first]")).toBeLessThan(text.indexOf("[b second]"));
  });

  // spec: specfold-index#missing-title-or-description
  it("falls back to the file name and omits a missing description", () => {
    expect(generate(tempDir("index/repo")).get("decisions/index.md")).toContain(
      "* [aa-custom](aa-custom.md)\n",
    );
  });

  // spec: specfold-index#deprecated-entry
  it("marks deprecated concepts", () => {
    expect(generate(tempDir("index/repo")).get("decisions/index.md")).toContain(
      "* [Old way](old.md) (deprecated) - Replaced by A first.",
    );
  });

  // spec: specfold-index#empty-runbooks-folder
  it("writes a placeholder for an empty folder", () => {
    expect(generate(tempDir("index/repo")).get("runbooks/index.md")).toBe("# Runbooks\n\nNo concepts yet.\n");
  });
});
