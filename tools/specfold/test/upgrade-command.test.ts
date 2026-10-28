import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";
import { installed, packInto, release } from "./upgrade-helpers.ts";

const gitOut = (root: string, ...args: string[]) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const commitAll = (root: string) => {
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-q", "--allow-empty", "-m", "settings"], { cwd: root });
};

beforeEach(() => {
  for (const [k, v] of Object.entries({
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.com",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.com",
  }))
    vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());

/** A repository at rc.1 on `channel` whose specfold.yaml has `settings` appended, committed. */
function repo(settings: string, channel = "stable") {
  const base = release("0.1.0-rc.1");
  const root = installed(base, "0.1.0-rc.1");
  const text = readFileSync(join(root, "specfold.yaml"), "utf8").replace(
    "channel: stable",
    `channel: ${channel}`,
  );
  write(root, "specfold.yaml", `${text}${settings}`);
  commitAll(root);
  return { root, base };
}

/** A mirror folder with `releases.json` listing rc.1 and rc.2 and their notes. */
function mirror() {
  const dir = tempDir();
  const releases = [
    { version: "0.1.0-rc.2", notes: "## Upgrade notes\n\nRun the rc.2 CLI once." },
    { version: "0.1.0-rc.1", notes: "## Upgrade notes\n\nNo manual steps." },
  ];
  write(dir, "releases.json", JSON.stringify({ releases }));
  return dir;
}

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((resolve) => s.close(resolve))));
});

describe("specfold upgrade", () => {
  // spec: specfold-upgrade#pr-without-yes
  it("refuses --pr without --yes", async () => {
    const result = await run(["upgrade", "--pr"], repo("").root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--pr needs --yes");
  });

  // spec: specfold-upgrade#newer-release-on-next
  it("reports a newer release candidate on channel next with its notes", async () => {
    const { root } = repo(`source:\n  path: ${mirror()}\n`, "next");
    const result = await run(["upgrade", "--check"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("installed 0.1.0-rc.1, newest 0.1.0-rc.2 on channel next");
    expect(result.stdout).toContain("Run the rc.2 CLI once.");
    expect(gitOut(root, "status", "--porcelain")).toBe("");
  });

  // spec: specfold-upgrade#stable-ignores-candidates
  it("finds nothing newer on channel stable when only candidates are newer", async () => {
    const result = await run(["upgrade", "--check"], repo(`source:\n  path: ${mirror()}\n`).root);
    expect(result).toMatchObject({
      code: 0,
      stdout: "up to date: 0.1.0-rc.1 is the newest release on channel stable\n",
    });
  });

  // spec: specfold-upgrade#url-mirror
  it("reads the releases of a url mirror", async () => {
    const index = readFileSync(join(mirror(), "releases.json"));
    const server = createServer((req, res) => {
      if (req.url === "/kit/releases.json") res.writeHead(200).end(index);
      else res.writeHead(404).end();
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const { root } = repo(`source:\n  url: http://127.0.0.1:${port}/kit\n`, "next");
    const result = await run(["upgrade", "--check"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("newest 0.1.0-rc.2");
    expect(result.stdout).toContain("Run the rc.2 CLI once.");
  });

  // spec: specfold-upgrade#local-folder
  // spec: specfold-upgrade#handed-to-the-new-version
  it("hands the upgrade to the CLI inside the target tarball from a local folder", async () => {
    const folder = tempDir();
    const stub = `#!/usr/bin/env node
import { writeFileSync } from "node:fs";
writeFileSync("handed.json", JSON.stringify(process.argv.slice(2)));
console.log("planned by 0.1.0-rc.2");
`;
    packInto(folder, release("0.1.0-rc.2", { "scripts/specfold.mjs": stub }), "0.1.0-rc.2");
    const { root, base } = repo(`source:\n  path: ${folder}\n`);
    packInto(folder, base, "0.1.0-rc.1");
    const result = await run(["upgrade", "--to", "0.1.0-rc.2"], root);
    expect(result).toMatchObject({ code: 0, stdout: "planned by 0.1.0-rc.2\n" });
    const argv = JSON.parse(readFileSync(join(root, "handed.json"), "utf8")) as string[];
    expect(argv.slice(0, 2)).toEqual(["upgrade", "--from"]);
    expect(argv).toContain("--base-dir");
    expect(argv.slice(-2)).toEqual(["--to", "0.1.0-rc.2"]);
  });

  it("stops with exit 2 on a version the source does not have", async () => {
    const result = await run(["upgrade", "--to", "9.9.9"], repo(`source:\n  path: ${mirror()}\n`).root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("has no release 9.9.9");
  });

  // spec: specfold-upgrade#dry-run
  it("prints the plan without --yes and changes nothing", async () => {
    const { root, base } = repo("");
    const next = release("0.1.0-rc.2", {
      "AGENTS.md": "# Agent instructions\n\nRead knowledge, then specs.\n",
    });
    const result = await run(["upgrade", "--from", next, "--base-dir", base], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("# Specfold upgrade: 0.1.0-rc.1 to 0.1.0-rc.2");
    expect(result.stdout).toContain("| `AGENTS.md` | replace |");
    expect(gitOut(root, "status", "--porcelain")).toBe("");
  });

  // spec: specfold-upgrade#applied-upgrade
  it("applies the upgrade as one commit on its own branch with the manifest and the report", async () => {
    const { root, base } = repo("");
    const next = release("0.1.0-rc.2", { ".agents/skills/sf-upgrade/SKILL.md": "# sf-upgrade\n" });
    const result = await run(
      ["upgrade", "--from", next, "--base-dir", base, "--yes", "--ref", "v0.1.0-rc.2"],
      root,
    );
    expect(result.code).toBe(0);
    expect(gitOut(root, "branch", "--show-current")).toBe("specfold/upgrade-0.1.0-rc.2");
    expect(gitOut(root, "rev-list", "--count", "main..HEAD")).toBe("1");
    expect(gitOut(root, "log", "-1", "--format=%s")).toBe("chore: upgrade Specfold to v0.1.0-rc.2");
    const files = gitOut(root, "show", "--name-only", "--format=", "HEAD").split("\n").sort();
    expect(files).toEqual([
      ".agents/skills/sf-upgrade/SKILL.md",
      ".specfold/manifest.json",
      ".specfold/upgrade-report.md",
      "scripts/specfold.mjs",
      "specfold.yaml",
    ]);
    expect(JSON.parse(readFileSync(join(root, ".specfold/manifest.json"), "utf8"))).toMatchObject({
      kit_version: "0.1.0-rc.2",
      ref: "v0.1.0-rc.2",
    });
    expect(readFileSync(join(root, ".specfold/upgrade-report.md"), "utf8")).toContain(
      "| `specfold validate` | 0 |",
    );
    expect(gitOut(root, "status", "--porcelain")).toBe("");
  });

  // spec: specfold-upgrade#message-from-the-settings
  it("takes the commit message from upgrade.commit_message", async () => {
    const { root, base } = repo(
      "upgrade:\n  commit_message: 'chore(template): 🔧 upgrade the sample app to v{version}'\n",
    );
    await run(["upgrade", "--from", release("0.1.0-rc.2"), "--base-dir", base, "--yes"], root);
    expect(gitOut(root, "log", "-1", "--format=%s")).toBe(
      "chore(template): 🔧 upgrade the sample app to v0.1.0-rc.2",
    );
  });

  it("refuses --yes on a dirty tree or an existing branch and writes nothing", async () => {
    const { root, base } = repo("");
    write(root, "notes.txt", "wip\n");
    const dirty = await run(["upgrade", "--from", release("0.1.0-rc.2"), "--base-dir", base, "--yes"], root);
    expect(dirty.code).toBe(2);
    expect(dirty.stderr).toContain("uncommitted changes");
    execFileSync("git", ["clean", "-qfd"], { cwd: root });
    execFileSync("git", ["branch", "specfold/upgrade-0.1.0-rc.2"], { cwd: root });
    const exists = await run(["upgrade", "--from", release("0.1.0-rc.2"), "--yes"], root);
    expect(exists.code).toBe(2);
    expect(exists.stderr).toContain("already exists");
    expect(existsSync(join(root, ".specfold/upgrade-report.md"))).toBe(false);
  });

  it("exits with 1 when the applied upgrade left conflicts", async () => {
    const { root, base } = repo("");
    write(
      root,
      ".claude/agents/verifier.md",
      "# Verifier\n\nRun the unit tests.\n\nRun the gate.\n\nReport findings.\n",
    );
    commitAll(root);
    const next = release("0.1.0-rc.2", {
      ".claude/agents/verifier.md": "# Verifier\n\nRun all tests.\n\nRun the gate.\n\nReport findings.\n",
    });
    const result = await run(["upgrade", "--from", next, "--base-dir", base, "--yes"], root);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("1 conflict");
    expect(readFileSync(join(root, ".claude/agents/verifier.md"), "utf8")).toContain("<<<<<<< local");
  });
});
