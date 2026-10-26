import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { knownScenarioIds, scenarioSlug } from "../src/tasks/scenarios.ts";
import { tempDir } from "./helpers.ts";

const write = (root: string, rel: string, content = "") => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

describe("checkStatic", () => {
  it("knows scenario ids from delta specs and main specs", () => {
    const root = tempDir();
    const changeDir = join(root, "openspec", "changes", "demo");
    write(changeDir, "specs/checkout/guest-checkout/spec.md", "#### Scenario: Guest pays without account\n");
    write(root, "openspec/specs/mail/spec.md", "#### Scenario: Ticking tasks.md is not scope widening\n");
    expect(knownScenarioIds(root, changeDir)).toEqual(
      new Set([
        "checkout/guest-checkout#guest-pays-without-account",
        "mail#ticking-tasks-md-is-not-scope-widening",
      ]),
    );
    expect(scenarioSlug("  Guest: pays (again)! ")).toBe("guest-pays-again");
  });
});
