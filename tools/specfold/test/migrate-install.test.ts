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
  // spec: specfold-migrate#install-with-the-workflow
  it("turns on the upgrade workflow only with --upgrade-workflow", () => {
    const off = fixtureRepo("adr-docs");
    install(off);
    expect(existsSync(join(off, ".github/workflows/specfold-upgrade.yml"))).toBe(false);
    expect(existsSync(join(off, ".specfold/workflows/specfold-upgrade.yml"))).toBe(true);
    const on = fixtureRepo("adr-docs");
    const result = install(on, { upgradeWorkflow: true });
    expect(read(on, ".github/workflows/specfold-upgrade.yml")).toBe(
      read(TEMPLATE, ".specfold/workflows/specfold-upgrade.yml"),
    );
    expect(JSON.parse(read(on, ".specfold/manifest.json")).files).toHaveProperty([
      ".github/workflows/specfold-upgrade.yml",
    ]);
    expect(result.notes.join("\n")).toContain("SPECFOLD_TOKEN");
    expect(install(on).actions.map((a) => a.path)).not.toContain(".github/workflows/specfold-upgrade.yml");
    expect(JSON.parse(read(on, ".specfold/manifest.json")).files).toHaveProperty([
      ".github/workflows/specfold-upgrade.yml",
    ]);
  });

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
    for (const p of [".gitattributes", ".worktreeinclude"]) {
      expect(read(root, p).match(/# specfold:start/g)).toHaveLength(1);
      expect(read(root, p)).toContain(read(TEMPLATE, p).trimEnd());
    }
  });

  // spec: specfold-migrate#existing-permissions
  // spec: specfold-migrate#default-permissions-installed
  it("merges Specfold's hooks into existing Claude Code settings and renders the rules", () => {
    const root = fixtureRepo("cursor-openspec");
    const result = install(root);
    const data = JSON.parse(read(root, ".claude/settings.json"));
    const templateDeny = JSON.parse(read(TEMPLATE, ".claude/settings.json")).permissions.deny;
    expect(data.permissions.deny).toEqual(["Read(./.env)", ...templateDeny]);
    expect(data.permissions.ask).toEqual(
      expect.arrayContaining(["Bash(git push *)", "Bash(gh pr create *)"]),
    );
    expect(Object.keys(data.hooks)).toEqual(["SessionStart", "PostToolUse", "Stop"]);
    expect(result.conflicts).toEqual([]);
  });

  it("reports an invalid permissions setting as a conflict and installs the rest", () => {
    const root = fixtureRepo("cursor-openspec");
    write(root, "specfold.yaml", "types: [Decision]\npermissions:\n  push: deny\n  push-tags: ask\n");
    const result = install(root);
    expect(result.conflicts).toEqual([
      { path: ".claude/settings.json", reason: expect.stringContaining("push-tags") },
    ]);
    expect(JSON.parse(read(root, ".claude/settings.json")).permissions.ask).toBeUndefined();
    expect(existsSync(join(root, ".agents/skills/sf-lookup/SKILL.md"))).toBe(true);
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

  // spec: specfold-migrate#workspace-globs
  it("takes the source globs from package.json workspaces", () => {
    const root = fixtureRepo("adr-docs");
    write(root, "package.json", JSON.stringify({ workspaces: ["apps/*", "packages/*", "!packages/legacy"] }));
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "workspaces");
    install(root);
    expect(parse(read(root, "specfold.yaml")).source_globs).toEqual(["apps/*/src/**", "packages/*/src/**"]);
  });

  // spec: specfold-migrate#claude-md-already-imports-agents-md
  it("keeps one @AGENTS.md import when CLAUDE.md already has it", () => {
    const root = fixtureRepo("adr-docs");
    const team = "@AGENTS.md\n\n# Team notes\n\n- Be kind.\n";
    write(root, "CLAUDE.md", team);
    install(root);
    install(root);
    const text = read(root, "CLAUDE.md");
    expect(text.match(/^@AGENTS\.md$/gm)).toHaveLength(1);
    expect(text.endsWith(`<!-- specfold:end -->\n\n${team}`)).toBe(true);
    expect(text.split("<!-- specfold:end -->")[0]).not.toContain("@AGENTS.md");
  });

  // spec: specfold-migrate#agents-only
  // spec: specfold-migrate#agents-only-skips-the-rules
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
    const { kit_version } = parse(readFileSync(join(TEMPLATE, "specfold.yaml"), "utf8"));
    expect(manifest).toMatchObject({ manifest_version: 1, kit_version, ref: "abc123" });
    expect(manifest.files["scripts/specfold.mjs"]).toBe(`sha256:${hash}`);
    expect(Object.keys(manifest.blocks)).toEqual([
      ".gitattributes",
      ".github/CODEOWNERS",
      ".github/pull_request_template.md",
      ".gitignore",
      ".worktreeinclude",
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
