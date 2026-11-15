import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { agentBy } from "../src/actor.ts";
import { run, tempDir } from "./helpers.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** A repository whose agents sign as Claude Code by default. */
function repo(): string {
  const root = tempDir();
  mkdirSync(join(root, "knowledge"));
  writeFileSync(join(root, "specfold.yaml"), "types: [Decision]\nactors:\n  agent_prefix: claude-code/\n");
  return root;
}

async function generatedBy(root: string): Promise<unknown> {
  const result = await run(["new", "Decision", "decisions/x.md"], root);
  expect(result.code, result.stderr).toBe(0);
  const text = readFileSync(join(root, "knowledge/decisions/x.md"), "utf8");
  const data = parse(text.split("---\n")[1] ?? "") as { generated?: { by?: unknown } };
  return data.generated?.by;
}

describe("actor", () => {
  // spec: specfold-tools#new-concept-from-omp
  it("new concept from omp: signs as omp/<model>", async () => {
    vi.stubEnv("OMPCODE", "1");
    vi.stubEnv("PI_SESSION_ID", "");
    vi.stubEnv("CLAUDECODE", "1");
    vi.stubEnv("SPECFOLD_MODEL", "claude-opus-5-5");
    expect(await generatedBy(repo())).toBe("omp/claude-opus-5-5");
  });

  // spec: specfold-tools#new-concept-from-claude-code
  it("new concept from Claude Code: signs with actors.agent_prefix", async () => {
    vi.stubEnv("OMPCODE", "");
    vi.stubEnv("PI_SESSION_ID", "");
    vi.stubEnv("CLAUDECODE", "1");
    vi.stubEnv("SPECFOLD_MODEL", "claude-opus-5-5");
    expect(await generatedBy(repo())).toBe("claude-code/claude-opus-5-5");
  });

  it("treats PI_SESSION_ID alone as omp and empty variables as unset", () => {
    const config = { agentPrefix: "claude-code/" };
    expect(agentBy(config, "m", { PI_SESSION_ID: "abc" })).toBe("omp/m");
    expect(agentBy(config, "m", { OMPCODE: "", PI_SESSION_ID: "" })).toBe("claude-code/m");
    expect(agentBy({ agentPrefix: "" }, "m", {})).toBe("m");
  });
});
