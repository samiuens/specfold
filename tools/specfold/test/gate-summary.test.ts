import { chmodSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { GateFinding } from "../src/gate/rules.ts";
import { renderSummary } from "../src/gate/summary.ts";
import { commit, gateRepo, write } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

const finding = (
  rule: string,
  effect: "block" | "warn",
  path: string | null,
  message: string,
): GateFinding => ({
  rule,
  effect,
  path,
  line: path === null ? null : 3,
  message,
  fix: "fix it",
});

describe("gate: summary", () => {
  // spec: specfold-gate#summary-of-a-blocked-branch
  it("renders the verdict, one row per finding and the warnings per rule", () => {
    const text = renderSummary(
      [
        finding("G4", "block", "src/a|b.ts", "changed without a change"),
        finding("G12", "warn", "knowledge/x.md", "A2 old | draft\nsecond line"),
        finding("G12", "warn", null, "A1 stale"),
      ],
      "blocked by G4 (1 blocking finding, 2 warnings)",
    );
    expect(text).toBe(
      [
        "## specfold gate: blocked by G4 (1 blocking finding, 2 warnings)",
        "",
        "| Rule | Effect | Path | Message | Fix |",
        "| --- | --- | --- | --- | --- |",
        "| G4 | block | `src/a\\|b.ts:3` | changed without a change | fix it |",
        "| G12 | warn | `knowledge/x.md:3` | A2 old \\| draft second line | fix it |",
        "| G12 | warn |  | A1 stale | fix it |",
        "",
        "Warnings: G12 2",
        "",
      ].join("\n"),
    );
  });

  it("leaves the table out when nothing was found", () => {
    expect(renderSummary([], "passed, 0 warnings")).toBe(
      "## specfold gate: passed, 0 warnings\n\nWarnings: none\n",
    );
  });

  it("writes the summary file whether or not the gate blocks", async () => {
    const root = gateRepo();
    write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
    chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const result = await run(["gate", "--base", "main", "--local", "--summary", "summary.md"], root);
    expect(result.code).toBe(0);
    expect(readFileSync(join(root, "summary.md"), "utf8")).toContain("| G4 | warn | `src/app.ts` |");
  });
});
