import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { checkTrailers, commitsSinceBase, readCommits } from "../src/tasks/git.ts";
import { parseTasks } from "../src/tasks/parse.ts";
import { tempDir } from "./helpers.ts";

const TASKS_FILE = "openspec/changes/demo/tasks.md";

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

const TASKS = parseTasks(`## 1. Token

\`\`\`yaml
files: [src/checkout/**]
\`\`\`

- [x] 1.1 Add issuer
  - Done when: test passes
- [x] 1.2 Add expiry
  - Done when: test passes
- [ ] 1.3 Add docs
  - Done when: test passes
`);

const check = (root: string, max = 5) =>
  checkTrailers(TASKS, commitsSinceBase(root, "main"), {
    change: "demo",
    file: TASKS_FILE,
    maxFilesPerTask: max,
  });

describe("task commits", () => {
  // spec: specfold-tasks#trailer-recognized
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

  // spec: specfold-tasks#specfold-root-in-a-subfolder
  it("reads files relative to a Specfold root in a subfolder and ignores files outside it", () => {
    const root = repo();
    commit(root, ["app/src/checkout/a.ts", `app/${TASKS_FILE}`, "README.md"], "a\n\nTask: demo#1.1");
    commit(root, ["app/src/checkout/b.ts"], "b\n\nTask: demo#1.2");
    const app = join(root, "app");
    expect(commitsSinceBase(app, "main")[0]?.files).toEqual([
      "openspec/changes/demo/tasks.md",
      "src/checkout/a.ts",
    ]);
    expect(check(app)).toEqual([]);
  });

  it("fails with an environment error on an unknown base", () => {
    expect(() => commitsSinceBase(repo(), "nope")).toThrow(EnvError);
  });

  it("accepts one in-scope commit per ticked task", () => {
    const root = repo();
    commit(root, ["src/checkout/a.ts", TASKS_FILE], "a\n\nTask: demo#1.1");
    commit(root, ["src/checkout/b.ts"], "b\n\nTask: demo#1.2");
    expect(check(root)).toEqual([]);
  });

  // spec: specfold-tasks#task-touched-too-many-files
  it("T10: warns when a task's commits change more files than the limit", () => {
    const root = repo();
    commit(
      root,
      ["a", "b", "c", "d", "e", "f", "g"].map((f) => `src/checkout/${f}.ts`),
      "a\n\nTask: demo#1.1",
    );
    commit(root, ["src/checkout/b.ts"], "b\n\nTask: demo#1.2");
    expect(check(root)).toEqual([
      expect.objectContaining({
        rule: "T10",
        severity: "warning",
        task: "1.1",
        message: "task 1.1 changed 7 files, more than 5",
      }),
    ]);
    expect(check(root, 7)).toEqual([]);
  });

  // spec: specfold-tasks#ticked-without-commit
  it("T11: warns about a ticked task without a commit", () => {
    const root = repo();
    commit(root, ["src/checkout/a.ts"], "a\n\nTask: demo#1.1");
    expect(check(root)).toEqual([expect.objectContaining({ rule: "T11", task: "1.2", line: 9 })]);
  });

  it("T11: warns about unknown task ids and repeated commits", () => {
    const root = repo();
    commit(root, ["src/checkout/a.ts"], "a\n\nTask: demo#1.1");
    commit(root, ["src/checkout/b.ts"], "b\n\nTask: demo#1.1");
    commit(root, ["src/checkout/c.ts"], "c\n\nTask: demo#1.2");
    commit(root, ["src/checkout/d.ts"], "d\n\nTask: demo#4.1");
    commit(root, ["src/checkout/e.ts"], "e\n\nTask: other-change#9.9");
    const messages = check(root).map((f) => f.message);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatch(/^commit [0-9a-f]{7} names unknown task demo#4\.1$/);
    expect(messages[1]).toMatch(/^task 1\.1 has 2 commits: /);
  });

  // spec: specfold-tasks#scope-widened
  it("T11: warns about a file outside the group's files", () => {
    const root = repo();
    commit(root, ["src/checkout/a.ts", "src/billing/x.ts"], "a\n\nTask: demo#1.1");
    commit(root, ["src/checkout/b.ts"], "b\n\nTask: demo#1.2");
    expect(check(root)).toEqual([
      expect.objectContaining({
        rule: "T11",
        task: "1.1",
        message: "task 1.1 changed src/billing/x.ts, outside group 1's files",
      }),
    ]);
  });

  // spec: specfold-tasks#ticking-tasks-md-is-not-scope-widening
  it("T11: never counts the change's own tasks.md as outside the group", () => {
    const root = repo();
    commit(root, ["src/checkout/a.ts", TASKS_FILE], "a\n\nTask: demo#1.1");
    commit(root, ["src/checkout/b.ts", TASKS_FILE], "b\n\nTask: demo#1.2");
    expect(check(root)).toEqual([]);
  });
});
