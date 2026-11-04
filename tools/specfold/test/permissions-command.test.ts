import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

function repo(yaml = "types: [Decision]\n", settings?: string): string {
  const root = tempDir();
  writeFileSync(join(root, "specfold.yaml"), yaml);
  if (settings !== undefined) {
    mkdirSync(join(root, ".claude"), { recursive: true });
    writeFileSync(join(root, ".claude/settings.json"), settings);
  }
  return root;
}

const read = (root: string) => JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));

describe("permissions sync: command", () => {
  // spec: specfold-permissions#rules-written
  it("writes the rules and exits with 0", async () => {
    const root = repo(
      "types: []\npermissions:\n  push: ask\n",
      '{ "permissions": { "deny": ["Read(x)"] } }\n',
    );
    const result = await run(["permissions", "sync"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Bash(git push *): none -> ask");
    expect(read(root).permissions.ask).toContain("Bash(git push *)");
    expect(read(root).permissions.deny).toEqual(["Read(x)"]);
    expect((await run(["permissions", "sync"], root)).stdout).toBe(
      "permissions sync: rules are up to date\n",
    );
  });

  it("creates a missing settings file", async () => {
    const root = repo();
    expect((await run(["permissions", "sync"], root)).code).toBe(0);
    expect(read(root).permissions.ask).toHaveLength(15);
  });

  // spec: specfold-permissions#agents-only
  it("writes nothing when Claude Code is not a target", async () => {
    const root = repo('types: []\nagents:\n  targets: [".opencode/skills"]\n');
    const result = await run(["permissions", "sync"], root);
    expect(result).toMatchObject({
      code: 0,
      stdout: expect.stringContaining("no tool needs rendered rules"),
    });
    expect(existsSync(join(root, ".claude"))).toBe(false);
  });

  it("still validates the setting when Claude Code is not a target", async () => {
    const root = repo('types: []\nagents:\n  targets: [".opencode/skills"]\npermissions:\n  push: maybe\n');
    expect((await run(["permissions", "sync"], root)).code).toBe(1);
  });

  it("writes nothing and exits with 1 for an invalid setting", async () => {
    const settings = '{ "permissions": {} }\n';
    const root = repo("types: []\npermissions:\n  push: ask\n  force-push: allow\n", settings);
    const result = await run(["permissions", "sync"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("force-push:");
    expect(readFileSync(join(root, ".claude/settings.json"), "utf8")).toBe(settings);
  });

  // spec: specfold-permissions#broken-settings-file
  it("exits with 2 and leaves a broken settings file alone", async () => {
    const root = repo(undefined, "{ not json");
    const result = await run(["permissions", "sync"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(".claude/settings.json");
    expect(readFileSync(join(root, ".claude/settings.json"), "utf8")).toBe("{ not json");
  });

  // spec: specfold-permissions#out-of-date
  it("reports a move in check mode without writing", async () => {
    const root = repo("types: []\n");
    await run(["permissions", "sync"], root);
    writeFileSync(join(root, "specfold.yaml"), "types: []\npermissions:\n  push: allow\n");
    const before = readFileSync(join(root, ".claude/settings.json"), "utf8");
    const result = await run(["permissions", "sync", "--check"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("Bash(git push *): ask -> allow");
    expect(readFileSync(join(root, ".claude/settings.json"), "utf8")).toBe(before);
  });

  // spec: specfold-permissions#in-sync
  it("exits with 0 in check mode right after a sync", async () => {
    const root = repo();
    await run(["permissions", "sync"], root);
    expect(await run(["permissions", "sync", "--check"], root)).toMatchObject({
      code: 0,
      stdout: "permissions sync --check: rules are up to date\n",
    });
  });

  // spec: specfold-permissions#json-changes
  it("prints the changes as JSON", async () => {
    const yaml =
      "types: []\npermissions:\n  push: ask\n  force-push: deny\n  delete-remote-branch: deny\n  push-tags: deny\n  open-pr: deny\n  merge-pr: deny\n  close-pr: deny\n";
    const out = JSON.parse((await run(["permissions", "sync", "--json"], repo(yaml, "{}\n"))).stdout);
    expect(out).toMatchObject({ ok: true, check: false, target: ".claude/settings.json", problems: [] });
    expect(out.changes.filter((c: { to: string }) => c.to === "ask")).toEqual([
      { pattern: "Bash(git push *)", from: "none", to: "ask" },
    ]);
  });

  it("rejects unknown subcommands and extra arguments", async () => {
    expect((await run(["permissions"], repo())).code).toBe(2);
    expect((await run(["permissions", "list"], repo())).code).toBe(2);
    expect((await run(["permissions", "sync", "x"], repo())).code).toBe(2);
  });
});
