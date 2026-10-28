import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { requireConfig } from "../src/repo.ts";
import {
  alwaysLoaded,
  estimate,
  importsOf,
  knowledgeFolders,
  overBudget,
  type SetItem,
  total,
} from "../src/stats/stats.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const settings = (root: string, text: string) => writeFileSync(join(root, "specfold.yaml"), text);

describe("stats budgets", () => {
  it("defaults to 2000, 4000 and 60 tokens", () => {
    const root = tempDir();
    settings(root, "types: [Decision]\n");
    expect(requireConfig(root).statsBudget).toEqual({ agentsMd: 2000, total: 4000, skillDescription: 60 });
  });

  it("reads stats.budget and rejects a budget that is not a positive integer", () => {
    const root = tempDir();
    settings(root, "stats:\n  budget:\n    agents_md: 1500\n    total: 3000\n");
    expect(requireConfig(root).statsBudget).toEqual({ agentsMd: 1500, total: 3000, skillDescription: 60 });
    settings(root, "stats:\n  budget:\n    total: lots\n");
    expect(() => requireConfig(root)).toThrow("'stats.budget.total' must be a positive integer");
  });
});

const skill = (root: string, name: string, description: string) =>
  write(
    root,
    `.agents/skills/${name}/SKILL.md`,
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`,
  );
const labels = (set: SetItem[]) =>
  set.map((i) => (i.kind === "skill" ? `skill ${i.name}` : i.kind === "hook" ? "hook" : i.path));

describe("stats estimates", () => {
  // spec: specfold-stats#rounding
  it("divides characters by 4 and rounds up", () => {
    expect(estimate("x".repeat(401))).toBe(101);
    expect(estimate("x".repeat(400))).toBe(100);
    expect(estimate("")).toBe(0);
  });

  it("reads @ imports outside code, with a dot or slash in the path", () => {
    const text =
      "@AGENTS.md\nSee @docs/rules.md, not `@ignored.md` or noreply@anthropic.com or @samiuens.\n```\n@fenced.md\n```\n";
    expect(importsOf(text)).toEqual(["AGENTS.md", "docs/rules.md"]);
  });
});

describe("always-loaded set", () => {
  // spec: specfold-stats#import-counted-once
  it("counts a file imported from CLAUDE.md once, and follows imports transitively", () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "# Rules\n\n@docs/agents/extra.md\n");
    write(root, "docs/agents/extra.md", "@../../AGENTS.md\nmore\n");
    write(root, "CLAUDE.md", "@AGENTS.md\n@missing.md\n");
    const set = alwaysLoaded(requireConfig(root));
    expect(labels(set).slice(0, 4)).toEqual(["AGENTS.md", "docs/agents/extra.md", "CLAUDE.md", "missing.md"]);
    expect(set[3]).toEqual({ kind: "file", path: "missing.md", tokens: 0, missing: true });
  });

  // spec: specfold-stats#skills-and-hook
  it("lists each skill's name and description, the context and the SessionStart output", () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "# Rules\n");
    write(root, "openspec/config.yaml", "schema: specfold\ncontext: |\n  Stack: Go\n");
    skill(root, "sf-lookup", "Look things up.");
    skill(root, "openspec-propose", "Propose a change.");
    const set = alwaysLoaded(requireConfig(root));
    expect(labels(set)).toEqual([
      "AGENTS.md",
      "CLAUDE.md",
      "openspec/config.yaml",
      "skill openspec-propose",
      "skill sf-lookup",
      "hook",
    ]);
    expect(set.find((i) => i.kind === "skill" && i.name === "sf-lookup")?.tokens).toBe(
      estimate("sf-lookupLook things up."),
    );
    expect(set.find((i) => i.kind === "context")?.tokens).toBe(estimate("Stack: Go\n"));
    expect(set.find((i) => i.kind === "hook")?.tokens).toBeGreaterThan(10);
  });
});

describe("budgets", () => {
  // spec: specfold-stats#agents-md-too-long
  it("reports AGENTS.md over its default budget", () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "x".repeat(9000));
    const config = requireConfig(root);
    const set = alwaysLoaded(config);
    const over = overBudget(set, config.statsBudget);
    expect(over.map((o) => [o.budget, o.tokens, o.limit])).toEqual([["agents_md", 2250, 2000]]);
  });

  // spec: specfold-stats#openspec-skill-exempt
  it("exempts openspec skills from the per-skill budget but counts them in the total", () => {
    const root = tempDir("valid");
    skill(root, "openspec-propose", "x".repeat(440));
    skill(root, "sf-long", "y".repeat(300));
    const config = requireConfig(root);
    const set = alwaysLoaded(config);
    const over = overBudget(set, { ...config.statsBudget, total: 100 });
    expect(over.map((o) => o.budget)).toEqual(["skill_description", "total"]);
    expect(over[0]?.item).toMatchObject({ name: "sf-long" });
    expect(over[1]?.tokens).toBe(total(set));
  });
});

// spec: specfold-stats#graphify-skill-exempt
it("exempts the graphify skill from the per-skill budget", () => {
  const root = tempDir("valid");
  skill(root, "graphify", "z".repeat(360));
  const config = requireConfig(root);
  const set = alwaysLoaded(config);
  expect(overBudget(set, config.statsBudget)).toEqual([]);
  expect(set.find((i) => i.kind === "skill")?.tokens).toBeGreaterThan(60);
});

describe("knowledge folders", () => {
  // spec: specfold-stats#bundle-folders
  it("sums the bundle per top-level folder, root files first", () => {
    const root = tempDir("valid");
    const folders = knowledgeFolders(join(root, "knowledge"));
    expect(folders.map((f) => f.folder)).toEqual(["(root)", "decisions", "references", "runbooks"]);
    expect(folders.every((f) => f.tokens > 0)).toBe(true);
  });
});
