import { describe, expect, it } from "vitest";
import { type Finding, renderHuman, renderJson, sortFindings } from "../src/findings.ts";

const f = (
  path: string,
  line: number | null,
  rule: string,
  severity: Finding["severity"] = "error",
): Finding => ({
  rule,
  severity,
  path,
  line,
  message: `${rule} message`,
  fix: `${rule} fix`,
});

describe("findings", () => {
  it("orders by path, line, then rule", () => {
    const sorted = sortFindings([
      f("b.md", 1, "P2"),
      f("a.md", 3, "P1"),
      f("a.md", null, "P9"),
      f("a.md", 3, "OKF-1"),
    ]);
    expect(sorted.map((x) => `${x.path}:${x.line}:${x.rule}`)).toEqual([
      "a.md:null:P9",
      "a.md:3:OKF-1",
      "a.md:3:P1",
      "b.md:1:P2",
    ]);
  });

  it("prints errors and a summary, warnings only as a count", () => {
    const out = renderHuman(
      [f("a.md", 2, "P2"), f("b.md", null, "P10", "warning"), f("c.md", null, "L1")],
      3,
    );
    expect(out).toBe("a.md:2 P2 P2 message\nc.md L1 L1 message\n3 files checked: 2 errors, 1 warning\n");
  });

  it("renders the JSON shape with ok derived from errors", () => {
    const parsed = JSON.parse(renderJson([f("b.md", null, "P10", "warning")], 1));
    expect(parsed).toEqual({
      ok: true,
      checked: 1,
      errors: 0,
      warnings: 1,
      findings: [
        {
          rule: "P10",
          severity: "warning",
          path: "b.md",
          line: null,
          message: "P10 message",
          fix: "P10 fix",
        },
      ],
    });
  });
});
