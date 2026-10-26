import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { computeDiff } from "../src/gate/diff.ts";
import { commit, gateRepo, git } from "./gate-helpers.ts";

describe("gate: diff", () => {
  it("lists files changed since the merge base, deleted files included", () => {
    const root = gateRepo({ "src/old.ts": "x\n" });
    git(root, "rm", "-q", "src/old.ts");
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    git(root, "checkout", "-q", "main");
    commit(root, { "src/main-only.ts": "x\n" }, "main moves on");
    git(root, "checkout", "-q", "work");
    expect(computeDiff(root, "main", false).files).toEqual(["src/app.ts", "src/old.ts"]);
  });

  // spec: specfold-gate#uncommitted-file-counts-locally
  it("counts uncommitted and untracked files with local", () => {
    const root = gateRepo();
    writeFileSync(join(root, "src/app.ts"), "export const app = 3;\n");
    writeFileSync(join(root, "src/new.ts"), "x\n");
    expect(computeDiff(root, "main", false).files).toEqual([]);
    expect(computeDiff(root, "main", true).files).toEqual(["src/app.ts", "src/new.ts"]);
  });

  it("finds touched active changes and newly archived changes", () => {
    const root = gateRepo({
      "openspec/changes/old/proposal.md": "x\n",
      "openspec/changes/archive/2026-01-01-done/proposal.md": "x\n",
      "openspec/changes/gone/proposal.md": "x\n",
    });
    mkdirSync(join(root, "openspec/changes/archive"), { recursive: true });
    renameSync(join(root, "openspec/changes/old"), join(root, "openspec/changes/archive/2026-10-26-old"));
    git(root, "rm", "-rq", "openspec/changes/gone");
    commit(root, {
      "openspec/changes/live/brief.md": "x\n",
      "openspec/changes/archive/2026-01-01-done/proposal.md": "edited\n",
    });
    const diff = computeDiff(root, "main", false);
    expect(diff.activeChanges).toEqual(["live"]);
    expect(diff.archivedChanges).toEqual(["2026-10-26-old"]);
  });

  it("works in a repository below the git root", () => {
    const root = gateRepo();
    commit(root, { "sub/specfold.yaml": "types: []\n", "sub/src/a.ts": "x\n" });
    expect(computeDiff(join(root, "sub"), "main", false).files).toEqual(["specfold.yaml", "src/a.ts"]);
  });

  it("rejects an unknown base", () => {
    expect(() => computeDiff(gateRepo(), "nope", false)).toThrow(EnvError);
  });
});
