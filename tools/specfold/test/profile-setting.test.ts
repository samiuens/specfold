import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profileFiles } from "../src/profile.ts";
import { loadConfig } from "../src/repo.ts";
import { run, tempDir } from "./helpers.ts";

/** The valid fixture with `specfold.yaml` given an extra top-level line. */
function repoWith(line: string): string {
  const repo = tempDir("valid");
  const path = join(repo, "specfold.yaml");
  writeFileSync(path, `${line}\n${readFileSync(path, "utf8")}`);
  return repo;
}

describe("profile setting", () => {
  // spec: specfold-profile#missing-key
  it("counts a missing key as full", () => {
    expect(loadConfig(tempDir("valid")).profile).toBe("full");
  });

  it("reads knowledge", () => {
    expect(loadConfig(repoWith("profile: knowledge")).profile).toBe("knowledge");
  });

  // spec: specfold-profile#unknown-value
  it("rejects an unknown value with exit 2", async () => {
    const result = await run(["validate"], repoWith("profile: lite"));
    expect(result.code).toBe(2);
    for (const word of ["profile", "lite", "full", "knowledge"]) expect(result.stderr).toContain(word);
  });
});

describe("profile file set", () => {
  const paths = [
    "scripts/specfold.mjs",
    "openspec/schemas/specfold/schema.yaml",
    ".agents/skills/sf-lookup/SKILL.md",
    ".agents/skills/sf-plan/SKILL.md",
    ".agents/skills/sf-apply/references/packet-and-split.md",
    ".agents/skills/sf-sync/SKILL.md",
    ".agents/skills/sf-interview/SKILL.md",
    ".claude/agents/scout.md",
    ".claude/agents/planner.md",
    ".github/workflows/specfold-gate.yml",
  ];

  it("keeps every path for full", () => {
    expect(profileFiles(paths, "full")).toEqual(paths);
  });

  it("drops the OpenSpec paths for knowledge", () => {
    expect(profileFiles(paths, "knowledge")).toEqual([
      "scripts/specfold.mjs",
      ".agents/skills/sf-lookup/SKILL.md",
      ".agents/skills/sf-interview/SKILL.md",
      ".claude/agents/scout.md",
      ".github/workflows/specfold-gate.yml",
    ]);
  });
});
