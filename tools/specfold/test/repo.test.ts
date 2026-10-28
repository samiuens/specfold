import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { DEFAULT_TEST_GLOBS, findRepoRoot, requireConfig } from "../src/repo.ts";
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
      unverifiedAfterDays: 30,
      backlogUntouchedDays: 180,
      gate: {
        requireChangeForSourceChanges: true,
        escapeLabel: "no-spec",
        blockOnStaleTouched: true,
        blockOnDrift: false,
      },
      hooksExtra: {},
      traceTestGlobs: DEFAULT_TEST_GLOBS,
      statsBudget: { agentsMd: 2000, total: 4000, skillDescription: 60 },
      kitVersion: "",
      channel: "stable",
      source: undefined,
      upgradeCommitMessage: "chore: upgrade Specfold to v{version}",
    });
  });

  it("reads the gate settings", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      "types: []\ngate:\n  require_change_for_source_changes: false\n  escape_label: skip-spec\n  block_on_stale_touched: false\n  block_on_drift: true\n",
    );
    expect(requireConfig(root).gate).toEqual({
      requireChangeForSourceChanges: false,
      escapeLabel: "skip-spec",
      blockOnStaleTouched: false,
      blockOnDrift: true,
    });
  });

  it("reads hooks.extra and rejects malformed entries", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      'types: []\nhooks:\n  extra:\n    commit-msg:\n      - check "$1"\n',
    );
    expect(requireConfig(root).hooksExtra).toEqual({ "commit-msg": ['check "$1"'] });
    writeFileSync(join(root, "specfold.yaml"), "types: []\nhooks:\n  extra:\n    commit-msg: check\n");
    expect(() => requireConfig(root)).toThrow(EnvError);
    writeFileSync(join(root, "specfold.yaml"), "types: []\nhooks:\n  extra:\n    'pre commit': [x]\n");
    expect(() => requireConfig(root)).toThrow(EnvError);
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

  it("reads the audit age limit for unverified concepts", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "audit:\n  unverified_after_days: 90\n");
    expect(requireConfig(root).unverifiedAfterDays).toBe(90);
  });

  it("reads the audit age limit for open backlog items", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: []\n");
    expect(requireConfig(root).backlogUntouchedDays).toBe(180);
    writeFileSync(join(root, "specfold.yaml"), "audit:\n  backlog_untouched_days: 60\n");
    expect(requireConfig(root).backlogUntouchedDays).toBe(60);
  });

  it("reads the test globs for trace, with defaults", () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: []\n");
    expect(requireConfig(root).traceTestGlobs).toContain("**/*_test.*");
    writeFileSync(join(root, "specfold.yaml"), "trace:\n  test_globs: ['test/**/*.test.ts']\n");
    expect(requireConfig(root).traceTestGlobs).toEqual(["test/**/*.test.ts"]);
    writeFileSync(join(root, "specfold.yaml"), "trace:\n  test_globs: test\n");
    expect(() => requireConfig(root)).toThrow(EnvError);
  });

  it("reads the upgrade settings with their defaults", () => {
    const root = tempDir();
    writeFileSync(
      join(root, "specfold.yaml"),
      "kit_version: 0.1.0-rc.1\nchannel: next\nsource:\n  github: acme/kit\n  path: ../mirror\nupgrade:\n  commit_message: 'chore(kit): upgrade to v{version}'\n",
    );
    expect(requireConfig(root)).toMatchObject({
      kitVersion: "0.1.0-rc.1",
      channel: "next",
      source: { path: "../mirror" },
      upgradeCommitMessage: "chore(kit): upgrade to v{version}",
    });
    writeFileSync(
      join(root, "specfold.yaml"),
      "source:\n  url: https://mirror.example/kit\n  github: acme/kit\n",
    );
    expect(requireConfig(root).source).toEqual({ url: "https://mirror.example/kit" });
    writeFileSync(join(root, "specfold.yaml"), "source:\n  github: acme/kit\n");
    expect(requireConfig(root).source).toEqual({ github: "acme/kit" });
  });

  it("fails with an environment error on a bad channel or source", () => {
    const root = tempDir();
    for (const bad of [
      "channel: beta\n",
      "source:\n  url: http://mirror.example\n",
      "source:\n  github: acme\n",
    ]) {
      writeFileSync(join(root, "specfold.yaml"), bad);
      expect(() => requireConfig(root)).toThrow(EnvError);
    }
  });
});
