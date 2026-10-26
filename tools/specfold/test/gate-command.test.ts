import { chmodSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commit, demoChange, gateRepo, write, writeIndexes } from "./gate-helpers.ts";
import { fakeGithub, review } from "./github-server.ts";
import { run } from "./helpers.ts";

/** A repository whose local OpenSpec binary reports every item as valid. */
function repo(): string {
  const root = gateRepo();
  write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
  chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
  return root;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gate: command", () => {
  // spec: specfold-gate#clean-branch
  it("exits with 0 for a source change with a valid active change", async () => {
    const root = repo();
    for (const [rel, content] of Object.entries(demoChange())) write(root, rel, content);
    write(root, "src/app.ts", "export const app = 2;\n");
    writeIndexes(root);
    commit(root, {});
    const result = await run(["gate", "--base", "main"], root);
    expect(result.stderr).toBe("");
    expect(result.stdout.split("\n").filter((l) => l.startsWith("block"))).toEqual([]);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/gate: passed, \d+ warnings?\n$/);
  });

  // spec: specfold-gate#unknown-base
  it("exits with 2 for a base that is not a git ref", async () => {
    const result = await run(["gate", "--base", "nope"], repo());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown base 'nope'");
  });

  // spec: specfold-gate#json-verdict
  it("prints the verdict as JSON", async () => {
    const root = repo();
    commit(root, { "knowledge/domain/c.md": "---\ntype: Term\n---\n" });
    const result = await run(["gate", "--base", "main", "--json"], root);
    expect(result.code).toBe(1);
    const out = JSON.parse(result.stdout);
    expect(out).toMatchObject({ ok: false, base: "main" });
    expect(out.findings).toContainEqual(expect.objectContaining({ rule: "G2", effect: "block" }));
    expect(out.counts.rules.G2).toBe(1);
    expect(out.counts.block).toBeGreaterThan(0);
  });

  it("prints blocking findings with their fix, then the blocking rules", async () => {
    const root = repo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    const result = await run(["gate", "--base", "main"], root);
    expect(result).toMatchObject({
      code: 1,
      stdout:
        "block G4 src/app.ts 1 source file changed without an OpenSpec change\n" +
        "    fix: add or update a change under openspec/changes/, or set the 'no-spec' label and a 'No-spec reason:' line in the PR body\n" +
        "gate: blocked by G4 (1 blocking finding, 0 warnings)\n",
    });
  });

  it("reads labels and the PR body file", async () => {
    const root = repo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    write(root, "body.md", "No-spec reason: typo\n");
    const result = await run(
      ["gate", "--base", "main", "--label", "x", "--label", "no-spec", "--pr-body", "body.md"],
      root,
    );
    expect(result).toMatchObject({ code: 0, stdout: "gate: passed, 0 warnings\n" });
  });

  it("checks added claims against the PR read with --pr", async () => {
    const root = repo();
    commit(root, { "openspec/changes/demo/brief.md": "confirmed_by: human:carl\n" });
    const gh = await fakeGithub({
      "/repos/acme/shop/pulls/7": { user: { login: "ana" } },
      "/repos/acme/shop/pulls/7/reviews?per_page=100&page=1": [review("carl", "APPROVED")],
      "/repos/acme/shop/pulls/8": { user: { login: "ana" } },
      "/repos/acme/shop/pulls/8/reviews?per_page=100&page=1": [],
    });
    vi.stubEnv("GITHUB_TOKEN", "t0k");
    vi.stubEnv("GITHUB_REPOSITORY", "acme/shop");
    vi.stubEnv("GITHUB_API_URL", gh.url);
    const approved = await run(["gate", "--base", "main", "--pr", "7", "--json"], root);
    expect(JSON.parse(approved.stdout).findings.filter((f: { rule: string }) => f.rule === "G7")).toEqual([]);
    const stranger = await run(["gate", "--base", "main", "--pr", "8", "--json"], root);
    expect(JSON.parse(stranger.stdout).findings).toContainEqual(
      expect.objectContaining({ rule: "G7", effect: "block", path: "openspec/changes/demo/brief.md" }),
    );
  });

  it("exits with 2 for --pr without a token or with a malformed number", async () => {
    const root = repo();
    vi.stubEnv("GITHUB_TOKEN", "");
    const missing = await run(["gate", "--base", "main", "--pr", "7"], root);
    expect(missing.code).toBe(2);
    expect(missing.stderr).toContain("GITHUB_TOKEN is required for --pr");
    for (const pr of ["0", "x", "-1"])
      expect((await run(["gate", "--base", "main", "--pr", pr], root)).code, pr).toBe(2);
  });

  it("rejects a missing base, a missing body file and extra arguments", async () => {
    const root = repo();
    for (const argv of [
      ["gate"],
      ["gate", "--base", "main", "--pr-body", "none.md"],
      ["gate", "--base", "main", "x"],
    ])
      expect((await run(argv, root)).code, argv.join(" ")).toBe(2);
  });
});
