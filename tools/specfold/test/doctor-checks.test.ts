import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type DoctorEnv, runChecks, satisfies } from "../src/doctor/checks.ts";
import { tempDir } from "./helpers.ts";

/** A fake environment: programs answer from the table, everything else is missing. */
function env(cwd: string, programs: Record<string, string> = {}, nodeVersion = "22.3.0"): DoctorEnv {
  return {
    cwd,
    nodeVersion,
    exec: (cmd, args) => programs[`${cmd} ${args.join(" ")}`],
  };
}

const healthy = {
  "openspec --version": "1.15.0\n",
  "git rev-parse --is-inside-work-tree": "true\n",
  "git config --get core.hooksPath": ".specfold/hooks\n",
};

const check = (checks: ReturnType<typeof runChecks>, id: string) => checks.find((c) => c.id === id);

describe("doctor: checks", () => {
  it("evaluates version ranges", () => {
    expect(satisfies("1.15.0", ">=1.15 <2")).toBe(true);
    expect(satisfies("2.0.1", ">=1.15 <2")).toBe(false);
    expect(satisfies("1.14.9", ">=1.15")).toBe(false);
    expect(satisfies("1.2.3", "1.2.3")).toBe(true);
    expect(satisfies("1.2.3", "~1.2")).toBe(false);
  });

  it("is all ok in a healthy repository", () => {
    expect(runChecks(env(tempDir("valid"), healthy)).map((c) => c.status)).toEqual([
      "ok",
      "ok",
      "ok",
      "ok",
      "ok",
      "ok",
    ]);
  });

  // spec: specfold-doctor#supported-node
  it("D1 accepts Node 22.3 and rejects 20.18", () => {
    expect(check(runChecks(env(tempDir("valid"), healthy, "22.3.0")), "D1")).toMatchObject({
      status: "ok",
      message: "Node 22.3.0",
    });
    expect(check(runChecks(env(tempDir("valid"), healthy, "20.18.1")), "D1")?.status).toBe("fail");
  });

  // spec: specfold-doctor#broken-configuration
  it("D2 fails with the parse error", () => {
    const repo = tempDir("valid");
    writeFileSync(join(repo, "specfold.yaml"), "types: [unclosed\n");
    const d2 = check(runChecks(env(repo, healthy)), "D2");
    expect(d2?.status).toBe("fail");
    expect(d2?.message).toContain("specfold.yaml");
  });

  // spec: specfold-doctor#openspec-missing
  it("D3 fails when openspec is missing", () => {
    const { "openspec --version": _, ...rest } = healthy;
    expect(check(runChecks(env(tempDir("valid"), rest)), "D3")).toMatchObject({
      status: "fail",
      fix: expect.stringContaining("openspec"),
    });
  });

  // spec: specfold-doctor#version-out-of-range
  it("D3 fails when the version is outside requires.openspec", () => {
    const repo = tempDir("valid");
    writeFileSync(join(repo, "specfold.yaml"), 'types: [Term]\nrequires:\n  openspec: ">=1.15 <2"\n');
    const d3 = check(runChecks(env(repo, { ...healthy, "openspec --version": "2.0.1" })), "D3");
    expect(d3?.status).toBe("fail");
    expect(d3?.message).toBe("openspec 2.0.1 does not satisfy >=1.15 <2");
  });

  // spec: specfold-doctor#hooks-not-installed
  it("D4 warns without hooks and accepts a hook manager entry", () => {
    const repo = tempDir("valid");
    const { "git config --get core.hooksPath": _, ...noHooks } = healthy;
    expect(check(runChecks(env(repo, noHooks)), "D4")).toMatchObject({
      status: "warn",
      fix: "specfold hooks install",
    });
    writeFileSync(
      join(repo, "lefthook.yml"),
      "pre-commit:\n  commands:\n    specfold:\n      run: node scripts/specfold.mjs specfold hook pre-commit\n",
    );
    expect(check(runChecks(env(repo, noHooks)), "D4")?.status).toBe("ok");
  });

  it("D4 warns outside a git repository", () => {
    expect(check(runChecks(env(tempDir("valid"), { "openspec --version": "1.15.0" })), "D4")?.message).toBe(
      "not inside a git repository",
    );
  });

  // spec: specfold-doctor#missing-bundle
  it("D5 fails without knowledge/ or its index", () => {
    const repo = tempDir("valid");
    rmSync(join(repo, "knowledge/index.md"));
    expect(check(runChecks(env(repo, healthy)), "D5")?.message).toBe("knowledge/index.md is missing");
    rmSync(join(repo, "knowledge"), { recursive: true });
    expect(check(runChecks(env(repo, healthy)), "D5")?.status).toBe("fail");
    mkdirSync(join(repo, "knowledge"));
  });

  // spec: specfold-doctor#graphify-absent
  it("D6 is ok with or without graphify", () => {
    expect(check(runChecks(env(tempDir("valid"), healthy)), "D6")).toMatchObject({
      status: "ok",
      message: "graphify not installed (optional)",
    });
    expect(
      check(runChecks(env(tempDir("valid"), { ...healthy, "graphify --version": "graphify 0.9.95" })), "D6")
        ?.message,
    ).toBe("graphify 0.9.95");
  });
});
