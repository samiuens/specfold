import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { commitsSinceBase, readCommits } from "../src/tasks/git.ts";
import { tempDir } from "./helpers.ts";

const git = (root: string, ...args: string[]) =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
    cwd: root,
    encoding: "utf8",
  });

/** A repository with one base commit on `main`. */
function repo(): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  writeFileSync(join(root, "README.md"), "x\n");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "base");
  git(root, "checkout", "-q", "-b", "work");
  return root;
}

function commit(root: string, files: string[], message: string): void {
  for (const f of files) {
    mkdirSync(dirname(join(root, f)), { recursive: true });
    writeFileSync(join(root, f), `${message}\n`);
  }
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", message);
}

describe("task commits", () => {
  it("reads the Task trailer and changed files of each commit since the merge base", () => {
    const root = repo();
    commit(
      root,
      ["src/checkout/a.ts"],
      "feat: issuer\n\nTask: add-guest-checkout#2.1\nCo-Authored-By: X <x@example.com>",
    );
    const commits = commitsSinceBase(root, "main");
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({ tasks: ["add-guest-checkout#2.1"], files: ["src/checkout/a.ts"] });
    expect(readCommits(root, "HEAD", false)[1]?.files).toEqual([]);
  });

  it("fails with an environment error on an unknown base", () => {
    expect(() => commitsSinceBase(repo(), "nope")).toThrow(EnvError);
  });
});
