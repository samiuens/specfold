import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filesUnder, type InstallOptions, installKit, kitOwned } from "../src/migrate/install.ts";
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
    const skills = [...new Set(owned.filter((p) => p.startsWith(".agents/skills/")).map((p) => p.split("/")[2]))];
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
