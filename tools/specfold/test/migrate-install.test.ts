import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { type InstallOptions, installKit } from "../src/migrate/install.ts";
import { git, write } from "./gate-helpers.ts";
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
const status = (root: string) => git(root, "status", "--porcelain", "--untracked-files=all");

describe("migrate install: files", () => {
  // spec: specfold-migrate#wrong-folder
  it("refuses a folder that is not a template, writing nothing", () => {
    const root = fixtureRepo("adr-docs");
    const kitRoot = fileURLToPath(new URL("../../..", import.meta.url));
    expect(() => install(root, { from: join(kitRoot, "examples") })).toThrow(
      "missing specfold.yaml, scripts/specfold.mjs, openspec/schemas/specfold",
    );
    expect(status(root)).toBe("");
  });

  // spec: specfold-migrate#differing-cli-copy
  it("reports a differing kit-owned file as a conflict and installs the rest", () => {
    const root = fixtureRepo("adr-docs");
    write(root, "scripts/specfold.mjs", "// our own script\n");
    const result = install(root);
    expect(read(root, "scripts/specfold.mjs")).toBe("// our own script\n");
    expect(result.conflicts).toEqual([
      { path: "scripts/specfold.mjs", reason: "differs from the kit's copy; left unchanged" },
    ]);
    expect(existsSync(join(root, ".agents/skills/sf-lookup/SKILL.md"))).toBe(true);
    expect(JSON.parse(read(root, ".specfold/manifest.json")).files["scripts/specfold.mjs"]).toBeUndefined();
  });

  // spec: specfold-migrate#existing-agents-md
  it("puts Specfold's AGENTS.md into a managed block above the team's rules, once", () => {
    const root = fixtureRepo("cursor-openspec");
    install(root);
    install(root);
    const text = read(root, "AGENTS.md");
    expect(text.match(/<!-- specfold:start -->/g)).toHaveLength(1);
    expect(text.startsWith(`<!-- specfold:start -->\n${read(TEMPLATE, "AGENTS.md")}`)).toBe(true);
    expect(
      text.endsWith(
        "<!-- specfold:end -->\n\n# Team rules\n\n- Run `npm test` before every commit.\n- Never log email addresses.\n",
      ),
    ).toBe(true);
    expect(read(root, ".gitignore")).toContain("# specfold:start\n");
    expect(read(root, ".gitignore")).toContain(".specfold/migration/state.json\n");
  });

  // spec: specfold-migrate#existing-permissions
  it("merges Specfold's hooks into existing Claude Code settings", () => {
    const root = fixtureRepo("cursor-openspec");
    install(root);
    const data = JSON.parse(read(root, ".claude/settings.json"));
    expect(data.permissions).toEqual({ deny: ["Read(./.env)"] });
    expect(Object.keys(data.hooks)).toEqual(["SessionStart", "PostToolUse", "Stop"]);
  });

  // spec: specfold-migrate#source-globs
  it("creates specfold.yaml with the given source globs and the knowledge skeleton", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { sourceGlobs: ["lib/**"] });
    const settings = parse(read(root, "specfold.yaml"));
    expect(settings.source_globs).toEqual(["lib/**"]);
    expect(read(root, "specfold.yaml")).toContain('source_globs: ["lib/**"]\n');
    expect(read(root, "specfold.yaml")).toContain("# Where your code lives");
    expect(existsSync(join(root, "knowledge/index.md"))).toBe(true);
    expect(existsSync(join(root, "knowledge/conventions/code-comments.md"))).toBe(true);
  });

  // spec: specfold-migrate#agents-only
  it("writes nothing under .claude/ with --tools agents", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { tools: ["agents"] });
    expect(existsSync(join(root, ".agents/skills/sf-lookup/SKILL.md"))).toBe(true);
    expect(existsSync(join(root, ".claude"))).toBe(false);
    expect(existsSync(join(root, "CLAUDE.md"))).toBe(false);
    expect(parse(read(root, "specfold.yaml")).agents.targets).toEqual([]);
  });
});

describe("migrate install: OpenSpec, hooks and manifest", () => {
  // spec: specfold-migrate#active-change-on-another-schema
  it("keeps an existing OpenSpec setup and makes specfold the default schema", () => {
    const root = fixtureRepo("cursor-openspec");
    const before = read(root, "openspec/changes/add-logout/.openspec.yaml");
    const result = install(root);
    const config = parse(read(root, "openspec/config.yaml"));
    expect(config.schema).toBe("specfold");
    expect(config.context).toBe("Accounts service. Never log email addresses.\nStack: Node.js, TypeScript\n");
    expect(config.rules.proposal).toEqual(["Name the affected endpoint."]);
    expect(read(root, "openspec/changes/add-logout/.openspec.yaml")).toBe(before);
    expect(existsSync(join(root, "openspec/schemas/specfold/schema.yaml"))).toBe(true);
    expect(result.actions.some((a) => a.action.startsWith("run openspec init"))).toBe(false);
    // lefthook is in use, so the hooks go there, and the user still has to install them
    expect(read(root, "lefthook.yml")).toContain("node scripts/specfold.mjs hook pre-commit {0}");
    expect(result.notes).toEqual(["run lefthook install"]);
  });

  it("runs openspec init in a repository without OpenSpec and writes the template config", () => {
    const root = fixtureRepo("adr-docs");
    install(root);
    expect(existsSync(join(root, ".agents/skills/openspec-propose/SKILL.md"))).toBe(true);
    const config = read(root, "openspec/config.yaml");
    expect(config).toContain("schema: specfold\n");
    expect(config).toContain("  Stack: Node.js\n");
    expect(execFileSync("git", ["config", "core.hooksPath"], { cwd: root, encoding: "utf8" }).trim()).toBe(
      ".specfold/hooks",
    );
    expect(existsSync(join(root, ".claude/skills/sf-lookup"))).toBe(true);
  });

  it("stops before writing when openspec is needed but missing", () => {
    const root = fixtureRepo("adr-docs");
    vi.stubEnv("PATH", "/nonexistent");
    expect(() => install(root)).toThrow("openspec is not installed");
    vi.unstubAllEnvs();
    expect(status(root)).toBe("");
  });

  // spec: specfold-migrate#manifest-entry
  it("records each installed kit file and block with its hash", () => {
    const root = fixtureRepo("adr-docs");
    install(root, { ref: "abc123" });
    const manifest = JSON.parse(read(root, ".specfold/manifest.json"));
    const hash = createHash("sha256")
      .update(readFileSync(join(TEMPLATE, "scripts/specfold.mjs")))
      .digest("hex");
    expect(manifest).toMatchObject({ manifest_version: 1, kit_version: "0.0.0", ref: "abc123" });
    expect(manifest.files["scripts/specfold.mjs"]).toBe(`sha256:${hash}`);
    expect(Object.keys(manifest.blocks)).toEqual([
      ".github/CODEOWNERS",
      ".github/pull_request_template.md",
      ".gitignore",
      "AGENTS.md",
      "CLAUDE.md",
    ]);
  });

  it("keeps the installed hash of a kit file that later differs", () => {
    const root = fixtureRepo("adr-docs");
    install(root);
    const before = JSON.parse(read(root, ".specfold/manifest.json"));
    write(root, ".agents/skills/sf-lookup/SKILL.md", "edited\n");
    write(root, "AGENTS.md", "<!-- specfold:start -->\nno end marker\n");
    const result = install(root);
    expect(result.conflicts.map((c) => c.path)).toEqual([".agents/skills/sf-lookup/SKILL.md", "AGENTS.md"]);
    expect(JSON.parse(read(root, ".specfold/manifest.json"))).toEqual(before);
  });

  // spec: specfold-migrate#rerun
  it("changes nothing on a second run", () => {
    for (const fixture of ["adr-docs", "cursor-openspec"] as const) {
      const root = fixtureRepo(fixture);
      install(root);
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "install");
      const again = install(root);
      expect(again, fixture).toEqual({ actions: [], conflicts: [], notes: [] });
      expect(status(root), fixture).toBe("");
    }
  });
});
