import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readLimit } from "../src/parallel/limit.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const read = (root: string, p: string) => readFileSync(join(root, p), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("specfold parallel", () => {
  // spec: specfold-parallel#not-a-number
  it("refuses a limit that is not a positive whole number", async () => {
    const root = tempDir("valid");
    for (const arg of ["many", "0", "2.5"]) {
      const result = await run(["parallel", "set", arg], root);
      expect(result.code).toBe(2);
    }
    expect(existsSync(join(root, ".claude/settings.local.json"))).toBe(false);
    expect(existsSync(join(root, ".specfold/local.yaml"))).toBe(false);
  });

  // spec: specfold-parallel#existing-local-settings
  it("writes the limit to both personal files and keeps their other keys", async () => {
    const root = tempDir("valid");
    write(
      root,
      ".claude/settings.local.json",
      `${JSON.stringify({ permissions: { allow: ["Bash(ls)"] } })}\n`,
    );
    write(root, ".specfold/local.yaml", "# mine\nactors:\n  github_login: someone\n");
    const result = await run(["parallel", "set", "2"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(JSON.parse(read(root, ".claude/settings.local.json"))).toEqual({
      permissions: { allow: ["Bash(ls)"] },
      env: { CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS: "2" },
    });
    expect(read(root, ".specfold/local.yaml")).toBe(
      "# mine\nactors:\n  github_login: someone\nparallel:\n  max_subagents: 2\n",
    );
    expect((await run(["parallel", "set", "2"], root)).stdout).toBe("subagent limit: 2, already set\n");
    expect((await run(["parallel", "set", "1"], root)).stdout).toContain("task groups run one after another");
  });

  // spec: specfold-parallel#from-local-settings
  it("shows the limit with its source, the environment first", async () => {
    const root = tempDir("valid");
    vi.stubEnv("CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS", "");
    expect((await run(["parallel", "show"], root)).stdout).toBe(
      "subagent limit: not set, so the tool's default applies (Claude Code: 20)\n",
    );
    write(root, ".specfold/local.yaml", "parallel:\n  max_subagents: 4\n");
    expect(readLimit(root)).toEqual({ value: 4, source: ".specfold/local.yaml" });
    write(
      root,
      ".claude/settings.local.json",
      '{ "env": { "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS": "2" } }\n',
    );
    expect((await run(["parallel", "show"], root)).stdout).toBe(
      "subagent limit: 2 (from .claude/settings.local.json)\n",
    );
    vi.stubEnv("CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS", "6");
    expect(readLimit(root)).toEqual({
      value: 6,
      source: "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS in the environment",
    });
  });
});
