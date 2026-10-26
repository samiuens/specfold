import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { walkFiles } from "../src/glob.ts";
import { run, tempDir } from "./helpers.ts";

const ID = "2026-10-26-add-guest-checkout";
const DELTA = `openspec/changes/archive/${ID}/knowledge.md`;

const snapshot = (repo: string) =>
  Object.fromEntries(walkFiles(repo).map((f) => [f, readFileSync(join(repo, f), "utf8")]));

describe("sync: command", () => {
  let model: string | undefined;
  beforeEach(() => {
    model = process.env.SPECFOLD_MODEL;
    delete process.env.SPECFOLD_MODEL;
  });
  afterEach(() => {
    if (model === undefined) delete process.env.SPECFOLD_MODEL;
    else process.env.SPECFOLD_MODEL = model;
  });

  // spec: specfold-sync#name-resolves-to-the-archived-change
  it("resolves a change name to its archived folder and applies the delta", async () => {
    const repo = tempDir("sync");
    const result = await run(["sync", "add-guest-checkout"], repo);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("knowledge/capabilities/guest-checkout.md: create stub\n");
    expect(result.stdout).toContain("knowledge/decisions/old-checkout.md: set status: deprecated\n");
    expect(result.stdout).toContain("knowledge/log.md: add log entry\n");
    expect(result.stdout).toMatch(/synced 2026-10-26-add-guest-checkout: \d+ changes\n$/);
    expect(readFileSync(join(repo, "knowledge/capabilities/guest-checkout.md"), "utf8")).toContain(
      `change: ${ID}`,
    );
    expect(readFileSync(join(repo, "knowledge/decisions/guest-orders.md"), "utf8")).toContain(
      `change: ${ID}`,
    );
    expect(readFileSync(join(repo, "knowledge/capabilities/index.md"), "utf8")).toContain("Guest checkout");
  });

  it("accepts the archived id and picks the newest folder for a name", async () => {
    const repo = tempDir("sync");
    expect((await run(["sync", ID, "--dry-run"], repo)).code).toBe(0);
    const newer = "2026-11-02-add-guest-checkout";
    mkdirSync(join(repo, "openspec/changes/archive", newer), { recursive: true });
    writeFileSync(
      join(repo, "openspec/changes/archive", newer, "knowledge.md"),
      "## Delta\n\n```yaml\nops: []\nempty_reason: Docs only.\n```\n",
    );
    const out = JSON.parse((await run(["sync", "add-guest-checkout", "--json"], repo)).stdout);
    expect(out.change).toBe(newer);
  });

  // spec: specfold-sync#not-archived-yet
  it("exits with 2 for a change that is not archived yet", async () => {
    const result = await run(["sync", "still-active"], tempDir("sync"));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(
      "change 'still-active' is not archived yet: run 'openspec archive still-active' first",
    );
    expect((await run(["sync", "missing"], tempDir("sync"))).code).toBe(2);
    expect((await run(["sync"], tempDir("sync"))).code).toBe(2);
  });

  // spec: specfold-sync#broken-delta-writes-nothing
  it("writes nothing when the delta breaks a knowledge rule", async () => {
    const repo = tempDir("sync");
    const path = join(repo, DELTA);
    writeFileSync(path, readFileSync(path, "utf8").replace("op: deprecate", "op: rename"));
    const before = snapshot(repo);
    const result = await run(["sync", "add-guest-checkout"], repo);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(`${DELTA}:13 K2 op 'rename' is not create, update or deprecate`);
    expect(snapshot(repo)).toEqual(before);
  });

  it("uses process:specfold-sync as the stub actor without SPECFOLD_MODEL", async () => {
    const repo = tempDir("sync");
    await run(["sync", "add-guest-checkout"], repo);
    expect(readFileSync(join(repo, "knowledge/decisions/guest-orders.md"), "utf8")).toContain(
      'by: "process:specfold-sync"',
    );
  });

  // spec: specfold-sync#log-entry-once
  it("adds the log entry once", async () => {
    const repo = tempDir("sync");
    await run(["sync", "add-guest-checkout"], repo);
    await run(["sync", "add-guest-checkout"], repo);
    const log = readFileSync(join(repo, "knowledge/log.md"), "utf8");
    expect(log.match(new RegExp(ID, "g"))).toHaveLength(1);
    expect(log).toContain(`* **Change**: ${ID}: created 2, updated 0, deprecated 1`);
  });

  // spec: specfold-sync#second-run
  it("changes nothing on a second run", async () => {
    const repo = tempDir("sync");
    await run(["sync", "add-guest-checkout"], repo);
    const before = snapshot(repo);
    const result = await run(["sync", "add-guest-checkout"], repo);
    expect(result).toMatchObject({ code: 0, stdout: `synced ${ID}: nothing to change\n` });
    expect(snapshot(repo)).toEqual(before);
  });

  // spec: specfold-sync#dry-run-writes-nothing
  it("reports planned actions and writes nothing with --dry-run", async () => {
    const repo = tempDir("sync");
    const before = snapshot(repo);
    const out = JSON.parse((await run(["sync", "add-guest-checkout", "--dry-run", "--json"], repo)).stdout);
    expect(out).toMatchObject({ ok: true, change: ID, dryRun: true, findings: [] });
    expect(out.actions).toContainEqual({
      path: "knowledge/capabilities/guest-checkout.md",
      action: "create stub",
    });
    expect(out.actions).toContainEqual({ path: "knowledge/log.md", action: "add log entry" });
    expect(snapshot(repo)).toEqual(before);
  });
});
