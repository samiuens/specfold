import { chmodSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";
import { fixtureRepo, TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const read = (root: string, p: string) => readFileSync(join(root, p), "utf8");
const status = (root: string) => git(root, "status", "--porcelain", "--untracked-files=all");

/** A git repository on `main` made from the template, plus `files`, all committed. */
function templateRepo(files: Record<string, string> = {}): string {
  const root = tempDir();
  cpSync(TEMPLATE, root, { recursive: true, verbatimSymlinks: true });
  for (const [path, content] of Object.entries(files)) write(root, path, content);
  git(root, "init", "-q", "-b", "main");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "from the template");
  return root;
}

/** Puts a gh on the PATH: logged in, it answers for acme/shop and keeps a posted ruleset; else it fails. */
function fakeGh(loggedIn: boolean): string {
  const bin = tempDir();
  const script = loggedIn
    ? `#!/bin/sh
echo "$*" >> "${bin}/calls.log"
case "$*" in
  "auth status --hostname github.com") exit 0 ;;
  "repo view --json nameWithOwner") echo '{"nameWithOwner":"acme/shop"}' ;;
  "api repos/acme/shop/rulesets") echo '[]' ;;
  "api --method POST repos/acme/shop/rulesets --input -") cat > "${bin}/posted.json"; echo '{}' ;;
  *) echo "unexpected gh $*" >&2; exit 1 ;;
esac
`
    : "#!/bin/sh\nexit 1\n";
  writeFileSync(join(bin, "gh"), script);
  chmodSync(join(bin, "gh"), 0o755);
  vi.stubEnv("PATH", `${bin}:${process.env.PATH}`);
  return bin;
}

const TS_PROJECT = { "package.json": "{}\n", "tsconfig.json": "{}\n", "src/index.ts": "export {};\n" };

describe("specfold init", () => {
  // spec: specfold-init#not-a-template-repository
  it("refuses a repository without the template files", async () => {
    const root = fixtureRepo("adr-docs");
    const result = await run(["init"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("not a Specfold template repository (missing specfold.yaml");
    expect(result.stderr).toContain("copy the template files, or use sf-migrate");
    expect(status(root)).toBe("");
  });

  // spec: specfold-init#workflow-turned-on
  it("turns on the upgrade workflow with --upgrade-workflow", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init", "--upgrade-workflow"], root);
    expect(result.code).toBe(0);
    expect(read(root, ".github/workflows/specfold-upgrade.yml")).toBe(
      read(root, ".specfold/workflows/specfold-upgrade.yml"),
    );
    expect(JSON.parse(read(root, ".specfold/manifest.json")).files).toHaveProperty([
      ".github/workflows/specfold-upgrade.yml",
    ]);
    expect(result.stdout).toContain("SPECFOLD_TOKEN");
  });

  // spec: specfold-init#workflow-off-by-default
  it("leaves the upgrade workflow off without the flag", async () => {
    const root = templateRepo(TS_PROJECT);
    expect((await run(["init"], root)).code).toBe(0);
    expect(existsSync(join(root, ".github/workflows/specfold-upgrade.yml"))).toBe(false);
    expect(JSON.parse(read(root, ".specfold/manifest.json")).files).not.toHaveProperty([
      ".github/workflows/specfold-upgrade.yml",
    ]);
  });

  // spec: specfold-init#gate-made-required
  it("makes the gate a required check with --require-gate", async () => {
    const root = templateRepo(TS_PROJECT);
    const posted = join(fakeGh(true), "posted.json");
    const result = await run(["init", "--require-gate"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("ruleset specfold-gate: created\n");
    expect(JSON.parse(readFileSync(posted, "utf8"))).toMatchObject({ name: "specfold-gate" });
  });

  // spec: specfold-init#cannot-set-it
  it("reports a refused required check as skipped and still exits with 0", async () => {
    const root = templateRepo(TS_PROJECT);
    fakeGh(false);
    const result = await run(["init", "--require-gate"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("ruleset specfold-gate: skipped: gh is not logged in to github.com\n");
    expect(result.stdout).toContain("then: To do it by hand:");
  });

  it("lists the required check in a dry run and asks GitHub nothing", async () => {
    const root = templateRepo(TS_PROJECT);
    const bin = fakeGh(true);
    const result = await run(["init", "--require-gate", "--dry-run"], root);
    expect(result.stdout).toContain("ruleset specfold-gate: would run gate require\n");
    expect(existsSync(join(bin, "calls.log"))).toBe(false);
  });

  // spec: specfold-init#typescript-project
  it("fills the detected stack and source globs", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toContain("stack: Node.js, TypeScript (detected)\n");
    expect(result.stdout).toContain("source globs: src/** (detected)\n");
    expect(read(root, "openspec/config.yaml")).toContain("\n  Stack: Node.js, TypeScript\n");
    expect(parse(read(root, "specfold.yaml")).source_globs).toEqual(["src/**"]);
  });

  // spec: specfold-init#flag-wins
  it("lets flags override detection", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init", "--source-glob", "lib/**", "--stack", "Deno"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("source globs: lib/** (--source-glob)\n");
    expect(parse(read(root, "specfold.yaml")).source_globs).toEqual(["lib/**"]);
    expect(read(root, "openspec/config.yaml")).toContain("\n  Stack: Deno\n");
    expect(read(root, "specfold.yaml")).toContain('source_globs: ["lib/**"]\n');
  });

  // spec: specfold-init#fresh-template-repository
  it("sets up OpenSpec, markers, links, hooks and the manifest", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init"], root);
    expect(result.code).toBe(0);
    expect(existsSync(join(root, ".agents/skills/openspec-propose/SKILL.md"))).toBe(true);
    expect(existsSync(join(root, ".claude/skills/openspec-propose/SKILL.md"))).toBe(true);
    expect(parse(read(root, "openspec/config.yaml")).schema).toBe("specfold");
    expect(git(root, "config", "core.hooksPath").trim()).toBe(".specfold/hooks");
    expect(existsSync(join(root, ".specfold/hooks/pre-commit"))).toBe(true);
    expect(read(root, "AGENTS.md")).toBe(
      `<!-- specfold:start -->\n${read(TEMPLATE, "AGENTS.md").trimEnd()}\n<!-- specfold:end -->\n`,
    );
    expect(read(root, ".gitignore").startsWith("# specfold:start\n")).toBe(true);
    expect(read(root, ".specfold/manifest.json")).toBe(read(TEMPLATE, ".specfold/manifest.json"));
    expect(result.stdout).toMatch(/^init: \d+ changes$/m);
  });

  it("leaves an edited block file without markers and out of the manifest", async () => {
    const root = templateRepo({ ...TS_PROJECT, "AGENTS.md": "# Our own rules\n" });
    const result = await run(["init"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "AGENTS.md: skipped: differs from the template; no markers added, left out of the manifest\n",
    );
    expect(read(root, "AGENTS.md")).toBe("# Our own rules\n");
    expect(JSON.parse(read(root, ".specfold/manifest.json")).blocks["AGENTS.md"]).toBeUndefined();
  });

  it("without Claude Code clears the link targets and leaves CLAUDE.md alone", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init", "--tools", "agents"], root);
    expect(result.code).toBe(0);
    expect(parse(read(root, "specfold.yaml")).agents.targets).toEqual([]);
    expect(read(root, "CLAUDE.md")).toBe(read(TEMPLATE, "CLAUDE.md"));
    expect(existsSync(join(root, ".claude/skills/openspec-propose"))).toBe(false);
    expect(JSON.parse(read(root, ".specfold/manifest.json")).blocks["CLAUDE.md"]).toBeUndefined();
  });

  it("keeps the placeholder and the template globs when nothing is detected", async () => {
    const root = templateRepo();
    const result = await run(["init", "--dry-run"], root);
    expect(result.stdout).toContain("stack: unknown (not detected; placeholder kept)\n");
    expect(result.stdout).toContain("source globs: src/** (fallback: no code folder found)\n");
  });

  // spec: specfold-init#preview
  it("previews with --dry-run and writes nothing", async () => {
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init", "--dry-run"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toContain("stack: Node.js, TypeScript (detected)\n");
    expect(result.stdout).toContain("source globs: src/** (detected)\n");
    expect(result.stdout).toContain("openspec/config.yaml: would fill\n");
    expect(result.stdout).toContain("AGENTS.md: would block\n");
    expect(result.stdout).toMatch(/init: dry run, nothing written\n$/);
    expect(status(root)).toBe("");
  });

  // spec: specfold-init#rerun
  it("changes nothing on a second run", async () => {
    const root = templateRepo(TS_PROJECT);
    await run(["init"], root);
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "init");
    const result = await run(["init"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toBe(
      "stack: Node.js, TypeScript (kept)\nsource globs: src/** (detected)\ninit: everything is up to date\n",
    );
    expect(status(root)).toBe("");
  });

  it("keeps filled values on a rerun without flags", async () => {
    const root = templateRepo(TS_PROJECT);
    await run(["init", "--stack", "Deno", "--source-glob", "lib/**"], root);
    const result = await run(["init"], root);
    expect(result.stdout).toContain("stack: Deno (kept)\n");
    expect(result.stdout).toContain("source globs: lib/** (kept)\n");
  });

  // spec: specfold-init#default-limit
  it("sets a subagent limit of 3 when none exists", async () => {
    vi.stubEnv("CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS", "");
    const root = templateRepo(TS_PROJECT);
    const result = await run(["init"], root);
    expect(result.stdout).toContain(".claude/settings.local.json: set subagent limit to 3\n");
    expect(JSON.parse(read(root, ".claude/settings.local.json")).env).toEqual({
      CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS: "3",
    });
  });

  // spec: specfold-init#existing-limit-kept
  it("keeps an existing limit unless the flag sets one", async () => {
    vi.stubEnv("CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS", "");
    const root = templateRepo(TS_PROJECT);
    await run(["init", "--max-subagents", "5"], root);
    const rerun = await run(["init"], root);
    expect(rerun.stdout).not.toContain("subagent limit");
    expect(
      JSON.parse(read(root, ".claude/settings.local.json")).env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS,
    ).toBe("5");
    expect((await run(["init", "--max-subagents", "lots"], root)).code).toBe(2);
  });
});
