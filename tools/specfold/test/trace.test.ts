import { describe, expect, it } from "vitest";
import { parseSpecs } from "../src/trace/specs.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const spec = (requirement: string, ...scenarios: string[]) =>
  `### Requirement: ${requirement}\nThe app SHALL work.\n\n${scenarios
    .map((s) => `#### Scenario: ${s}\n- **WHEN** x\n- **THEN** y\n`)
    .join("\n")}`;

function repo(files: Record<string, string> = {}): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: []\n");
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return root;
}

describe("parseSpecs", () => {
  // spec: specfold-trace#nested-capability
  it("derives ids from the capability path and the scenario title", () => {
    const root = repo({
      "openspec/specs/checkout/guest-checkout/spec.md": `# x\n\n## Requirements\n\n${spec("Guest", "Guest pays without account")}`,
    });
    expect(parseSpecs(root, "openspec/specs", false).scenarios).toEqual([
      {
        id: "checkout/guest-checkout#guest-pays-without-account",
        capability: "checkout/guest-checkout",
        requirement: "Guest",
        section: "main",
        spec: "openspec/specs/checkout/guest-checkout/spec.md",
        line: 8,
      },
    ]);
  });

  it("takes the section of delta scenarios from their heading", () => {
    const root = repo({
      "openspec/changes/c/specs/cart/spec.md": `## ADDED Requirements\n\n${spec("A", "New one")}\n## MODIFIED Requirements\n\n${spec("B", "Changed one")}`,
    });
    const parsed = parseSpecs(root, "openspec/changes/c/specs", true);
    expect(parsed.scenarios.map((s) => [s.id, s.section])).toEqual([
      ["cart#new-one", "ADDED"],
      ["cart#changed-one", "MODIFIED"],
    ]);
  });
});
