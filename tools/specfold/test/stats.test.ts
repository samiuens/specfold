import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { requireConfig } from "../src/repo.ts";
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
