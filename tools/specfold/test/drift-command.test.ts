import { describe, expect, it } from "vitest";
import { commitAt, dependent } from "./drift-helpers.ts";
import { git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const REF = "// see knowledge: /decisions/retries.md\n";

/** A repository whose concept was written on 2026-10-01 together with the code that references it. */
function repo(): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  write(root, "specfold.yaml", "types: [Decision]\nsource_globs: ['src/**']\n");
  commitAt(root, "2026-10-01T00:00:00Z", {
    "src/retry.ts": REF,
    "knowledge/decisions/retries.md": dependent("generated: { by: x/y, at: 2026-10-01T00:00:00Z }"),
  });
  return root;
}

describe("specfold drift", () => {
  // spec: specfold-drift#nothing-drifted
  it("exits 0 when no dependent file changed after the baseline", async () => {
    expect(await run(["drift"], repo())).toEqual({
      code: 0,
      stdout: "drift: 0 concepts possibly stale of 1 checked\n",
      stderr: "",
    });
  });

  it("lists the triggering commits per concept", async () => {
    const root = repo();
    commitAt(root, "2026-10-10T00:00:00Z", { "src/retry.ts": `${REF}x\n` }, "retry faster");
    const result = await run(["drift", "decisions/retries.md"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toMatch(
      /^knowledge\/decisions\/retries\.md \(baseline 2026-10-01T00:00:00\S*\)\n {2}[0-9a-f]+ 2026-10-10 retry faster: src\/retry\.ts\ndrift: 1 concept possibly stale of 1 checked\n$/,
    );
  });

  // spec: specfold-drift#json-report
  it("prints JSON with each concept's baseline and commits", async () => {
    const root = repo();
    commitAt(root, "2026-10-10T00:00:00Z", { "src/retry.ts": `${REF}x\n` }, "retry faster");
    const out = JSON.parse((await run(["drift", "--json"], root)).stdout);
    expect(out).toMatchObject({
      ok: false,
      concepts: [{ path: "knowledge/decisions/retries.md", commits: [{ subject: "retry faster" }] }],
      counts: { checked: 1, drifted: 1 },
    });
  });

  it("rejects a path that is not a concept and needs git history", async () => {
    expect((await run(["drift", "src/retry.ts"], repo())).code).toBe(2);
    const bare = tempDir();
    write(bare, "specfold.yaml", "types: [Decision]\n");
    write(
      bare,
      "knowledge/decisions/retries.md",
      dependent("generated: { by: x/y, at: 2026-10-01T00:00:00Z }"),
    );
    const result = await run(["drift"], bare);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("git repository");
  });
});
