import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";
import { fixtureRepo, TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));
const branch = (root: string) => git(root, "branch", "--show-current").trim();
const state = (root: string) =>
  JSON.parse(readFileSync(join(root, ".specfold/migration/state.json"), "utf8"));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("migrate start", () => {
  // spec: specfold-migrate#state-not-committed
  it("keeps state.json out of git with its own .gitignore", async () => {
    const root = fixtureRepo("adr-docs");
    await run(["migrate", "start"], root);
    git(root, "add", ".specfold/migration");
    expect(git(root, "diff", "--cached", "--name-only").trim()).toBe(".specfold/migration/.gitignore");
  });

  // spec: specfold-migrate#no-git-repository
  it("needs a git repository", async () => {
    const result = await run(["migrate", "start"], tempDir());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("needs a git repository");
  });

  // spec: specfold-migrate#started-on-the-default-branch
  it("creates specfold/migration from the default branch and leaves it unchanged", async () => {
    const root = fixtureRepo("adr-docs");
    const main = git(root, "rev-parse", "main").trim();
    const result = await run(["migrate", "start"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toBe("created specfold/migration from main\nnext: specfold migrate inventory\n");
    expect(branch(root)).toBe("specfold/migration");
    expect(git(root, "rev-parse", "main").trim()).toBe(main);
    expect(state(root)).toMatchObject({ default_branch: "main", base: main });
    expect(git(root, "status", "--porcelain")).toBe("?? .specfold/\n");

    // started again from main, it switches back; on the branch, it resumes
    git(root, "checkout", "-q", "main");
    expect((await run(["migrate", "start"], root)).stdout).toContain("switched to specfold/migration");
    expect((await run(["migrate", "start"], root)).stdout).toContain("resuming on specfold/migration");
  });

  // spec: specfold-migrate#feature-branch
  it("refuses any other branch", async () => {
    const root = fixtureRepo("adr-docs");
    git(root, "checkout", "-q", "-b", "feature/login");
    const result = await run(["migrate", "start"], root);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("on branch 'feature/login'");
    expect(git(root, "branch", "--list", "specfold/migration")).toBe("");
    expect(existsSync(join(root, ".specfold"))).toBe(false);
  });

  // spec: specfold-migrate#dirty-tree
  it("refuses a dirty working tree", async () => {
    const root = fixtureRepo("adr-docs");
    write(root, "README.md", "changed\n");
    const result = await run(["migrate", "start"], root);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("uncommitted changes (README.md)");
    expect(branch(root)).toBe("main");
  });

  // spec: specfold-migrate#both-main-and-master
  it("asks for --default-branch when main and master both exist", async () => {
    const root = fixtureRepo("adr-docs");
    git(root, "branch", "master");
    const result = await run(["migrate", "start"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--default-branch");
    expect((await run(["migrate", "start", "--default-branch", "main"], root)).code).toBe(0);
  });
});

describe("migrate steps", () => {
  // spec: specfold-migrate#install-on-the-default-branch
  it("refuses to inventory, install or mark off the migration branch", async () => {
    const root = fixtureRepo("adr-docs");
    for (const argv of [["inventory"], ["install", "--from", TEMPLATE], ["mark", "plan"]]) {
      const result = await run(["migrate", ...argv], root);
      expect(result.code, argv[0]).toBe(1);
      expect(result.stderr).toContain("run specfold migrate start first");
    }
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  // spec: specfold-migrate#resumed-migration
  it("records steps and names the next one", async () => {
    const root = fixtureRepo("adr-docs");
    await run(["migrate", "start"], root);
    const inv = await run(["migrate", "inventory"], root);
    expect(inv.stdout).toContain("adr       ");
    expect(inv.stdout).toContain("docs/adr/0001-use-postgres.md");
    expect(inv.stdout).toContain("stack: Node.js\nlayout: single package\nci: none\nsource globs: src/**\n");
    expect(inv.stdout).toContain("inventory: 7 sources, about");
    await run(["migrate", "mark", "plan"], root);
    const status = await run(["migrate", "status"], root);
    expect(status.stdout).toMatch(/^done {2}start {4}\d{4}-/);
    expect(status.stdout).toContain("done  inventory");
    expect(status.stdout).toContain("done  plan");
    expect(status.stdout).toContain("open  install\n");
    expect(status.stdout).toContain("next: specfold migrate install --from <template folder>\n");
    expect(JSON.parse((await run(["migrate", "status", "--json"], root)).stdout).next).toBe("install");
  });

  it("installs from the template, then reports a rerun as up to date", async () => {
    const root = fixtureRepo("cursor-openspec");
    await run(["migrate", "start"], root);
    await run(["migrate", "inventory"], root);
    await run(["migrate", "mark", "plan"], root);
    const first = await run(["migrate", "install", "--from", TEMPLATE, "--ref", "abc"], root);
    expect(first.code).toBe(0);
    expect(first.stdout).toContain("AGENTS.md: block\n");
    expect(first.stdout).toContain("then: run lefthook install\n");
    expect(first.stdout).toContain("next: convert the plan rows");
    expect(state(root).steps.install).toBeDefined();
    const again = await run(["migrate", "install", "--from", TEMPLATE, "--ref", "abc"], root);
    expect(again.stdout).toContain("migrate install: everything is up to date\n");
  });

  it("rejects bad arguments", async () => {
    const root = fixtureRepo("adr-docs");
    await run(["migrate", "start"], root);
    for (const argv of [
      ["migrate"],
      ["migrate", "go"],
      ["migrate", "mark", "install"],
      ["migrate", "mark"],
      ["migrate", "install"],
      ["migrate", "install", "--from", TEMPLATE, "--tools", "claude"],
      ["migrate", "status", "x"],
    ])
      expect((await run(argv, root)).code, argv.join(" ")).toBe(2);
  });
});
