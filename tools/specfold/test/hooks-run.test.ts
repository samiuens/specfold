import { chmodSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commit, concept, demoChange, gateRepo, git, write } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

const stage = (root: string, files: Record<string, string>) => {
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, "add", "-A");
};

/** A repository-local OpenSpec stub that reports every item as valid. */
function passingOpenspec(root: string): void {
  write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
  chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
}

describe("hook: pre-commit and extra commands", () => {
  // spec: specfold-hooks#broken-concept-staged
  it("stops a commit with a broken staged concept", async () => {
    const root = gateRepo();
    stage(root, {
      "knowledge/domain/a.md": concept("Term", "See [b](/domain/b.md).").replace("type: Term\n", ""),
    });
    const result = await run(["hook", "pre-commit"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("knowledge/domain/a.md:1 OKF-2 frontmatter has no non-empty 'type'\n");
    expect(result.stdout).toMatch(/pre-commit: 1 error, commit stopped\n$/);
  });

  it("passes clean staged concepts and ignores unstaged ones", async () => {
    const root = gateRepo();
    stage(root, { "knowledge/domain/a.md": concept("Term", "Edited. See [b](/domain/b.md).") });
    write(root, "knowledge/domain/b.md", "broken, but not staged\n");
    expect(await run(["hook", "pre-commit"], root)).toMatchObject({ code: 0, stdout: "" });
  });

  // spec: specfold-hooks#change-being-planned-staged
  it("checks only the brief of a staged change without tasks.md", async () => {
    const root = gateRepo();
    const files = demoChange();
    delete files["openspec/changes/demo/knowledge.md"];
    delete files["openspec/changes/demo/tasks.md"];
    passingOpenspec(root);
    stage(root, files);
    expect((await run(["hook", "pre-commit"], root)).code).toBe(0);
    stage(root, {
      "openspec/changes/demo/brief.md": (files["openspec/changes/demo/brief.md"] as string).replace(
        "confirmed_by: human:samiuens",
        "confirmed_by:",
      ),
    });
    const result = await run(["hook", "pre-commit"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("openspec/changes/demo/brief.md:");
    expect(result.stdout).toContain(" B2 confirmed_by is empty");
  });

  // spec: specfold-hooks#commit-message-check
  it("runs extra commands with the hook's arguments and fails with them", async () => {
    const root = gateRepo({
      "specfold.yaml": "types: [Term]\nhooks:\n  extra:\n    commit-msg:\n      - grep -q '^feat' \"$1\"\n",
    });
    write(root, "good.txt", "feat: x\n");
    write(root, "bad.txt", "wip\n");
    expect((await run(["hook", "commit-msg", "good.txt"], root)).code).toBe(0);
    const bad = await run(["hook", "commit-msg", "bad.txt"], root);
    expect(bad.code).toBe(1);
    expect(bad.stderr).toContain("hook commit-msg: 'grep -q '^feat' \"$1\"' failed with exit code 1");
  });

  it("exits with 0 for a hook without checks or commands and rejects bad names", async () => {
    const root = gateRepo();
    expect((await run(["hook", "pre-rebase"], root)).code).toBe(0);
    for (const argv of [["hook"], ["hook", "Pre_Commit"]]) expect((await run(argv, root)).code).toBe(2);
  });
});

describe("hook: pre-push and graph refresh", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // spec: specfold-hooks#blocking-finding
  it("stops a push when the local gate blocks", async () => {
    const root = gateRepo();
    passingOpenspec(root);
    git(root, "update-ref", "refs/remotes/origin/main", "main");
    commit(root, { "knowledge/domain/c.md": concept("Term", "See [a](/domain/a.md).") });
    const result = await run(["hook", "pre-push", "origin", "git@example.com:x.git"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("block G2 knowledge/domain/index.md index is outdated\n");
  });

  it("uses origin/HEAD and lets a clean push through", async () => {
    const root = gateRepo();
    passingOpenspec(root);
    git(root, "update-ref", "refs/remotes/origin/trunk", "main");
    git(root, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/trunk");
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    expect(await run(["hook", "pre-push"], root)).toMatchObject({ code: 0, stdout: "" });
  });

  it("warns and passes without a base", async () => {
    const result = await run(["hook", "pre-push"], gateRepo());
    expect(result.code).toBe(0);
    expect(result.stderr).toContain("skipping the gate (CI still runs it)");
  });

  // spec: specfold-hooks#graphify-missing
  it("exits with 0 and no output when graphify is missing", async () => {
    vi.stubEnv("PATH", "/usr/bin:/bin");
    for (const hook of ["post-merge", "post-checkout"])
      expect(await run(["hook", hook, "a", "b", "1"], gateRepo())).toEqual({
        code: 0,
        stdout: "",
        stderr: "",
      });
  });
});
