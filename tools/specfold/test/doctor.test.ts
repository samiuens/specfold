import { describe, expect, it } from "vitest";
import type { Check } from "../src/doctor/checks.ts";
import { exitCode, render } from "../src/doctor/command.ts";
import { run, tempDir } from "./helpers.ts";

const c = (id: string, status: Check["status"]): Check => ({
  id,
  status,
  message: `${id} message`,
  fix: status === "ok" ? null : `${id} fix`,
});
const all = (overrides: Record<string, Check["status"]> = {}) =>
  ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((id) => c(id, overrides[id] ?? "ok"));

describe("doctor: command", () => {
  // spec: specfold-doctor#only-warnings
  it("exits with 0 when the only problem is a warning", () => {
    expect(exitCode(all({ D4: "warn" }))).toBe(0);
  });

  // spec: specfold-doctor#a-failure
  it("exits with 1 when a check fails", () => {
    expect(exitCode(all({ D3: "fail" }))).toBe(1);
  });

  it("prints one line per check and indented fixes", () => {
    expect(render(all({ D4: "warn" }), false)).toBe(
      "D1 ok D1 message\nD2 ok D2 message\nD3 ok D3 message\nD4 warn D4 message\n    fix: D4 fix\nD5 ok D5 message\nD6 ok D6 message\nD7 ok D7 message\nD8 ok D8 message\n",
    );
  });

  // spec: specfold-doctor#json-result
  it("prints eight checks and ok true when only D4 warns", () => {
    const parsed = JSON.parse(render(all({ D4: "warn" }), true));
    expect(parsed.ok).toBe(true);
    expect(parsed.checks).toHaveLength(8);
    expect(parsed.checks[0]).toEqual({ id: "D1", status: "ok", message: "D1 message", fix: null });
  });

  it("runs all eight checks against the real environment", async () => {
    const result = await run(["doctor", "--json"], tempDir("valid"));
    const parsed = JSON.parse(result.stdout);
    expect(parsed.checks.map((x: Check) => x.id)).toEqual(["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"]);
    expect(result.code).toBe(parsed.ok ? 0 : 1);
  });
});
