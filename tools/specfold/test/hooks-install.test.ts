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

/** Whether every line of `before` is in `after`, in the same order, with only new lines between them. */
const keptInOrder = (before: string, after: string) => {
  const rest = after.split("\n");
  let at = 0;
  for (const line of before.split("\n")) {
    const found = rest.indexOf(line, at);
    if (found === -1) return false;
    at = found + 1;
  }
  return true;
};

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

  // spec: specfold-hooks#long-lefthook-command-kept
  it("keeps a long lefthook command on one line", async () => {
    const root = repo();
    const command = `npx eslint --max-warnings 0 --cache --cache-location .cache/eslint src test scripts ${"w".repeat(16)}`;
    expect(command.length).toBe(100);
    write(root, "lefthook.yml", `pre-commit:\n  commands:\n    lint:\n      run: ${command}\n`);
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, "lefthook.yml"), "utf8")).toContain(`      run: ${command}\n`);
  });

  // spec: specfold-hooks#lefthook-formatting-kept
  it("keeps flow lists, folded scalars, comments and blank lines of lefthook.yml", async () => {
    const root = repo();
    const before = readFileSync(new URL("./fixtures/hooks/lefthook-formatted.yml", import.meta.url), "utf8");
    write(root, "lefthook.yml", before);
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    const after = readFileSync(join(root, "lefthook.yml"), "utf8");
    expect(keptInOrder(before, after)).toBe(true);
    expect(after).toContain('      glob: ["*.ts", "*.tsx"]\n      run: >-\n        npx eslint\n');
    expect(after).toContain("    - name: specfold\n      run: node scripts/specfold.mjs hook pre-push {0}\n");
    expect(after).toContain(
      "    deps:\n      run: npm ci\n    specfold:\n      run: node scripts/specfold.mjs hook post-checkout {0}\n",
    );
    expect(after.match(/hook pre-commit \{0\}/g)).toHaveLength(1);
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, "lefthook.yml"), "utf8")).toBe(after);
  });

  it("writes nothing when a hook is in a form it does not edit", async () => {
    const root = repo();
    const before = "pre-commit: lint\n";
    write(root, "lefthook.yml", before);
    const result = await run(["hooks", "install"], root);
    expect(result.code).toBe(2);
    expect(readFileSync(join(root, "lefthook.yml"), "utf8")).toBe(before);
  });

  // spec: specfold-hooks#lefthook-formatting-kept
  it.each([
    ["a flow-style hook section", "pre-commit: { commands: { lint: { run: x } } }\n", "pre-commit"],
    ["an empty flow commands map", "pre-commit:\n  commands: {}\n", "pre-commit"],
    ["an empty flow jobs list", "pre-commit:\n  jobs: []\n", "pre-commit"],
    ["a bare hook key", "pre-commit:\n", "pre-commit"],
    ["a bare commands key", "pre-commit:\n  commands:\n", "pre-commit"],
  ])("fills %s and keeps the other lines", async (_name, head, _hook) => {
    const root = repo();
    const before = `${head}# keep me\npre-push:\n  commands:\n    lint:\n      run: npm run lint\n`;
    write(root, "lefthook.yml", before);
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    const after = readFileSync(join(root, "lefthook.yml"), "utf8");
    expect(after).toContain("# keep me\npre-push:\n  commands:\n    lint:\n      run: npm run lint\n");
    expect(after.match(/hook pre-commit \{0\}/g)).toHaveLength(1);
    expect(after).toContain("post-merge:\n  commands:\n    specfold:");
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, "lefthook.yml"), "utf8")).toBe(after);
  });

  // spec: specfold-hooks#lefthook-in-use
  it("keeps the lines around an empty hook section with a comment", async () => {
    const root = repo();
    write(root, "lefthook.yml", "# top\npre-commit: # later\npre-push:\n  jobs: []\n");
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    const after = readFileSync(join(root, "lefthook.yml"), "utf8");
    expect(after.startsWith("# top\npre-commit: # later\n  commands:\n    specfold:")).toBe(true);
    expect(after).toContain("name: specfold");
  });

  // spec: specfold-hooks#lefthook-formatting-kept
  it("fills a flow-style repos list in .pre-commit-config.yaml and keeps the other lines", async () => {
    const root = repo();
    const before =
      "# top\nfail_fast: true\nrepos: [ { repo: https://example.com/x, rev: v1, hooks: [ { id: a } ] } ]\nexclude: ^docs/\n";
    write(root, ".pre-commit-config.yaml", before);
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    const after = readFileSync(join(root, ".pre-commit-config.yaml"), "utf8");
    expect(after.startsWith("# top\nfail_fast: true\nrepos: [")).toBe(true);
    expect(after).toContain("id: specfold-pre-commit");
    expect(after).toContain("\nexclude: ^docs/\n");
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, ".pre-commit-config.yaml"), "utf8")).toBe(after);
  });

  // spec: specfold-hooks#lefthook-formatting-kept
  it("fills a bare repos key and a flow-style specfold hooks list", async () => {
    const bare = repo();
    write(bare, ".pre-commit-config.yaml", "repos:\nexclude: x\n");
    expect((await run(["hooks", "install"], bare)).code).toBe(0);
    const text = readFileSync(join(bare, ".pre-commit-config.yaml"), "utf8");
    expect(text.startsWith("repos:\n  - repo: local\n")).toBe(true);
    expect(text).toContain("exclude: x\n");

    const flow = repo();
    write(
      flow,
      ".pre-commit-config.yaml",
      "default_install_hook_types: [pre-commit]\nrepos:\n  - repo: local\n    hooks: [ { id: specfold-pre-commit } ]\n",
    );
    expect((await run(["hooks", "install"], flow)).code).toBe(0);
    const out = readFileSync(join(flow, ".pre-commit-config.yaml"), "utf8");
    expect(out).toContain("id: specfold-post-merge");
    expect(out.match(/specfold-pre-commit/g)).toHaveLength(1);
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

  it("leaves every other line of .pre-commit-config.yaml as it was", async () => {
    const root = repo();
    const fixture = new URL("./fixtures/hooks/pre-commit-formatted.yaml", import.meta.url);
    const before = readFileSync(fixture, "utf8");
    write(root, ".pre-commit-config.yaml", before);
    expect((await run(["hooks", "install"], root)).code).toBe(0);
    const after = readFileSync(join(root, ".pre-commit-config.yaml"), "utf8");
    const rewritten = "default_install_hook_types: [pre-commit, pre-push]";
    expect(
      keptInOrder(
        before
          .split("\n")
          .filter((l) => !l.startsWith(rewritten))
          .join("\n"),
        after,
      ),
    ).toBe(true);
    expect(after).toContain(
      "default_install_hook_types: [ pre-commit, pre-push, post-checkout, post-merge ]   # keep\n",
    );
    expect(after.match(/repo: local/g)).toHaveLength(2);
    expect(after).toContain("      - id: specfold-post-merge\n");
    await run(["hooks", "install"], root);
    expect(readFileSync(join(root, ".pre-commit-config.yaml"), "utf8")).toBe(after);
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
