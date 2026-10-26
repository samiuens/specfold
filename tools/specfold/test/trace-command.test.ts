import { describe, expect, it } from "vitest";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

// built from parts, so the kit's own trace never reads fixture text as a reference
const ref = (id: string) => `${"spec"}: ${id}`;

const scenario = (title: string) => `#### Scenario: ${title}\n- **WHEN** x\n- **THEN** y\n`;

function repo(files: Record<string, string>): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: []\n");
  write(
    root,
    "openspec/specs/cart/spec.md",
    `## Requirements\n\n### Requirement: Totals\nIt SHALL add.\n\n${scenario("Total shown")}`,
  );
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return root;
}

describe("specfold trace", () => {
  // spec: specfold-trace#fully-covered
  it("exits 0 when every scenario is covered and nothing dangles", async () => {
    const result = await run(["trace"], repo({ "test/cart.test.ts": `// ${ref("cart#total-shown")}\n` }));
    expect(result).toEqual({
      code: 0,
      stdout: "trace: 1 scenario, 1 covered, 0 uncovered, 0 dangling\n",
      stderr: "",
    });
  });

  it("lists uncovered scenarios and dangling references", async () => {
    const result = await run(["trace"], repo({ "test/cart.test.ts": `\n// ${ref("cart#gone")}\n` }));
    expect(result.code).toBe(1);
    expect(result.stdout).toBe(
      "uncovered cart#total-shown (openspec/specs/cart/spec.md:6)\ndangling test/cart.test.ts:2 cart#gone\ntrace: 1 scenario, 0 covered, 1 uncovered, 1 dangling\n",
    );
  });

  // spec: specfold-trace#unknown-change
  it("exits 2 for an unknown change", async () => {
    const result = await run(["trace", "--change", "nope"], repo({}));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("nope");
  });

  it("limits the scope to a change's added and modified scenarios", async () => {
    const root = repo({
      "openspec/changes/add-coupons/specs/cart/spec.md": `## ADDED Requirements\n\n### Requirement: Coupons\nIt SHALL discount.\n\n${scenario("Coupon applied")}`,
      "test/cart.test.ts": `// ${ref("cart#coupon-applied")}\n`,
    });
    const result = await run(["trace", "--change", "add-coupons"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("trace: 1 scenario, 1 covered, 0 uncovered, 0 dangling\n");
    expect((await run(["trace"], root)).code).toBe(1);
  });

  // spec: specfold-trace#json-report
  it("prints JSON with the scenarios and their references", async () => {
    const out = JSON.parse((await run(["trace", "--json"], repo({}))).stdout);
    expect(out).toEqual({
      ok: false,
      scenarios: [{ id: "cart#total-shown", spec: "openspec/specs/cart/spec.md", line: 6, refs: [] }],
      dangling: [],
      counts: { scenarios: 1, covered: 0, uncovered: 1, dangling: 0 },
    });
  });
});
