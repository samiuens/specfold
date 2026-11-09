import { chmodSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrationRelief } from "../src/migrate/relief.ts";
import { type MigrationState, markStep, readState, writeState } from "../src/migrate/state.ts";
import { concept, gateRepo, git, write, writeIndexes } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

/** A gate repository whose migration state records `start` to `install` at the current commit. */
function migrating(): string {
  const root = gateRepo();
  const base = git(root, "rev-parse", "HEAD").trim();
  const now = new Date();
  let state: MigrationState = { ...readState(root), base, default_branch: "main" };
  for (const step of ["start", "inventory", "plan", "install"] as const) state = markStep(state, step, now);
  writeState(root, state);
  return root;
}

const markConvert = (root: string) => writeState(root, markStep(readState(root), "convert", new Date()));

describe("hooks: relief during a migration", () => {
  // spec: specfold-hooks#convert-marked
  it("is active until convert is marked", () => {
    const root = migrating();
    expect(migrationRelief(root).active).toBe(true);
    expect(migrationRelief(root).isOriginal("knowledge/domain/a.md")).toBe(true);
    write(root, "knowledge/domain/a.md", concept("Term", "Changed."));
    expect(migrationRelief(root).isOriginal("knowledge/domain/a.md")).toBe(false);
    markConvert(root);
    expect(migrationRelief(root).active).toBe(false);
    expect(migrationRelief(gateRepo()).active).toBe(false);
  });

  // spec: specfold-hooks#link-to-a-concept-not-written-yet
  it("lets pre-commit pass a link to a concept not written yet, as a warning", async () => {
    const root = migrating();
    write(root, "knowledge/domain/c.md", concept("Term", "See [secrets](/decisions/secrets.md)."));
    git(root, "add", "knowledge/domain/c.md");
    const result = await run(["hook", "pre-commit"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("(warning: migration in progress)");
  });

  // spec: specfold-hooks#new-concept-still-strict
  it("keeps other errors in new concepts blocking", async () => {
    const root = migrating();
    write(
      root,
      "knowledge/domain/c.md",
      "---\ntype: Term\ndescription: No title.\nstatus: draft\n---\n\n# C\n",
    );
    git(root, "add", "knowledge/domain/c.md");
    const result = await run(["hook", "pre-commit"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("commit stopped");
  });

  // spec: specfold-hooks#conversion-done
  it("blocks broken links again once convert is marked", async () => {
    const root = migrating();
    markConvert(root);
    write(root, "knowledge/domain/c.md", concept("Term", "See [secrets](/decisions/secrets.md)."));
    git(root, "add", "knowledge/domain/c.md");
    const result = await run(["hook", "pre-commit"], root);
    expect(result.code).toBe(1);
  });

  it("lets the post-edit hook pass a link to a concept not written yet", async () => {
    const root = migrating();
    write(root, "knowledge/domain/c.md", concept("Term", "See [secrets](/decisions/secrets.md)."));
    const event = JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: `${root}/knowledge/domain/c.md` },
    });
    const result = await run(["hook", "claude-post-tool-use"], root, event);
    expect(result.code).toBe(0);
    expect(result.stderr).toContain("(warning: migration in progress)");
  });

  /** A migrating repository with a long-described original at the base and a new concept linking to a missing one. */
  function halfConverted(): string {
    const root = gateRepo({
      "knowledge/domain/old.md": concept("Term", "An original.").replace(
        /^description: .*$/m,
        `description: ${"x".repeat(170)}`,
      ),
    });
    write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
    chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
    git(root, "update-ref", "refs/remotes/origin/main", "main");
    const base = git(root, "rev-parse", "HEAD").trim();
    let state: MigrationState = { ...readState(root), base, default_branch: "main" };
    for (const step of ["start", "inventory", "plan", "install"] as const)
      state = markStep(state, step, new Date());
    writeState(root, state);
    write(root, "knowledge/domain/new.md", concept("Term", "See [secrets](/decisions/secrets.md)."));
    writeIndexes(root);
    return root;
  }

  // spec: specfold-hooks#half-converted-bundle
  it("lets the stop hook end a turn in a half-converted bundle, listing what it relieved", async () => {
    const root = halfConverted();
    const result = await run(["hook", "claude-stop"], root, JSON.stringify({ hook_event_name: "Stop" }));
    expect(result.stderr).toContain("knowledge/domain/old.md");
    expect(result.stderr).toContain("G10");
    expect(result.stderr).toContain("(not blocking: migration in progress)");
    expect(result.code).toBe(0);
  });

  // spec: specfold-hooks#gate-unchanged
  it("leaves the gate strict in the same repository", async () => {
    const root = halfConverted();
    const result = await run(["gate", "--base", "main", "--local", "--json"], root);
    const blocking = (
      JSON.parse(result.stdout).findings as { rule: string; effect: string; path: string }[]
    ).filter((f) => f.effect === "block");
    expect(blocking.some((f) => f.rule === "G1" && f.path === "knowledge/domain/old.md")).toBe(true);
    expect(blocking.some((f) => f.rule === "G10")).toBe(true);
    expect(result.code).toBe(1);
  });
});
