import { describe, expect, it } from "vitest";
import { migrationRelief } from "../src/migrate/relief.ts";
import { markStep, readState, writeState } from "../src/migrate/state.ts";
import { concept, gateRepo, git, write } from "./gate-helpers.ts";

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
});
