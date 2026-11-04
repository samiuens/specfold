#!/usr/bin/env node
// Kit repo only: builds a repository from each of the previous releases with that release's own
// `specfold init`, edits a kit file the way a team would, and upgrades it to this checkout's build.
// Run from the kit root after `npm ci`; gh needs read access to the kit's releases.
// see knowledge: /architecture/upgrade-flow.md
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "samiuens/specfold";
const TEAM_LINE = "Team rule: run the linter before handing back.";
const EDITED = ".claude/agents/verifier.md";
// paths an upgrade may change besides the kit files in the manifests
const BLOCK_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/pull_request_template.md",
  ".gitignore",
  ".github/CODEOWNERS",
  ".gitattributes",
  ".worktreeinclude",
];
const OTHER_FILES = [".claude/settings.json", "openspec/config.yaml", "specfold.yaml"];
const OTHER_PREFIXES = [".specfold/", ".claude/skills/", ".claude/commands/", ".agents/skills/openspec-"];

const root = process.cwd();
const env = {
  ...process.env,
  PATH: `${join(root, "node_modules/.bin")}:${process.env.PATH}`,
  GIT_AUTHOR_NAME: "fixture",
  GIT_AUTHOR_EMAIL: "fixture@example.com",
  GIT_COMMITTER_NAME: "fixture",
  GIT_COMMITTER_EMAIL: "fixture@example.com",
  NO_COLOR: "1",
};
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, env, encoding: "utf8" });
const must = (cmd, args, cwd) => {
  const r = run(cmd, args, cwd);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed:\n${r.stdout}${r.stderr}`);
  return r.stdout;
};
const read = (path) => readFileSync(path, "utf8");

/** Checks `tarball` against its `.sha256` and unpacks it into `dir` without its top folder. */
function unpack(tarball, dir) {
  const expected = read(`${tarball}.sha256`).trim().split(/\s+/)[0];
  const actual = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  if (actual !== expected) throw new Error(`${tarball} does not match its .sha256`);
  mkdirSync(dir, { recursive: true });
  must("tar", ["-xzf", tarball, "-C", dir, "--strip-components=1"]);
}

const manifestFiles = (dir) =>
  Object.keys(JSON.parse(read(join(dir, ".specfold/manifest.json"))).files ?? {});

/** Builds a repository from the release in `kit`, edits it, upgrades it to `next`; returns the problems found. */
function upgradeFixture(version, kit, next, target, work) {
  const repo = join(work, `${version}-repo`);
  cpSync(kit, repo, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (src) => src !== join(kit, "upgrade"),
  });
  must("git", ["init", "-q", "-b", "main"], repo);
  must(process.execPath, ["scripts/specfold.mjs", "init"], repo);
  must("git", ["add", "-A"], repo);
  must("git", ["commit", "-q", "-m", "fixture from the release"], repo);
  appendFileSync(join(repo, EDITED), `\n${TEAM_LINE}\n`);
  must("git", ["commit", "-q", "-am", "team edit"], repo);
  const before = manifestFiles(repo);

  const upgrade = run(
    process.execPath,
    [
      join(next, "scripts/specfold.mjs"),
      "upgrade",
      "--from",
      next,
      "--base-dir",
      kit,
      "--to",
      target,
      "--yes",
    ],
    repo,
  );
  if (upgrade.status !== 0)
    return [`upgrade exited with ${upgrade.status}:\n${upgrade.stdout}${upgrade.stderr}`];
  const allowed = new Set([...before, ...manifestFiles(repo), ...BLOCK_FILES, ...OTHER_FILES]);
  const changed = must("git", ["diff", "--name-only", "HEAD~1", "HEAD"], repo).split("\n").filter(Boolean);
  const problems = changed
    .filter((p) => !allowed.has(p) && !OTHER_PREFIXES.some((prefix) => p.startsWith(prefix)))
    .map((p) => `the upgrade changed ${p}, which is not the kit's`);
  const edited = read(join(repo, EDITED));
  if (!edited.includes(TEAM_LINE)) problems.push(`${EDITED} lost the team's line`);
  if (edited.includes("<<<<<<<")) problems.push(`${EDITED} has conflict markers`);
  return problems;
}

const releases = Number(process.argv[2] ?? 2);
const target = JSON.parse(read(join(root, "tools/specfold/package.json"))).version;
const work = mkdtempSync(join(tmpdir(), "specfold-fixtures-"));
let failed = false;
try {
  must(process.execPath, ["tools/specfold/release.mjs", "pack", target, "--out", join(work, "build")], root);
  const next = join(work, "build", "kit");
  unpack(join(work, "build", `specfold-template-v${target}.tar.gz`), next);

  // a release counts once its tarball is uploaded: the push that merges a release PR runs this while
  // release-please is still publishing, and the new release has no assets for a few seconds
  const published = JSON.parse(
    execFileSync("gh", ["api", `repos/${REPO}/releases?per_page=20`], { encoding: "utf8" }),
  ).filter((r) => !r.draft);
  const ready = published.filter((r) =>
    r.assets.some((a) => a.name === `specfold-template-${r.tag_name}.tar.gz`),
  );
  for (const r of published)
    if (!ready.includes(r)) console.log(`skipped ${r.tag_name}: its template tarball is not uploaded yet`);
  const tags = ready.map((r) => r.tag_name).slice(0, releases);
  if (tags.length === 0) throw new Error(`${REPO} has no releases to build fixtures from`);
  for (const tag of tags) {
    const version = tag.replace(/^v/, "");
    const dir = join(work, version);
    must("gh", [
      "release",
      "download",
      tag,
      "--repo",
      REPO,
      "--pattern",
      "specfold-template-*",
      "--dir",
      dir,
    ]);
    const tarball = join(
      dir,
      readdirSync(dir).find((f) => f.endsWith(".tar.gz")),
    );
    unpack(tarball, join(dir, "kit"));
    const problems = upgradeFixture(version, join(dir, "kit"), next, target, work);
    failed ||= problems.length > 0;
    console.log(
      problems.length === 0
        ? `ok: ${version} upgraded to this build (${target}), team edit kept`
        : `FAIL: ${version}\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
process.exitCode = failed ? 1 : 0;
