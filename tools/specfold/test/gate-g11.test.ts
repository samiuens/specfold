import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeDiff } from "../src/gate/diff.ts";
import { type GateContext, g11 } from "../src/gate/rules.ts";
import { requireConfig } from "../src/repo.ts";
import { commit, gateRepo } from "./gate-helpers.ts";

const ctx = (root: string): GateContext => ({
  config: requireConfig(root),
  bundleRoot: join(root, "knowledge"),
  diff: computeDiff(root, "main", false),
  local: false,
  labels: [],
  prBody: undefined,
  openspec: { command: "openspec", source: "PATH" },
  pr: undefined,
  now: new Date(),
});

describe("gate: G11", () => {
  // spec: specfold-gate#agents-md-grows-past-its-budget
  it("warns when a branch grows AGENTS.md past its budget", () => {
    const root = gateRepo({ "AGENTS.md": "# Rules\n" });
    commit(root, { "AGENTS.md": "x".repeat(9200) });
    expect(g11(ctx(root))).toEqual([
      {
        rule: "G11",
        effect: "warn",
        path: "AGENTS.md",
        line: null,
        message: "about 2300 tokens, over the budget of 2000 (stats.budget.agents_md)",
        fix: "shorten it or move details into on-demand files; see specfold stats",
      },
    ]);
  });

  // spec: specfold-gate#set-untouched
  it("stays silent when the branch does not touch the set", () => {
    const root = gateRepo({ "AGENTS.md": "x".repeat(9200) });
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    expect(g11(ctx(root))).toEqual([]);
  });

  it("names the skill file and the whole set when a skill grows", () => {
    const root = gateRepo({
      "specfold.yaml": "types: [Term]\nsource_globs: ['src/**']\nstats:\n  budget:\n    total: 100\n",
    });
    commit(root, {
      ".agents/skills/sf-long/SKILL.md": `---\nname: sf-long\ndescription: ${"y".repeat(400)}\n---\n`,
    });
    expect(g11(ctx(root)).map((f) => [f.path, f.message.split(",")[0]])).toEqual([
      [".agents/skills/sf-long/SKILL.md", expect.stringMatching(/^about \d+ tokens$/)],
      [null, expect.stringMatching(/^always-loaded set: about \d+ tokens$/)],
    ]);
  });
});
