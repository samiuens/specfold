import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { filesUnder, type InstallOptions, installKit, kitOwned } from "../src/migrate/install.ts";
import { git } from "./gate-helpers.ts";
import { run } from "./helpers.ts";
import { fixtureRepo, TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const install = (root: string, o: Partial<InstallOptions> = {}) =>
  installKit({ root, from: TEMPLATE, tools: ["agents", "claude"], ...o });
const read = (root: string, p: string) => readFileSync(join(root, p), "utf8");
const KNOWLEDGE_SKILLS = ["sf-audit", "sf-capture", "sf-interview", "sf-lookup", "sf-migrate", "sf-upgrade"];

describe("migrate install: profile file set", () => {
  // spec: specfold-profile#full-install-unchanged
  it("installs every file under the kit-owned folders for full", () => {
    const folders = [
      "scripts/specfold.mjs",
      "openspec/schemas/specfold",
      ".agents/skills",
      ".specfold/workflows",
      ".specfold/profiles",
      ".github/workflows/specfold-gate.yml",
      ".github/workflows/specfold-gate-comment.yml",
      ".claude/agents",
    ];
    const all = folders.flatMap((f) => filesUnder(TEMPLATE, f));
    expect(kitOwned(TEMPLATE, ["agents", "claude"])).toEqual(all);
    expect(kitOwned(TEMPLATE, ["agents", "claude"], "full")).toEqual(all);
  });

  it("leaves the OpenSpec files out of the knowledge set", () => {
    const owned = kitOwned(TEMPLATE, ["agents", "claude"], "knowledge");
    const skills = [
      ...new Set(owned.filter((p) => p.startsWith(".agents/skills/")).map((p) => p.split("/")[2])),
    ];
    expect(skills).toEqual(KNOWLEDGE_SKILLS);
    expect(owned.filter((p) => p.startsWith(".claude/agents/"))).toEqual([".claude/agents/scout.md"]);
    expect(owned.some((p) => p.startsWith("openspec/"))).toBe(false);
    expect(owned).toContain(".specfold/profiles/knowledge/AGENTS.md");
  });
});

describe("migrate install: profile blocks", () => {
  // spec: specfold-profile#knowledge-agents-md
  it("writes the knowledge AGENTS.md block", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { profile: "knowledge" });
    const agents = read(root, "AGENTS.md");
    expect(agents).toContain(read(TEMPLATE, ".specfold/profiles/knowledge/AGENTS.md").trim());
    expect(agents).not.toMatch(/openspec/i);
    expect(agents).toContain("update the affected concepts");
  });

  // spec: specfold-profile#knowledge-pull-request-template
  it("writes the knowledge pull request template", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { profile: "knowledge" });
    const text = read(root, ".github/pull_request_template.md");
    expect(text).toMatch(/^No-knowledge reason:/m);
    expect(text).not.toMatch(/^Change:/m);
  });

  it("keeps the full blocks for full", () => {
    const root = fixtureRepo("adr-docs");
    install(root);
    expect(read(root, "AGENTS.md")).toContain("openspec show");
  });
});

describe("migrate install: --profile", () => {
  // spec: specfold-migrate#unknown-profile
  it("refuses an unknown profile with exit 2, writing nothing", async () => {
    const root = fixtureRepo("adr-docs");
    const result = await run(["migrate", "install", "--from", TEMPLATE, "--profile", "lite"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("full, knowledge");
    expect(git(root, "status", "--porcelain", "--untracked-files=all")).toBe("");
  });

  // spec: specfold-migrate#knowledge-install
  // spec: specfold-profile#fresh-knowledge-settings
  it("creates knowledge settings and leaves sf-plan out", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { profile: "knowledge" });
    const settings = parse(read(root, "specfold.yaml")) as {
      profile: string;
      gate: { escape_label: string };
    };
    expect(settings.profile).toBe("knowledge");
    expect(settings.gate.escape_label).toBe("no-knowledge");
    expect(existsSync(join(root, ".agents/skills/sf-plan"))).toBe(false);
    expect(existsSync(join(root, ".agents/skills/sf-lookup/SKILL.md"))).toBe(true);
  });

  it("takes the profile from existing settings", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { profile: "knowledge" });
    install(root);
    expect(existsSync(join(root, ".agents/skills/sf-plan"))).toBe(false);
  });

  // spec: specfold-migrate#conflicting-profile
  it("refuses a profile that differs from the settings, writing nothing", () => {
    const root = fixtureRepo("adr-docs");
    install(root);
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "installed");
    expect(() => install(root, { profile: "knowledge" })).toThrow("switching profiles");
    expect(git(root, "status", "--porcelain", "--untracked-files=all")).toBe("");
  });
});

describe("migrate install: knowledge profile without OpenSpec", () => {
  // spec: specfold-migrate#knowledge-profile-without-openspec
  // spec: specfold-profile#knowledge-install
  it("installs without OpenSpec and writes nothing under openspec/", () => {
    vi.stubEnv("PATH", "/usr/bin:/bin");
    const root = fixtureRepo("adr-docs");
    const result = install(root, { profile: "knowledge" });
    expect(result.conflicts.filter((c) => c.path !== "git hooks")).toEqual([]);
    expect(existsSync(join(root, "openspec"))).toBe(false);
    const skills = readdirSync(join(root, ".agents/skills")).sort();
    expect(skills).toEqual(KNOWLEDGE_SKILLS);
    expect(readdirSync(join(root, ".claude/agents"))).toEqual(["scout.md"]);
  });
});

describe("migrate install: manifest profile", () => {
  // spec: specfold-migrate#profile-recorded
  it("records the installed profile", () => {
    const knowledge = fixtureRepo("adr-docs");
    install(knowledge, { profile: "knowledge" });
    expect(JSON.parse(read(knowledge, ".specfold/manifest.json")).profile).toBe("knowledge");
    const full = fixtureRepo("adr-docs");
    install(full);
    expect(JSON.parse(read(full, ".specfold/manifest.json")).profile).toBe("full");
  });
});
