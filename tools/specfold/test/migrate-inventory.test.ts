import { describe, expect, it } from "vitest";
import { detect } from "../src/migrate/detect.ts";
import { classify, estimateTokens, inventory } from "../src/migrate/inventory.ts";
import { currentBranch, defaultBranch, dirtyPaths, gitRoot } from "../src/migrate/repo.ts";
import { markStep, nextStep, readState, writeState } from "../src/migrate/state.ts";
import { git, write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";
import { fixtureRepo } from "./migrate-helpers.ts";

describe("migration repository", () => {
  it("finds the default branch from origin/HEAD, then main or master, then the flag", () => {
    const root = fixtureRepo();
    expect(defaultBranch(root, undefined)).toBe("main");
    expect(defaultBranch(root, "trunk")).toBe("trunk");
    git(root, "branch", "master");
    expect(() => defaultBranch(root, undefined)).toThrow("both main and master exist");
    git(root, "update-ref", "refs/remotes/origin/develop", "HEAD");
    git(root, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/develop");
    expect(defaultBranch(root, undefined)).toBe("develop");
  });

  it("reports the git root, the branch and changed paths without the state file", () => {
    const root = fixtureRepo();
    expect(gitRoot(root)).toContain("specfold-");
    expect(currentBranch(root)).toBe("main");
    write(root, ".specfold/migration/state.json", "{}");
    expect(dirtyPaths(root)).toEqual([]);
    write(root, "notes.md", "x");
    expect(dirtyPaths(root)).toEqual(["notes.md"]);
    expect(() => gitRoot(tempDir())).toThrow("needs a git repository");
  });

  it("keeps the migration state and the first time of each step", () => {
    const root = fixtureRepo();
    const empty = readState(root);
    expect(nextStep(empty)).toBe("start");
    const first = markStep(empty, "start", new Date("2026-10-27T10:00:00Z"));
    const again = markStep(first, "start", new Date("2026-10-28T10:00:00Z"));
    writeState(root, { ...again, default_branch: "main" });
    const read = readState(root);
    expect(read.steps.start).toBe("2026-10-27T10:00:00.000Z");
    expect(read.default_branch).toBe("main");
    expect(nextStep(read)).toBe("inventory");
  });
});

describe("migration inventory", () => {
  // spec: specfold-migrate#adrs-and-cursor-rules
  it("classifies ADRs, Cursor rules and the other knowledge sources with token estimates", () => {
    expect(classify("docs/adr/0001-use-postgres.md")).toBe("adr");
    expect(classify(".cursor/rules/style.mdc")).toBe("agent-rules");
    expect(classify("openspec/specs/login/spec.md")).toBe("spec-tool");
    expect(classify("docs/wiki/Home.md")).toBe("wiki");
    expect(classify("packages/a/README.md")).toBe("readme");
    expect(classify("CONTRIBUTING.md")).toBe("contributing");
    expect(classify("docs/setup.rst")).toBe("docs");
    expect(classify("src/index.js")).toBeUndefined();
    expect(estimateTokens("12345")).toBe(2);

    const sources = inventory(fixtureRepo("adr-docs"));
    expect(sources.map((s) => [s.path, s.kind])).toEqual([
      ["CONTRIBUTING.md", "contributing"],
      ["README.md", "readme"],
      ["docs/adr/0001-use-postgres.md", "adr"],
      ["docs/adr/0002-session-tokens.md", "adr"],
      ["docs/adr/0003-session-cookies.md", "adr"],
      ["docs/architecture.md", "docs"],
      ["docs/setup.md", "docs"],
    ]);
    expect(sources.every((s) => s.tokens > 0)).toBe(true);
    const cursor = inventory(fixtureRepo("cursor-openspec"));
    expect(cursor.find((s) => s.path === ".cursor/rules/style.mdc")?.kind).toBe("agent-rules");
    expect(cursor.find((s) => s.path === "AGENTS.md")?.kind).toBe("agent-rules");
  });

  // spec: specfold-migrate#ignored-files
  it("leaves out files git ignores", () => {
    const root = fixtureRepo("adr-docs");
    write(root, ".gitignore", "docs/build/\n");
    write(root, "docs/build/out.md", "generated");
    git(root, "add", "-A");
    expect(inventory(root).map((s) => s.path)).not.toContain("docs/build/out.md");
  });

  it("detects stack, layout, CI and source globs", () => {
    expect(detect(fixtureRepo("cursor-openspec"))).toEqual({
      stack: ["Node.js", "TypeScript"],
      layout: "single package",
      ci: [],
      sourceGlobs: ["src/**"],
      globsFallback: false,
    });
    const root = tempDir();
    write(root, "package.json", '{"workspaces": ["packages/*"]}');
    write(root, "packages/a/src/x.ts", "");
    write(root, "lib/y.rb", "");
    write(root, ".github/workflows/ci.yml", "");
    expect(detect(root)).toMatchObject({
      layout: "monorepo",
      ci: ["GitHub Actions"],
      sourceGlobs: ["packages/*/src/**"],
    });
    expect(detect(tempDir())).toMatchObject({ stack: [], sourceGlobs: ["src/**"], globsFallback: true });
  });
});
