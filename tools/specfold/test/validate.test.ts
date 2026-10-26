import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/validate/index.ts";
import { run, tempDir } from "./helpers.ts";

describe("validate: command line", () => {
  // spec: specfold-validate#whole-bundle-by-default
  it("checks every Markdown file under knowledge/ by default", async () => {
    const repo = tempDir("valid");
    const result = await run(["validate", "--json"], repo);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).checked).toBe(8);
  });

  // spec: specfold-validate#selected-paths
  it("checks only the given files and folders", async () => {
    const repo = tempDir("valid");
    const result = await run(
      ["validate", "--json", "knowledge/decisions/use-yaml.md", "knowledge/references"],
      repo,
    );
    expect(JSON.parse(result.stdout).checked).toBe(3);
  });

  // spec: specfold-validate#path-outside-the-bundle
  it("rejects a path outside the bundle with exit code 2", async () => {
    const repo = tempDir("valid");
    const result = await run(["validate", "docs/notes.md"], repo);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("docs/notes.md");
  });

  // spec: specfold-validate#other-bundle-root
  it("checks another bundle root with --bundle", async () => {
    const repo = tempDir("valid");
    const result = await run(
      ["validate", "--okf-only", "--json", "--bundle", join("knowledge", "decisions")],
      repo,
    );
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).checked).toBe(2);
  });

  it("works from a subdirectory of the repository", async () => {
    const repo = tempDir("valid");
    const result = await run(["validate", "--json"], join(repo, "knowledge", "runbooks"));
    expect(JSON.parse(result.stdout).checked).toBe(8);
  });
});
