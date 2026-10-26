import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { system } from "../src/verify/login.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const concept = (status = "draft") =>
  `---\ntype: Decision\ntitle: Retries\ndescription: Retry twice.\nstatus: ${status}\ndecision: accepted\ngenerated: { by: claude-code/x, at: 2026-10-26T10:00:00+01:00 }\nsources:\n  - id: plan\n    resource: https://example.com/plan\n---\n\nBody.\n`;

function repo(): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Decision]\n");
  write(root, "knowledge/index.md", "# Knowledge\n");
  write(root, "knowledge/decisions/retries.md", concept());
  write(root, "knowledge/decisions/old.md", concept("deprecated"));
  return root;
}

const read = (root: string, rel: string) => readFileSync(join(root, "knowledge", rel), "utf8");

beforeEach(() => {
  vi.stubEnv("CLAUDECODE", "");
  vi.stubEnv("SPECFOLD_MODEL", "");
  vi.spyOn(system, "isInteractive").mockReturnValue(true);
  vi.spyOn(system, "ghLogin").mockReturnValue("ana");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("verify: command", () => {
  // spec: specfold-verify#concept-verified
  it("verifies a concept as the logged-in human", async () => {
    const root = repo();
    const result = await run(["verify", "decisions/retries.md"], root);
    expect(result).toMatchObject({
      code: 0,
      stdout: "verified knowledge/decisions/retries.md\nverify: 1 concept verified as human:ana\n",
    });
    expect(read(root, "decisions/retries.md")).toMatch(
      /status: stable\n[\s\S]*\ngenerated: .*\nverified: \{ by: human:ana, at: \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d \}\n/,
    );
    expect((await run(["validate"], root)).code).toBe(0);
  });

  it("accepts repository-relative paths and prints JSON", async () => {
    const root = repo();
    const out = JSON.parse((await run(["verify", "knowledge/decisions/retries.md", "--json"], root)).stdout);
    expect(out).toEqual({
      ok: true,
      login: "ana",
      verified: ["knowledge/decisions/retries.md"],
      refused: [],
    });
  });

  // spec: specfold-verify#run-by-claude-code
  it("refuses to run for an agent and writes nothing", async () => {
    const root = repo();
    vi.stubEnv("CLAUDECODE", "1");
    const result = await run(["verify", "decisions/retries.md"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("only humans verify (CLAUDECODE is set)");
    expect(read(root, "decisions/retries.md")).toBe(concept());
    vi.stubEnv("CLAUDECODE", "");
    vi.mocked(system.isInteractive).mockReturnValue(false);
    expect((await run(["verify", "decisions/retries.md"], root)).stderr).toContain("stdin is not a terminal");
  });

  // spec: specfold-verify#one-bad-path
  it("refuses every bad path and writes nothing", async () => {
    const root = repo();
    const result = await run(
      ["verify", "decisions/retries.md", "index.md", "decisions/old.md", "../x.md"],
      root,
    );
    expect(result).toMatchObject({
      code: 1,
      stdout:
        "refused knowledge/index.md: not a concept (index.md and log.md are generated)\n" +
        "refused knowledge/decisions/old.md: deprecated concepts are not verified\n" +
        "refused ../x.md: outside the bundle\n" +
        "verify: 3 paths refused, nothing written\n",
    });
    expect(read(root, "decisions/retries.md")).toBe(concept());
  });

  it("exits with 2 without paths or without a login", async () => {
    const root = repo();
    expect((await run(["verify"], root)).code).toBe(2);
    vi.mocked(system.ghLogin).mockReturnValue(undefined);
    const result = await run(["verify", "decisions/retries.md"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no GitHub login found");
  });
});
