import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { findRepoRoot, requireConfig } from "../src/repo.ts";
import { tempDir } from "./helpers.ts";

describe("repo", () => {
  it("finds specfold.yaml in a parent directory", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: [Decision]\n");
    mkdirSync(join(root, "a", "b"), { recursive: true });
    expect(findRepoRoot(join(root, "a", "b"))).toBe(root);
  });

  it("reads types, source globs, gate and folders", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      "types: [Decision, Reference]\nsource_globs: ['src/**']\ngate:\n  block_on_broken_links: false\nfolders:\n  decisions: { title: Decisions, description: Why }\n",
    );
    expect(requireConfig(root)).toEqual({
      root,
      types: ["Decision", "Reference"],
      sourceGlobs: ["src/**"],
      blockOnBrokenLinks: false,
      folders: { decisions: { title: "Decisions", description: "Why" } },
      agentPrefix: "",
      requires: {},
      tasks: { maxFilesPerTask: 5, maxTasksPerGroup: 8 },
      agentTargets: [".claude/skills"],
    });
  });

  it("defaults block_on_broken_links to true", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: []\n");
    expect(requireConfig(root).blockOnBrokenLinks).toBe(true);
  });

  it("fails with an environment error without specfold.yaml", () => {
    expect(() => requireConfig(tempDir())).toThrow(EnvError);
  });

  it("fails with an environment error on invalid YAML", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: [a\n");
    expect(() => requireConfig(root)).toThrow(EnvError);
  });

  it("fails with an environment error when types is not a list", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: Decision\n");
    expect(() => requireConfig(root)).toThrow(/'types' must be a list/);
  });

  it("reads the task size limits", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      "tasks:\n  max_files_per_task: 3\n  max_tasks_per_group: 12\n",
    );
    expect(requireConfig(root).tasks).toEqual({ maxFilesPerTask: 3, maxTasksPerGroup: 12 });
  });

  it("fails with an environment error on a non-positive task limit", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "tasks:\n  max_files_per_task: 0\n");
    expect(() => requireConfig(root)).toThrow(EnvError);
  });

  it("reads the agent skill targets", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      "agents:\n  targets: [.claude/skills, .config/tool/skills/]\n",
    );
    expect(requireConfig(root).agentTargets).toEqual([".claude/skills", ".config/tool/skills"]);
  });

  it("fails with an environment error on a target outside the repository", () => {
    const root = tempDir();
    for (const target of ["../skills", "/tmp/skills", "a/../../b"]) {
      writeFileSync(join(root, "specfold.yaml"), `agents:\n  targets: ['${target}']\n`);
      expect(() => requireConfig(root), target).toThrow(EnvError);
    }
  });
});
