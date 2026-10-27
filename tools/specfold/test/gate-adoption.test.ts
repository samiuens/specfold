import { chmodSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commit, concept, git, write, writeIndexes } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const SETTINGS = "types: [Term]\nsource_globs: ['src/**']\n";

/** A repository whose `main` holds only code, with a local OpenSpec binary that reports every item as valid. */
function codeOnlyRepo(): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
  chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
  commit(root, { ".gitignore": "node_modules/\n", "src/app.ts": "export const app = 1;\n" }, "base");
  git(root, "checkout", "-q", "-b", "specfold/migration");
  return root;
}

/** Adds Specfold settings and a clean two-concept bundle, plus a source change. */
function adopt(root: string): void {
  write(root, "specfold.yaml", SETTINGS);
  write(root, "knowledge/domain/a.md", concept("Term", "See [b](/domain/b.md)."));
  write(root, "knowledge/domain/b.md", concept("Term", "See [a](/domain/a.md)."));
  writeIndexes(root);
  commit(root, { "src/app.ts": "export const app = 2;\n" }, "adopt");
}

describe("gate: adoption PR", () => {
  // spec: specfold-gate#migration-pr
  it("skips G4 when the base has no specfold.yaml and says so", async () => {
    const root = codeOnlyRepo();
    adopt(root);
    const result = await run(["gate", "--base", "main", "--summary", "summary.md"], root);
    expect(result.stdout).not.toMatch(/^(block|warn) G4/m);
    expect(result.stdout.startsWith("adoption PR: the base has no specfold.yaml, so G4 is skipped\n")).toBe(
      true,
    );
    expect(result.code).toBe(0);
    expect(readFileSync(join(root, "summary.md"), "utf8")).toContain(
      "\n\nadoption PR: the base has no specfold.yaml, so G4 is skipped\n",
    );
    expect(JSON.parse((await run(["gate", "--base", "main", "--json"], root)).stdout).adoption).toBe(true);
  });

  // spec: specfold-gate#later-pr
  it("blocks with G4 as usual once the base has specfold.yaml", async () => {
    const root = codeOnlyRepo();
    adopt(root);
    git(root, "checkout", "-q", "-b", "work");
    commit(root, { "src/app.ts": "export const app = 3;\n" });
    const result = await run(["gate", "--base", "specfold/migration"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("block G4 src/app.ts");
    expect(result.stdout).not.toContain("adoption PR");
  });
});
