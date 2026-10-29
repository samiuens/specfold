import { chmodSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { desiredRuleset, type Gh, MANUAL_STEPS, RequireError, requireGate } from "../src/gate/require.ts";
import { run, tempDir } from "./helpers.ts";

interface FakeRuleset {
  id: number;
  name: string;
  source_type: string;
  [key: string]: unknown;
}

/** A fake gh for one repository: rulesets in memory, every write recorded. */
function fakeGh(rulesets: FakeRuleset[] = [], o: { loggedIn?: boolean; refuseWrite?: string } = {}) {
  const writes: { method: string; path: string; body: unknown }[] = [];
  let next = 100;
  const ok = (value: unknown) => ({ ok: true, stdout: JSON.stringify(value), stderr: "" });
  const gh: Gh = (args, input) => {
    const cmd = args.join(" ");
    if (cmd === "auth status --hostname github.com")
      return o.loggedIn === false ? { ok: false, stdout: "", stderr: "not logged in" } : ok({});
    if (cmd === "repo view --json nameWithOwner") return ok({ nameWithOwner: "acme/shop" });
    if (cmd === "api repos/acme/shop/rulesets")
      return ok(rulesets.map(({ id, name, source_type }) => ({ id, name, source_type })));
    const one = /^api repos\/acme\/shop\/rulesets\/(\d+)$/.exec(cmd);
    if (one) return ok(rulesets.find((r) => r.id === Number(one[1])));
    const write = /^api --method (POST|PUT) (\S+) --input -$/.exec(cmd);
    if (write) {
      if (o.refuseWrite) return { ok: false, stdout: "", stderr: o.refuseWrite };
      const [, method, path] = write;
      const body = JSON.parse(input ?? "{}");
      writes.push({ method: method as string, path: path as string, body });
      if (method === "POST") rulesets.push({ id: next++, source_type: "Repository", ...body });
      else {
        const id = Number(path?.split("/").pop());
        const i = rulesets.findIndex((r) => r.id === id);
        rulesets[i] = { id, source_type: "Repository", ...body };
      }
      return ok({});
    }
    return { ok: false, stdout: "", stderr: `unexpected gh ${cmd}` };
  };
  return { gh, writes, rulesets };
}

/** Our ruleset as GitHub returns it, with fields Specfold doesn't set. */
const stored = (id: number, overrides: Record<string, unknown> = {}): FakeRuleset => ({
  id,
  source_type: "Repository",
  source: "acme/shop",
  node_id: "RRS_x",
  created_at: "2026-10-29T08:00:00Z",
  ...desiredRuleset(),
  ...overrides,
});

describe("gate require", () => {
  // spec: specfold-gate#created
  it("creates the ruleset when the repository has none", () => {
    const { gh, writes, rulesets } = fakeGh();
    expect(requireGate(gh)).toEqual({ repository: "acme/shop", action: "created", dryRun: false });
    expect(writes).toEqual([{ method: "POST", path: "repos/acme/shop/rulesets", body: desiredRuleset() }]);
    expect(rulesets[0]).toMatchObject({
      name: "specfold-gate",
      enforcement: "active",
      bypass_actors: [],
      conditions: { ref_name: { include: ["~DEFAULT_BRANCH"] } },
    });
  });

  // spec: specfold-gate#dry-run
  it("writes nothing on a dry run", () => {
    const { gh, writes } = fakeGh();
    expect(requireGate(gh, { dryRun: true })).toMatchObject({ action: "created", dryRun: true });
    expect(writes).toEqual([]);
  });

  // spec: specfold-gate#already-in-place
  it("writes nothing when the ruleset already matches", () => {
    const { gh, writes } = fakeGh([stored(7)]);
    expect(requireGate(gh).action).toBe("unchanged");
    expect(writes).toEqual([]);
  });

  // spec: specfold-gate#ruleset-changed-by-hand
  it("puts back a ruleset someone changed", () => {
    const bypass = [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }];
    const { gh, writes } = fakeGh([stored(7, { bypass_actors: bypass })]);
    expect(requireGate(gh).action).toBe("updated");
    expect(writes).toEqual([{ method: "PUT", path: "repos/acme/shop/rulesets/7", body: desiredRuleset() }]);
  });

  // spec: specfold-gate#other-rulesets-kept
  it("leaves other rulesets alone, including one named the same from an organization", () => {
    const team = { id: 3, name: "main: reviews", source_type: "Repository", enforcement: "active" };
    const org = { id: 4, name: "specfold-gate", source_type: "Organization" };
    const { gh, writes, rulesets } = fakeGh([team, org]);
    expect(requireGate(gh).action).toBe("created");
    expect(writes.map((w) => w.method)).toEqual(["POST"]);
    expect(rulesets.slice(0, 2)).toEqual([team, org]);
  });

  // spec: specfold-gate#no-admin-rights
  it("passes GitHub's refusal on", () => {
    const { gh } = fakeGh([], { refuseWrite: "gh: Resource not accessible by integration (HTTP 403)" });
    expect(() => requireGate(gh)).toThrow(RequireError);
    expect(() => requireGate(gh)).toThrow("Resource not accessible by integration (HTTP 403)");
  });

  it("names a missing login", () => {
    const { gh } = fakeGh([], { loggedIn: false });
    expect(() => requireGate(gh)).toThrow("gh is not logged in to github.com");
    expect(MANUAL_STEPS).toContain("requires the status check 'specfold-gate'");
  });
});

describe("gate require: command", () => {
  const path = process.env.PATH;
  afterEach(() => {
    process.env.PATH = path;
  });

  /** Puts a gh on the PATH that fails every call, like one that is not logged in. */
  function loggedOutGh() {
    const bin = tempDir();
    writeFileSync(
      join(bin, "gh"),
      "#!/bin/sh\necho 'You are not logged into any GitHub hosts.' >&2\nexit 1\n",
    );
    chmodSync(join(bin, "gh"), 0o755);
    process.env.PATH = `${bin}:${path}`;
  }

  // spec: specfold-gate#no-admin-rights
  it("exits with 2 and prints the reason and the manual steps", async () => {
    loggedOutGh();
    const result = await run(["gate", "require"], tempDir());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("could not make specfold-gate a required check: gh is not logged in");
    expect(result.stderr).toContain(MANUAL_STEPS);
  });

  it("keeps the option sets of the gate and of require apart", async () => {
    loggedOutGh();
    const cwd = tempDir();
    expect((await run(["gate", "require", "--base", "main"], cwd)).stderr).toContain(
      "--base does not apply to 'gate require'",
    );
    const dry = await run(["gate", "--base", "main", "--dry-run"], cwd);
    expect(dry.code).toBe(2);
    expect(dry.stderr).toContain("--dry-run applies only to 'gate require'");
    expect((await run(["gate"], cwd)).stderr).toContain("missing --base <ref>");
  });
});
