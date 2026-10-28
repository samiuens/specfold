import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { planUpgrade } from "../src/upgrade/plan.ts";
import { installed, release } from "./upgrade-helpers.ts";

const VERIFIER = ".claude/agents/verifier.md";
const SKILL = ".agents/skills/sf-lookup/SKILL.md";

/** rc.1 installed in a repository, rc.2 changing `changes`; returns the plan and the paths. */
function setup(changes: Record<string, string | null>, edit?: (root: string) => void, withBase = true) {
  const base = release("0.1.0-rc.1");
  const next = release("0.1.0-rc.2", changes);
  const root = installed(base, "0.1.0-rc.1");
  edit?.(root);
  const plan = planUpgrade({
    root,
    from: next,
    base: withBase ? base : undefined,
    installed: "0.1.0-rc.1",
    target: "0.1.0-rc.2",
  });
  const step = (path: string) =>
    plan.files.find((f) => f.path === path) ?? plan.blocks.find((b) => b.path === path);
  return { root, plan, step };
}

const append = (root: string, path: string, text: string) =>
  writeFileSync(join(root, path), readFileSync(join(root, path), "utf8") + text);

describe("upgrade plan", () => {
  // spec: specfold-upgrade#unchanged-file-replaced
  it("replaces an unchanged kit file the new release changed, and adds and removes files", () => {
    const { plan, step } = setup({
      [SKILL]: "# sf-lookup\n\nLook things up first.\n",
      ".agents/skills/sf-upgrade/SKILL.md": "# sf-upgrade\n",
      ".github/workflows/specfold-gate-comment.yml": null,
    });
    expect(step(SKILL)).toMatchObject({
      action: "replace",
      data: Buffer.from("# sf-lookup\n\nLook things up first.\n"),
    });
    expect(step(".agents/skills/sf-upgrade/SKILL.md")).toMatchObject({ action: "add" });
    expect(step(".github/workflows/specfold-gate-comment.yml")).toMatchObject({ action: "remove" });
    expect(step("scripts/specfold.mjs")).toMatchObject({ action: "replace", mode: 0o755 });
    expect(step(VERIFIER)).toMatchObject({ action: "unchanged" });
    expect(plan.manifest.files[".github/workflows/specfold-gate-comment.yml"]).toBeUndefined();
    expect(plan.conflicts).toBe(false);
  });

  // spec: specfold-upgrade#local-edit-kept
  it("merges a local edit with the new release's change to another part", () => {
    const { step } = setup(
      { [VERIFIER]: "# Verifier\n\nRun all tests.\n\nRun the gate.\n\nReport findings.\n" },
      (root) => append(root, VERIFIER, "\nAlso run the linter.\n"),
    );
    expect(step(VERIFIER)).toMatchObject({
      action: "merge",
      data: "# Verifier\n\nRun all tests.\n\nRun the gate.\n\nReport findings.\n\nAlso run the linter.\n",
    });
  });

  // spec: specfold-upgrade#conflicting-edit
  it("leaves conflict markers when both changed the same line", () => {
    const { plan, step } = setup(
      { [VERIFIER]: "# Verifier\n\nRun all tests.\n\nRun the gate.\n\nReport findings.\n" },
      (root) =>
        writeFileSync(
          join(root, VERIFIER),
          "# Verifier\n\nRun the unit tests.\n\nRun the gate.\n\nReport findings.\n",
        ),
    );
    expect(step(VERIFIER)).toMatchObject({ action: "conflict" });
    expect(String((step(VERIFIER) as { data: string }).data)).toContain("<<<<<<< local");
    expect(plan.conflicts).toBe(true);
  });

  it("reports a changed file as a conflict when the installed release is not available", () => {
    const { plan, step } = setup(
      { [VERIFIER]: "# Verifier\n\nRun all tests.\n" },
      (root) => append(root, VERIFIER, "local\n"),
      false,
    );
    expect(step(VERIFIER)).toMatchObject({
      action: "conflict",
      reason: expect.stringContaining("not available"),
    });
    expect((step(VERIFIER) as { data?: unknown }).data).toBeUndefined();
    expect(plan.manifest.files[VERIFIER]).toMatch(/^sha256:/);
  });

  it("keeps a changed file the new release dropped, and writes a missing one", () => {
    const { step } = setup({ ".github/workflows/specfold-gate-comment.yml": null }, (root) => {
      append(root, ".github/workflows/specfold-gate-comment.yml", "# ours\n");
      rmSync(join(root, SKILL));
    });
    expect(step(".github/workflows/specfold-gate-comment.yml")).toMatchObject({ action: "keep" });
    expect(step(SKILL)).toMatchObject({ action: "add" });
  });

  // spec: specfold-upgrade#text-outside-the-block-kept
  it("replaces the block and keeps the team's text above the markers", () => {
    const { step } = setup(
      { "AGENTS.md": "# Agent instructions\n\nRead knowledge first, then specs.\n" },
      (root) =>
        writeFileSync(
          join(root, "AGENTS.md"),
          `Team rules first.\n\n${readFileSync(join(root, "AGENTS.md"), "utf8")}`,
        ),
    );
    expect(step("AGENTS.md")).toMatchObject({
      action: "replace",
      text: "Team rules first.\n\n<!-- specfold:start -->\n# Agent instructions\n\nRead knowledge first, then specs.\n<!-- specfold:end -->\n",
    });
  });

  it("merges an edited block and reports a block without markers", () => {
    const { step } = setup(
      {
        "AGENTS.md": "# Agent instructions\n\nRead knowledge first, then specs.\n",
        ".gitignore": ".specfold/local.yaml\n.cache/\n",
      },
      (root) => {
        writeFileSync(
          join(root, "AGENTS.md"),
          readFileSync(join(root, "AGENTS.md"), "utf8").replace(
            "# Agent instructions",
            "# Our agent instructions",
          ),
        );
        writeFileSync(join(root, ".gitignore"), "node_modules/\n");
      },
    );
    expect(step("AGENTS.md")).toMatchObject({
      action: "merge",
      text: "<!-- specfold:start -->\n# Our agent instructions\n\nRead knowledge first, then specs.\n<!-- specfold:end -->\n",
    });
    expect(step(".gitignore")).toMatchObject({ action: "conflict", reason: "the specfold markers are gone" });
  });

  // spec: specfold-upgrade#turned-on-workflow-replaced
  it("replaces a turned-on upgrade workflow with the release's inactive copy", () => {
    const WORKFLOW = ".specfold/workflows/specfold-upgrade.yml";
    const ACTIVE = ".github/workflows/specfold-upgrade.yml";
    const base = release("0.1.0-rc.1", { [WORKFLOW]: "name: specfold-upgrade\n" });
    const next = release("0.1.0-rc.2", { [WORKFLOW]: "name: specfold-upgrade\n# weekly\n" });
    const root = installed(base, "0.1.0-rc.1");
    writeFileSync(join(root, ACTIVE), "name: specfold-upgrade\n");
    const manifest = JSON.parse(readFileSync(join(root, ".specfold/manifest.json"), "utf8"));
    manifest.files[ACTIVE] = manifest.files[WORKFLOW];
    writeFileSync(join(root, ".specfold/manifest.json"), JSON.stringify(manifest));
    const plan = planUpgrade({ root, from: next, base, installed: "0.1.0-rc.1", target: "0.1.0-rc.2" });
    expect(plan.files.find((f) => f.path === ACTIVE)).toMatchObject({
      action: "replace",
      data: Buffer.from("name: specfold-upgrade\n# weekly\n"),
    });
    expect(plan.files.find((f) => f.path === WORKFLOW)).toMatchObject({ action: "replace" });
  });

  // spec: specfold-upgrade#not-turned-on
  it("does not create the upgrade workflow when it was never turned on", () => {
    const { plan } = setup({ ".specfold/workflows/specfold-upgrade.yml": "name: specfold-upgrade\n" });
    expect(plan.files.map((f) => f.path)).not.toContain(".github/workflows/specfold-upgrade.yml");
    expect(plan.files.find((f) => f.path === ".specfold/workflows/specfold-upgrade.yml")).toMatchObject({
      action: "add",
    });
  });

  it("lists the migrations and notes of the versions passed, in order", () => {
    const { plan } = setup({
      "upgrade/migrations/0.1.0-rc.1.mjs": "export default () => {};\n",
      "upgrade/migrations/0.1.0-rc.2.mjs": "export default () => {};\n",
      "upgrade/migrations/0.1.0.mjs": "export default () => {};\n",
      "upgrade/notes/0.1.0-rc.2.md": "Run the rc.2 CLI once.\n",
    });
    expect(plan.migrations).toEqual(["0.1.0-rc.2"]);
    expect(plan.notes).toEqual([{ version: "0.1.0-rc.2", text: "Run the rc.2 CLI once." }]);
  });
});
