import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyLinks, listSkills, planLinks } from "../src/agents/sync.ts";
import { tempDir } from "./helpers.ts";

function repo(skills: string[]): string {
  const root = tempDir();
  for (const name of skills) {
    mkdirSync(join(root, ".agents/skills", name), { recursive: true });
    writeFileSync(join(root, ".agents/skills", name, "SKILL.md"), `---\nname: ${name}\n---\n`);
  }
  return root;
}

const sync = (root: string, targets = [".claude/skills"]) => {
  const plan = planLinks(root, listSkills(root) ?? [], targets);
  applyLinks(root, plan);
  return plan;
};

describe("agents sync: planning", () => {
  it("lists skill folders and ignores files and dot entries", () => {
    const root = repo(["sf-b", "sf-a"]);
    writeFileSync(join(root, ".agents/skills/.openspec-target"), "x");
    mkdirSync(join(root, ".agents/skills/.hidden"));
    expect(listSkills(root)).toEqual(["sf-a", "sf-b"]);
    expect(listSkills(tempDir())).toBeUndefined();
  });

  // spec: specfold-agents-sync#two-targets
  it("links every skill into every target", () => {
    const root = repo(["sf-lookup"]);
    expect(sync(root, [".opencode/skills", ".claude/skills"]).map((p) => [p.path, p.action])).toEqual([
      [".claude/skills/sf-lookup", "link"],
      [".opencode/skills/sf-lookup", "link"],
    ]);
    for (const t of [".claude/skills", ".opencode/skills"]) {
      expect(lstatSync(join(root, t, "sf-lookup")).isSymbolicLink()).toBe(true);
      expect(existsSync(join(root, t, "sf-lookup", "SKILL.md"))).toBe(true);
    }
    expect(sync(root, [".claude/skills", ".opencode/skills"])).toEqual([]);
  });

  // spec: specfold-agents-sync#nested-target
  it("writes relative links for nested targets", () => {
    const root = repo(["sf-lookup"]);
    sync(root, [".config/tool/skills"]);
    expect(readlinkSync(join(root, ".config/tool/skills/sf-lookup"))).toBe(
      "../../../.agents/skills/sf-lookup",
    );
  });

  it("repoints an own link to the wrong skill path", () => {
    const root = repo(["sf-lookup", "sf-sync"]);
    mkdirSync(join(root, ".claude/skills"), { recursive: true });
    symlinkSync("../../.agents/skills/sf-sync", join(root, ".claude/skills/sf-lookup"));
    expect(sync(root).find((p) => p.path === ".claude/skills/sf-lookup")).toEqual({
      path: ".claude/skills/sf-lookup",
      action: "relink",
      target: "../../.agents/skills/sf-lookup",
    });
    expect(readlinkSync(join(root, ".claude/skills/sf-lookup"))).toBe("../../.agents/skills/sf-lookup");
  });

  // spec: specfold-agents-sync#skill-removed
  it("removes own links whose skill is gone and keeps foreign links", () => {
    const root = repo(["sf-lookup"]);
    mkdirSync(join(root, ".claude/skills"), { recursive: true });
    symlinkSync("../../.agents/skills/sf-old", join(root, ".claude/skills/sf-old"));
    symlinkSync("/somewhere/else", join(root, ".claude/skills/foreign"));
    const plan = sync(root);
    expect(plan).toContainEqual({
      path: ".claude/skills/sf-old",
      action: "unlink",
      target: "../../.agents/skills/sf-old",
    });
    expect(existsSync(join(root, ".claude/skills/sf-old"))).toBe(false);
    expect(lstatSync(join(root, ".claude/skills/foreign")).isSymbolicLink()).toBe(true);
    expect(plan.map((p) => p.path)).not.toContain(".claude/skills/foreign");
  });

  // spec: specfold-agents-sync#generated-folder-kept
  it("keeps real folders and foreign links that share a skill's name", () => {
    const root = repo(["openspec-propose", "sf-x"]);
    mkdirSync(join(root, ".claude/skills/openspec-propose"), { recursive: true });
    writeFileSync(join(root, ".claude/skills/openspec-propose/SKILL.md"), "generated\n");
    symlinkSync("/elsewhere/sf-x", join(root, ".claude/skills/sf-x"));
    expect(sync(root)).toEqual([
      { path: ".claude/skills/openspec-propose", action: "kept", target: null },
      { path: ".claude/skills/sf-x", action: "kept", target: "/elsewhere/sf-x" },
    ]);
    expect(lstatSync(join(root, ".claude/skills/openspec-propose")).isDirectory()).toBe(true);
  });
});
