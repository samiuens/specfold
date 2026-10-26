import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

/** A git repository with specfold.yaml at its root. */
function repo(settings = "types: []\n"): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  write(root, "specfold.yaml", settings);
  return root;
}

const hooksPath = (root: string) => {
  try {
    return execFileSync("git", ["config", "--get", "core.hooksPath"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
};

describe("hooks install: built-in", () => {
  // spec: specfold-hooks#fresh-repository
  it("writes executable hook scripts and sets core.hooksPath", async () => {
    const root = repo("types: []\nhooks:\n  extra:\n    commit-msg: [check]\n");
    const result = await run(["hooks", "install"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(".specfold/hooks/pre-commit: write\n");
    expect(result.stdout).toContain(".specfold/hooks/commit-msg: write\n");
    expect(result.stdout).toMatch(/hooks install: 6 changes \(built-in hooks\)\n$/);
    const script = join(root, ".specfold/hooks/pre-commit");
    expect(statSync(script).mode & 0o111).not.toBe(0);
    expect(readFileSync(script, "utf8")).toContain('exec node scripts/specfold.mjs hook pre-commit "$@"\n');
    expect(hooksPath(root)).toBe(".specfold/hooks");
    expect((await run(["hooks", "install"], root)).stdout).toBe(
      "hooks install: built-in hooks are up to date\n",
    );
  });

  // spec: specfold-hooks#custom-hooks-folder
  it("refuses a foreign core.hooksPath without a manager", async () => {
    const root = repo();
    git(root, "config", "core.hooksPath", ".githooks");
    const result = await run(["hooks", "install"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("'.githooks'");
    expect(existsSync(join(root, ".specfold"))).toBe(false);
  });

  // spec: specfold-hooks#nested-repository
  it("refuses a repository below the git root", async () => {
    const root = tempDir();
    git(root, "init", "-q", "-b", "main");
    write(root, "examples/sample-app/specfold.yaml", "types: []\n");
    const result = await run(["hooks", "install"], join(root, "examples/sample-app"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("hooks are installed from the git root");
    expect(hooksPath(root)).toBeUndefined();
  });

  it("prints JSON and rejects unknown subcommands", async () => {
    const out = JSON.parse((await run(["hooks", "install", "--json"], repo())).stdout);
    expect(out).toMatchObject({ ok: true, manager: null, next: null });
    expect(out.actions).toContainEqual({ path: "core.hooksPath", action: "set to .specfold/hooks" });
    for (const argv of [["hooks"], ["hooks", "add"], ["hooks", "install", "x"]])
      expect((await run(argv, repo())).code, argv.join(" ")).toBe(2);
  });
});

describe("hooks install: hook managers", () => {
  // spec: specfold-hooks#lefthook-in-use
  it("adds one specfold command per hook to lefthook.yml, once", async () => {
    const root = repo();
    write(
      root,
      "lefthook.yml",
      "# team hooks\npre-commit:\n  commands:\n    lint:\n      run: npm run lint\npre-push:\n  jobs:\n    - name: test\n      run: npm test\n",
    );
    const first = await run(["hooks", "install"], root);
    expect(first.stdout).toContain("next: run lefthook install\n");
    await run(["hooks", "install"], root);
    const text = readFileSync(join(root, "lefthook.yml"), "utf8");
    expect(text).toContain("# team hooks");
    expect(text.match(/hook pre-commit \{0\}/g)).toHaveLength(1);
    expect(text).toContain(
      "    lint:\n      run: npm run lint\n    specfold:\n      run: node scripts/specfold.mjs hook pre-commit {0}\n",
    );
    expect(text).toContain("    - name: specfold\n      run: node scripts/specfold.mjs hook pre-push {0}\n");
    expect(text).toContain("post-merge:\n  commands:\n    specfold:");
    expect(hooksPath(root)).toBeUndefined();
  });

  // spec: specfold-hooks#husky-in-use
  it("appends a line to each husky hook", async () => {
    const root = repo();
    write(root, ".husky/pre-commit", "npx lint-staged");
    git(root, "config", "core.hooksPath", ".husky/_");
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, ".husky/pre-commit"), "utf8")).toBe(
      'npx lint-staged\nnode scripts/specfold.mjs hook pre-commit "$@"\n',
    );
    expect(readFileSync(join(root, ".husky/post-merge"), "utf8")).toBe(
      'node scripts/specfold.mjs hook post-merge "$@"\n',
    );
    expect(hooksPath(root)).toBe(".husky/_");
  });

  it("adds a local repo to the pre-commit configuration, once", async () => {
    const root = repo("types: []\nhooks:\n  extra:\n    commit-msg: [check]\n");
    write(
      root,
      ".pre-commit-config.yaml",
      "repos:\n  - repo: https://github.com/pre-commit/pre-commit-hooks\n    rev: v5.0.0\n    hooks:\n      - id: trailing-whitespace\n",
    );
    const first = await run(["hooks", "install"], root);
    expect(first.stdout).toContain("next: run pre-commit install (or prek install)\n");
    expect((await run(["hooks", "install"], root)).stdout).toBe("hooks install: pre-commit are up to date\n");
    const text = readFileSync(join(root, ".pre-commit-config.yaml"), "utf8");
    expect(text).toContain("id: trailing-whitespace");
    expect(text.match(/repo: local/g)).toHaveLength(1);
    expect(text).toContain(
      "      - id: specfold-commit-msg\n        name: specfold commit-msg\n        entry: node scripts/specfold.mjs hook commit-msg\n        language: system\n        always_run: true\n        pass_filenames: true\n        stages:\n          - commit-msg\n",
    );
    expect(text).toContain(
      "default_install_hook_types: [ pre-commit, pre-push, post-checkout, post-merge, commit-msg ]",
    );
  });
});
