import { chmodSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commit, gateRepo, git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const tasks =
  "# Tasks\n\n## 1. Work\n\n```yaml\nfiles: [src/**]\ndepends: []\nscenarios: []\nagent: implementer\n```\n\n- [ ] 1.1 Do it\n  - Done when: tests pass\n";

/** A fake npm that logs its arguments. */
function stubNpm(): { bin: string; log: string } {
  const bin = tempDir();
  const log = join(bin, "npm.log");
  write(bin, "npm", `#!/bin/sh\necho "$*" >> "${log}"\n`);
  chmodSync(join(bin, "npm"), 0o755);
  return { bin, log };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("specfold wt", () => {
  // spec: specfold-wt#unknown-subcommand
  it("names the four subcommands for an unknown one", async () => {
    const result = await run(["wt", "merge"], gateRepo());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown wt subcommand 'merge': plan, new, setup or clean");
  });

  // spec: specfold-wt#worktree-for-a-change
  it("creates a worktree for an active change with its included files", async () => {
    const root = gateRepo({
      ".gitignore": "node_modules/\n.env\n.specfold/wt-index\n.claude/worktrees/\n",
      ".worktreeinclude": "# copied into new worktrees\n.env\nnode_modules/\n",
      "openspec/changes/add-export/tasks.md": tasks,
    });
    write(root, ".env", "TOKEN=1\n");
    const result = await run(["wt", "new", "add-export"], root);
    expect(result).toMatchObject({ code: 0 });
    const path = join(root, ".claude/worktrees/add-export");
    expect(git(path, "branch", "--show-current").trim()).toBe("add-export");
    expect(readFileSync(join(path, ".env"), "utf8")).toBe("TOKEN=1\n");
    expect(result.stdout).toBe(
      "created .claude/worktrees/add-export on branch add-export\ncopied .env\ninstall: no lockfile found, nothing installed\nindex: 1 (.specfold/wt-index)\n",
    );
    const again = await run(["wt", "new", "add-export"], root);
    expect(again.code).toBe(1);
    expect(again.stderr).toContain(".claude/worktrees/add-export already exists; nothing was created");
    expect((await run(["wt", "new", "add-nothing"], root)).stderr).toContain(
      "'add-nothing' is not an active change",
    );
  });

  // spec: specfold-wt#npm-worktree
  it("installs with npm ci from the shared cache and records the index", async () => {
    const root = gateRepo({
      "package-lock.json": "{}\n",
      ".gitignore": "node_modules/\n.specfold/wt-index\n.claude/\n",
    });
    git(root, "worktree", "add", "-q", "-b", "one", join(root, ".claude/worktrees/one"), "HEAD");
    git(root, "worktree", "add", "-q", "-b", "two", join(root, ".claude/worktrees/two"), "HEAD");
    const { bin, log } = stubNpm();
    vi.stubEnv("PATH", `${bin}:${process.env.PATH}`);
    const second = join(root, ".claude/worktrees/two");
    const result = await run(["wt", "setup"], second);
    expect(result.stdout).toBe("install: npm ci --prefer-offline\nindex: 2 (.specfold/wt-index)\n");
    expect(readFileSync(log, "utf8")).toBe("ci --prefer-offline\n");
    expect(readFileSync(join(second, ".specfold/wt-index"), "utf8")).toBe("2\n");
  });

  // spec: specfold-wt#merged-and-unmerged
  it("removes a clean merged worktree and keeps one with changes", async () => {
    const root = gateRepo({ ".gitignore": "node_modules/\n.claude/\n" });
    const merged = join(root, ".claude/worktrees/merged");
    const busy = join(root, ".claude/worktrees/busy");
    git(root, "worktree", "add", "-q", "-b", "merged", merged, "HEAD");
    git(root, "worktree", "add", "-q", "-b", "busy", busy, "HEAD");
    commit(merged, { "src/export.ts": "export const csv = 1;\n" }, "feat: export");
    // a rebase merge: the same change lands on main as a new commit
    git(root, "checkout", "-q", "main");
    commit(root, { "src/export.ts": "export const csv = 1;\n" }, "feat: export");
    write(busy, "src/wip.ts", "// work in progress\n");
    const result = await run(["wt", "clean"], root);
    expect(result.code).toBe(1);
    expect(result.stdout.trim().split("\n").sort()).toEqual([
      "kept .claude/worktrees/busy: uncommitted changes",
      "removed .claude/worktrees/merged and branch merged",
    ]);
    expect(existsSync(merged)).toBe(false);
    expect(git(root, "branch", "--list", "merged").trim()).toBe("");
    expect(existsSync(busy)).toBe(true);
  });

  it("keeps a worktree whose branch is not merged", async () => {
    const root = gateRepo({ ".gitignore": "node_modules/\n.claude/\n" });
    const ahead = join(root, ".claude/worktrees/ahead");
    git(root, "worktree", "add", "-q", "-b", "ahead", ahead, "HEAD");
    commit(ahead, { "src/new.ts": "export const n = 1;\n" }, "feat: new");
    const result = await run(["wt", "clean"], root);
    expect(result.stdout).toBe("kept .claude/worktrees/ahead: not merged into main\n");
    expect(realpathSync(ahead)).toBeTruthy();
  });

  it("prints the plan with its limit", async () => {
    const root = gateRepo({ "openspec/changes/add-export/tasks.md": tasks });
    vi.stubEnv("CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS", "2");
    const result = await run(["wt", "plan"], root);
    expect(result.stdout).toBe(
      "batch 1: add-export\nwt plan: 1 active change in 1 batch, limit 2 (from CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS in the environment)\n",
    );
  });
});
