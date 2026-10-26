import { chmodSync, existsSync, mkdirSync, readlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

function repo(skills = ["sf-lookup"]): string {
  const root = tempDir();
  writeFileSync(join(root, "specfold.yaml"), "types: [Decision]\n");
  for (const name of skills) mkdirSync(join(root, ".agents/skills", name), { recursive: true });
  return root;
}

describe("agents sync: command", () => {
  // spec: specfold-agents-sync#links-created
  it("creates the missing links and exits with 0", async () => {
    const root = repo();
    const result = await run(["agents", "sync"], root);
    expect(result).toMatchObject({
      code: 0,
      stdout:
        ".claude/skills/sf-lookup: link -> ../../.agents/skills/sf-lookup\nagents sync: 1 change, 0 kept\n",
    });
    expect(readlinkSync(join(root, ".claude/skills/sf-lookup"))).toBe("../../.agents/skills/sf-lookup");
    expect((await run(["agents", "sync"], root)).stdout).toBe("agents sync: links are up to date, 0 kept\n");
  });

  // spec: specfold-agents-sync#missing-link-detected
  it("reports without writing and exits with 1 in check mode", async () => {
    const root = repo();
    const result = await run(["agents", "sync", "--check"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(".claude/skills/sf-lookup: link");
    expect(existsSync(join(root, ".claude/skills"))).toBe(false);
    await run(["agents", "sync"], root);
    expect((await run(["agents", "sync", "--check"], root)).code).toBe(0);
  });

  it("does not fail check mode for kept entries", async () => {
    const root = repo(["openspec-propose"]);
    mkdirSync(join(root, ".claude/skills/openspec-propose"), { recursive: true });
    const result = await run(["agents", "sync", "--check"], root);
    expect(result).toMatchObject({
      code: 0,
      stdout: ".claude/skills/openspec-propose: kept\nagents sync --check: links are up to date, 1 kept\n",
    });
  });

  // spec: specfold-agents-sync#json-report
  it("prints the actions as JSON", async () => {
    const out = JSON.parse((await run(["agents", "sync", "--json"], repo())).stdout);
    expect(out).toEqual({
      ok: true,
      check: false,
      actions: [
        { path: ".claude/skills/sf-lookup", action: "link", target: "../../.agents/skills/sf-lookup" },
      ],
    });
  });

  // spec: specfold-agents-sync#no-skills-folder
  it("exits with 0 when there are no skills", async () => {
    const root = tempDir();
    writeFileSync(join(root, "specfold.yaml"), "types: [Decision]\n");
    expect(await run(["agents", "sync"], root)).toMatchObject({
      code: 0,
      stdout: "no skills to link: .agents/skills/ does not exist\n",
    });
  });

  it("rejects unknown subcommands and extra arguments", async () => {
    const root = repo();
    for (const argv of [["agents"], ["agents", "link"], ["agents", "sync", "x"]])
      expect((await run(argv, root)).code, argv.join(" ")).toBe(2);
  });

  // spec: specfold-agents-sync#permission-denied
  it.skipIf(process.getuid?.() === 0)(
    "exits with 2 and names the path when a link cannot be created",
    async () => {
      const root = repo();
      mkdirSync(join(root, ".claude/skills"), { recursive: true });
      chmodSync(join(root, ".claude/skills"), 0o555);
      try {
        const result = await run(["agents", "sync"], root);
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("cannot link .claude/skills/sf-lookup");
        expect(result.stderr).toContain("symlinks must be allowed");
      } finally {
        chmodSync(join(root, ".claude/skills"), 0o755);
      }
    },
  );
});
