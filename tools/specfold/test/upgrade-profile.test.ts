import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyBlock, blockStyle } from "../src/migrate/blocks.ts";
import {
  BLOCK_FILES,
  blockContent,
  kitOwned,
  MANIFEST_PATH,
  manifestText,
  sha256,
} from "../src/migrate/install.ts";
import type { Profile } from "../src/repo.ts";
import { applyPlan } from "../src/upgrade/apply.ts";
import { planUpgrade } from "../src/upgrade/plan.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";
import { installed, release } from "./upgrade-helpers.ts";

const KNOWLEDGE_FILES = {
  ".agents/skills/sf-plan/SKILL.md": "# sf-plan\n\nPlan a change.\n",
  ".claude/agents/scout.md": "# Scout\n\nAnswer one question.\n",
  ".specfold/profiles/knowledge/AGENTS.md": "# Agent instructions\n\nUpdate the concepts with the code.\n",
};

/** A repository installed from `from` with the knowledge profile, as install does it. */
function installedKnowledge(from: string, version: string): string {
  const root = tempDir();
  const files: Record<string, string> = {};
  const blocks: Record<string, string> = {};
  for (const p of kitOwned(from, ["agents", "claude"], "knowledge")) {
    cpSync(join(from, p), join(root, p));
    files[p] = sha256(readFileSync(join(from, p)));
  }
  for (const p of BLOCK_FILES) {
    if (!existsSync(join(from, p))) continue;
    const content = blockContent(from, p, "knowledge");
    const merged = applyBlock(undefined, content, blockStyle(p));
    if ("text" in merged) write(root, p, merged.text);
    blocks[p] = sha256(content);
  }
  write(root, "specfold.yaml", `${readFileSync(join(from, "specfold.yaml"), "utf8")}profile: knowledge\n`);
  write(root, MANIFEST_PATH, manifestText(version, `v${version}`, { files, blocks }, "knowledge"));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-qm", "install"], {
    cwd: root,
  });
  return root;
}

const plan = (root: string, from: string, base: string, profile?: Profile) =>
  planUpgrade({ root, from, base, installed: "1.0.0", target: "1.1.0", profile });
const actionOf = (p: ReturnType<typeof plan>, path: string) => p.files.find((f) => f.path === path)?.action;

describe("upgrade: profile file set", () => {
  // spec: specfold-upgrade#knowledge-upgrade
  it("plans only the knowledge files for a knowledge repository", () => {
    const v1 = release("1.0.0", KNOWLEDGE_FILES);
    const v2 = release("1.1.0", {
      ...KNOWLEDGE_FILES,
      ".agents/skills/sf-plan/SKILL.md": "# sf-plan\n\nPlan a change, better.\n",
      ".agents/skills/sf-lookup/SKILL.md": "# sf-lookup\n\nLook things up, better.\n",
    });
    const root = installedKnowledge(v1, "1.0.0");
    const p = plan(root, v2, v1, "knowledge");
    expect(actionOf(p, ".agents/skills/sf-lookup/SKILL.md")).toBe("replace");
    expect(p.files.some((f) => f.path.includes("sf-plan"))).toBe(false);
    expect(p.files.some((f) => f.path.startsWith("openspec/"))).toBe(false);
    expect(p.blocks.find((b) => b.path === "AGENTS.md")?.action).toBe("unchanged");
    expect(p.profile).toBe("knowledge");
  });

  // spec: specfold-upgrade#old-manifest
  it("treats a manifest without profile as a full install", () => {
    const v1 = release("1.0.0", KNOWLEDGE_FILES);
    const v2 = release("1.1.0", {
      ...KNOWLEDGE_FILES,
      ".agents/skills/sf-plan/SKILL.md": "# sf-plan\n\nNew.\n",
    });
    const root = installed(v1, "1.0.0");
    const manifest = JSON.parse(readFileSync(join(root, MANIFEST_PATH), "utf8"));
    delete manifest.profile;
    writeFileSync(join(root, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
    const p = plan(root, v2, v1);
    expect(actionOf(p, ".agents/skills/sf-plan/SKILL.md")).toBe("replace");
    expect(actionOf(p, "openspec/schemas/specfold/schema.yaml")).toBe("unchanged");
    expect(p.profile).toBe("full");
  });

  it("records the profile when the plan is applied", () => {
    const v1 = release("1.0.0", KNOWLEDGE_FILES);
    const v2 = release("1.1.0", KNOWLEDGE_FILES);
    const root = installedKnowledge(v1, "1.0.0");
    applyPlan(root, plan(root, v2, v1, "knowledge"), "v1.1.0");
    expect(JSON.parse(readFileSync(join(root, MANIFEST_PATH), "utf8")).profile).toBe("knowledge");
  });
});
