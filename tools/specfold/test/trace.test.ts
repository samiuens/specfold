import { describe, expect, it } from "vitest";
import { requireConfig } from "../src/repo.ts";
import { scanTestReferences } from "../src/trace/refs.ts";
import { parseSpecs } from "../src/trace/specs.ts";
import { buildTraceIndex, traceReport } from "../src/trace/trace.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

// built from parts, so the kit's own trace never reads fixture text as a reference
const ref = (id: string) => `${"spec"}: ${id}`;

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

describe("traceReport", () => {
  // spec: specfold-trace#removed-in-a-change
  it("treats references to scenarios of removed requirements as dangling", () => {
    const root = repo({
      "openspec/specs/cart/spec.md": `## Requirements\n\n${spec("Coupons", "Coupon applied")}${spec("Totals", "Total shown")}`,
      "openspec/changes/drop-coupons/specs/cart/spec.md":
        "## REMOVED Requirements\n\n### Requirement: Coupons\n**Reason**: unused\n**Migration**: none\n",
      "test/cart.test.ts": `// ${ref("cart#coupon-applied")}\n// ${ref("cart#total-shown")}\n`,
    });
    const report = traceReport(buildTraceIndex(requireConfig(root)));
    expect(report.scenarios.map((s) => s.id)).toEqual(["cart#total-shown"]);
    expect(report.dangling).toEqual([{ id: "cart#coupon-applied", file: "test/cart.test.ts", line: 1 }]);
  });

  it("lists a modified scenario once and adds new ones from active changes", () => {
    const root = repo({
      "openspec/specs/cart/spec.md": `## Requirements\n\n${spec("Totals", "Total shown")}`,
      "openspec/changes/c/specs/cart/spec.md": `## MODIFIED Requirements\n\n${spec("Totals", "Total shown", "Total rounded")}`,
    });
    const report = traceReport(buildTraceIndex(requireConfig(root)));
    expect(report.scenarios.map((s) => [s.id, s.spec])).toEqual([
      ["cart#total-shown", "openspec/specs/cart/spec.md"],
      ["cart#total-rounded", "openspec/changes/c/specs/cart/spec.md"],
    ]);
  });
});

describe("scanTestReferences", () => {
  // spec: specfold-trace#reference-in-a-test-name
  it("finds references anywhere in a test file line", () => {
    const root = repo({ "tests/checkout_test.py": `def test_guest():  # ${ref("checkout#guest-pays")}\n` });
    expect(scanTestReferences(root, requireConfig(root).traceTestGlobs)).toEqual([
      { id: "checkout#guest-pays", file: "tests/checkout_test.py", line: 1 },
    ]);
  });

  // spec: specfold-trace#reference-outside-test-files
  it("ignores references outside the test globs and in knowledge or openspec", () => {
    const root = repo({
      "openspec/specs/checkout/spec.md": `## Requirements\n\n${spec("Guest", "Guest pays")}`,
      "src/checkout.ts": `// ${ref("checkout#guest-pays")}\n`,
      "knowledge/test/notes.md": `${ref("checkout#guest-pays")}\n`,
      "openspec/tests/x.md": `${ref("checkout#guest-pays")}\n`,
    });
    const report = traceReport(buildTraceIndex(requireConfig(root)));
    expect(report.scenarios).toEqual([
      { id: "checkout#guest-pays", spec: "openspec/specs/checkout/spec.md", line: 6, refs: [] },
    ]);
  });

  it("does not read keys such as openspec: or spec paths as references", () => {
    const root = repo({
      "test/a.test.ts": `const c = { open${"spec"}: "#x" };\nconst s = "${ref("openspec/specs/cart/spec.md")}";\n`,
    });
    expect(scanTestReferences(root, requireConfig(root).traceTestGlobs)).toEqual([]);
  });
});
