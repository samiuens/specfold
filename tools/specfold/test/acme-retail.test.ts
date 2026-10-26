import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

describe("validate: OKF sample acme_retail", () => {
  // spec: specfold-validate#patched-sample-passes-upstream-sample-fails
  it("passes the patched copy and fails the upstream copy with exactly the log frontmatter error", async () => {
    const dir = tempDir("acme-retail");
    const patched = await run(["validate", "--okf-only", "--json", "--bundle", "patched"], dir);
    expect(patched.code).toBe(0);
    expect(JSON.parse(patched.stdout).findings).toEqual([]);

    const upstream = await run(["validate", "--okf-only", "--json", "--bundle", "upstream"], dir);
    expect(upstream.code).toBe(1);
    expect(JSON.parse(upstream.stdout).findings).toEqual([
      {
        rule: "OKF-3",
        severity: "error",
        path: "log.md",
        line: 1,
        message: "log.md has frontmatter",
        fix: "remove the frontmatter; log.md starts with an H1 title",
      },
    ]);
  });
});
