import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commit, git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

/** The knowledge-profile fixture as a git repository on branch `work`, branched from `main`. */
function knowledgeRepo(): string {
  const root = tempDir("knowledge-profile");
  git(root, "init", "-q", "-b", "main");
  commit(root, {}, "base");
  git(root, "checkout", "-q", "-b", "work");
  return root;
}

beforeEach(() => {
  // OpenSpec is nowhere on the PATH: no command may need it in the knowledge profile
  vi.stubEnv("PATH", "/usr/bin:/bin");
});
afterEach(() => vi.unstubAllEnvs());

describe("knowledge profile: commands without OpenSpec", () => {
  it.each([
    ["validate", ["validate"]],
    ["index", ["index", "--check"]],
    ["lookup", ["lookup", "rotate", "keys"]],
    ["stats", ["stats"]],
    ["doctor", ["doctor", "--json"]],
  ])("%s runs", async (_name, argv) => {
    const result = await run(argv, knowledgeRepo());
    expect(result.stderr).toBe("");
    if (argv[0] === "doctor") {
      const d3 = JSON.parse(result.stdout).checks.find((c: { id: string }) => c.id === "D3");
      expect(d3.status).toBe("ok");
    } else expect(result.code).toBe(0);
  });

  it("runs the pre-commit hook on staged code and knowledge", async () => {
    const root = knowledgeRepo();
    write(root, "src/app.ts", "export const app = 2;\n");
    git(root, "add", "-A");
    const result = await run(["hook", "pre-commit"], root);
    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
  });

  it("runs the session start hook without active changes", async () => {
    const result = await run(["hook", "claude-session-start"], knowledgeRepo());
    expect(result.code).toBe(0);
    expect(result.stdout).not.toMatch(/openspec/i);
  });

  it("runs the local gate: G19 warns for code without knowledge, then passes with a log entry", async () => {
    const root = knowledgeRepo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const without = await run(["gate", "--base", "main", "--local", "--json"], root);
    expect(without.stderr).toBe("");
    const rules = JSON.parse(without.stdout).findings.map((f: { rule: string }) => f.rule);
    expect(rules).toContain("G19");
    expect(rules.some((r: string) => ["G3", "G4", "G5", "G6", "G13", "G15", "G18"].includes(r))).toBe(false);
    const log = await run(["log", "add", "app is 2"], root);
    expect(log.code).toBe(0);
    commit(root, {}, "log");
    const withLog = await run(["gate", "--base", "main", "--local", "--json"], root);
    expect(JSON.parse(withLog.stdout).findings.map((f: { rule: string }) => f.rule)).not.toContain("G19");
  });
});
