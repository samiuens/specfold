import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnvError } from "../src/errors.ts";
import { resolveLogin, system } from "../src/verify/login.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const CONCEPT =
  "---\ntype: Decision\ntitle: Retries\ndescription: Retry twice.\nstatus: draft\ndecision: accepted\ngenerated: { by: claude-code/x, at: 2026-10-26T10:00:00+01:00 }\nsources:\n  - id: plan\n    resource: https://example.com/plan\n---\n\nBody.\n";

/** Runs `specfold verify decisions/retries.md` as a person at a terminal, with `env` on top of a clean environment. */
async function verifyWith(env: Record<string, string>) {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Decision]\n");
  write(root, "knowledge/index.md", "# Knowledge\n");
  write(root, "knowledge/decisions/retries.md", CONCEPT);
  for (const name of ["CLAUDECODE", "OMPCODE", "PI_SESSION_ID", "SPECFOLD_MODEL"])
    vi.stubEnv(name, env[name] ?? "");
  vi.spyOn(system, "isInteractive").mockReturnValue(true);
  vi.spyOn(system, "ghLogin").mockReturnValue("ana");
  const result = await run(["verify", "decisions/retries.md"], root);
  return { result, text: readFileSync(join(root, "knowledge/decisions/retries.md"), "utf8") };
}

describe("verify: agents refused", () => {
  // spec: specfold-verify#run-by-omp
  it("run by omp: PI_SESSION_ID alone refuses and writes nothing", async () => {
    const { result, text } = await verifyWith({ PI_SESSION_ID: "01a1e0ce" });
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("only humans verify (PI_SESSION_ID is set)");
    expect(text).toBe(CONCEPT);
  });

  // spec: specfold-verify#run-by-claude-code
  it("run by Claude Code: CLAUDECODE refuses and writes nothing", async () => {
    const { result, text } = await verifyWith({ CLAUDECODE: "1" });
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("only humans verify (CLAUDECODE is set)");
    expect(text).toBe(CONCEPT);
  });

  it("a person at a terminal is not refused", async () => {
    const { result } = await verifyWith({});
    expect(result.code, result.stderr).toBe(0);
  });
});

describe("verify: login", () => {
  it("prefers the GitHub CLI login", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: other\n");
    vi.spyOn(system, "ghLogin").mockReturnValue("ana");
    expect(resolveLogin(root)).toBe("ana");
  });

  it("falls back to actors.github_login in .specfold/local.yaml", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: ben-x\n");
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(resolveLogin(root)).toBe("ben-x");
  });

  // spec: specfold-verify#no-login-available
  it("names both ways when no login is found", () => {
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(() => resolveLogin(tempDir())).toThrow(EnvError);
    expect(() => resolveLogin(tempDir())).toThrow(
      /gh auth login.*actors\.github_login in \.specfold\/local\.yaml/,
    );
  });

  it("rejects a value that is not a GitHub login", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: 'human:ana'\n");
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(() => resolveLogin(root)).toThrow("'human:ana' is not a GitHub login");
  });
});
