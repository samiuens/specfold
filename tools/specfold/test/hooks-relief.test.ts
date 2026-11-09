import { describe, expect, it } from "vitest";
import { migrationRelief } from "../src/migrate/relief.ts";
import { markStep, readState, writeState } from "../src/migrate/state.ts";
import { concept, gateRepo, git, write } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

/** A gate repository whose migration state records `start` to `install` at the current commit. */
function migrating(): string {
  const root = gateRepo();
  const base = git(root, "rev-parse", "HEAD").trim();
  const now = new Date();
  let state = { ...readState(root), base, default_branch: "main" };
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
});
