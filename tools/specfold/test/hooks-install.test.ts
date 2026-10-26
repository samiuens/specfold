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
