import { existsSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { requireConfig } from "../src/repo.ts";
import { STATE_FILE, upgradeReminder } from "../src/upgrade/reminder.ts";
import { openSource, type ReleaseSource } from "../src/upgrade/source.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const servers: Server[] = [];
afterEach(async () => {
  const open = servers.splice(0);
  for (const s of open) s.closeAllConnections();
  await Promise.all(open.map((s) => new Promise((resolve) => s.close(resolve))));
});

/** A server that accepts requests and never answers. */
async function silentServer(): Promise<string> {
  const server = createServer(() => {});
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
}

describe("release source time limit", () => {
  it("fails with an environment error when the source does not answer in time", async () => {
    const url = await silentServer();
    const started = Date.now();
    await expect(openSource({ url }, "/", { timeoutMs: 200 }).versions()).rejects.toThrow(EnvError);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

/** A Specfold root at `kit_version` on channel next, with `extra` settings and an empty bundle. */
function repo(extra = "source:\n  path: mirror\n") {
  const root = tempDir();
  write(root, "specfold.yaml", `kit_version: 0.1.0-rc.2\nchannel: next\ntypes: []\n${extra}`);
  write(root, "knowledge/index.md", "# Knowledge\n");
  return root;
}

/** A source that fails the test when it is asked. */
const untouchable: ReleaseSource = {
  label: "untouchable",
  versions: async () => {
    throw new Error("the source was queried");
  },
  notes: async () => "",
  download: async () => "",
  tag: () => undefined,
};

const NOW = new Date(2026, 9, 28, 9, 0);

describe("upgrade reminder", () => {
  // spec: specfold-hooks#release-waiting
  it("names the newer release from today's cached check without asking the source", async () => {
    const root = repo();
    write(
      root,
      STATE_FILE,
      JSON.stringify({ upgrade_check: { date: "2026-10-28", versions: ["0.1.0-rc.2", "0.1.0-rc.3"] } }),
    );
    const line = await upgradeReminder(requireConfig(root), { now: NOW, source: untouchable });
    expect(line).toBe(
      "Specfold 0.1.0-rc.3 is available (installed 0.1.0-rc.2): run node scripts/specfold.mjs upgrade (skill sf-upgrade)",
    );
  });

  it("asks the source once a day and caches the answer", async () => {
    const root = repo();
    write(
      root,
      STATE_FILE,
      JSON.stringify({ upgrade_check: { date: "2026-10-27", versions: [] }, other: 1 }),
    );
    let asked = 0;
    const source = {
      ...untouchable,
      versions: async () => {
        asked++;
        return ["0.1.0-rc.2"];
      },
    };
    expect(await upgradeReminder(requireConfig(root), { now: NOW, source })).toBeUndefined();
    expect(await upgradeReminder(requireConfig(root), { now: NOW, source })).toBeUndefined();
    expect(asked).toBe(1);
    expect(JSON.parse(readFileSync(join(root, STATE_FILE), "utf8"))).toEqual({
      upgrade_check: { date: "2026-10-28", versions: ["0.1.0-rc.2"] },
      other: 1,
    });
  });

  // spec: specfold-hooks#offline
  it("prints nothing when the source does not answer within the limit, and the hook exits with 0", async () => {
    const url = await silentServer();
    const root = repo(`source:\n  url: ${url}\n`);
    expect(await upgradeReminder(requireConfig(root), { now: NOW, timeoutMs: 200 })).toBeUndefined();
    expect(JSON.parse(readFileSync(join(root, STATE_FILE), "utf8")).upgrade_check.versions).toBeNull();
    const fresh = repo(`source:\n  url: ${url}\n`);
    const result = await run(["hook", "claude-session-start"], fresh);
    expect(result.code).toBe(0);
    expect(result.stdout).not.toContain("is available");
  });

  // spec: specfold-hooks#turned-off
  it("checks nothing when the reminder is turned off", async () => {
    const root = repo("source:\n  path: mirror\nupgrade:\n  reminder: false\n");
    expect(await upgradeReminder(requireConfig(root), { now: NOW, source: untouchable })).toBeUndefined();
    expect(existsSync(join(root, STATE_FILE))).toBe(false);
  });
});
