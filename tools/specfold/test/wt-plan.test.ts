import { describe, expect, it } from "vitest";
import { planBatches } from "../src/wt/plan.ts";
import { commit, gateRepo } from "./gate-helpers.ts";

const tasks = (files: string) =>
  `# Tasks\n\n## 1. Work\n\n\`\`\`yaml\nfiles: [${files}]\ndepends: []\nscenarios: []\nagent: implementer\n\`\`\`\n\n- [ ] 1.1 Do it\n  - Done when: tests pass\n\n## 2. Knowledge\n\n\`\`\`yaml\nfiles: [knowledge/**]\ndepends: [1]\nscenarios: []\nagent: implementer\n\`\`\`\n\n- [ ] 2.1 Write concepts\n  - Done when: validate passes\n`;
const spec = "## ADDED Requirements\n";

describe("wt plan", () => {
  // spec: specfold-wt#two-independent-changes
  it("puts changes with different capabilities and disjoint files into one batch", () => {
    const root = gateRepo();
    commit(root, {
      "openspec/changes/add-export/tasks.md": tasks("src/export/**"),
      "openspec/changes/add-export/specs/export/spec.md": spec,
      "openspec/changes/add-import/tasks.md": tasks("src/import/**"),
      "openspec/changes/add-import/specs/import/spec.md": spec,
    });
    expect(planBatches(root, 3)).toEqual({ conflicts: [], batches: [["add-export", "add-import"]] });
  });

  // spec: specfold-wt#shared-capability
  it("separates changes that share a capability, own the same files or lack tasks", () => {
    const root = gateRepo();
    commit(root, {
      "openspec/changes/add-export/tasks.md": tasks("src/export/**"),
      "openspec/changes/add-export/specs/export/spec.md": spec,
      "openspec/changes/fix-export/tasks.md": tasks("src/fix/**"),
      "openspec/changes/fix-export/specs/export/spec.md": spec,
      "openspec/changes/tidy-app/tasks.md": tasks("src/app.ts"),
      "openspec/changes/tune-app/tasks.md": tasks("src/**"),
      "openspec/changes/zz-draft/brief.md": "## Wish\n",
    });
    const plan = planBatches(root, 3);
    expect(plan.conflicts.map((c) => [c.first, c.second, c.reason.split(" ").slice(0, 3).join(" ")])).toEqual(
      [
        ["add-export", "fix-export", "both change capability"],
        ["add-export", "tune-app", "both own src/**"],
        ["add-export", "zz-draft", "zz-draft has no"],
        ["fix-export", "tune-app", "both own src/**"],
        ["fix-export", "zz-draft", "zz-draft has no"],
        ["tidy-app", "tune-app", "both own src/app.ts"],
        ["tidy-app", "zz-draft", "zz-draft has no"],
        ["tune-app", "zz-draft", "zz-draft has no"],
      ],
    );
    expect(plan.batches).toEqual([["add-export", "tidy-app"], ["fix-export"], ["tune-app"], ["zz-draft"]]);
  });

  it("never makes a batch longer than the limit", () => {
    const root = gateRepo();
    commit(root, {
      "openspec/changes/a/tasks.md": tasks("a/**"),
      "openspec/changes/b/tasks.md": tasks("b/**"),
      "openspec/changes/c/tasks.md": tasks("c/**"),
    });
    expect(planBatches(root, 2).batches).toEqual([["a", "b"], ["c"]]);
  });
});
