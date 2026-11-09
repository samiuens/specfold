// see knowledge: /architecture/upgrade-flow.md
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";
import { type Io, register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { git, gitSucceeds } from "../git.ts";
import { openspecInit } from "../migrate/install.ts";
import { openspecBinary } from "../openspec.ts";
import { CONFIG_FILE, type Config, requireConfig } from "../repo.ts";
import { applyPlan } from "./apply.ts";
import { runMigrations } from "./migrations.ts";
import {
  NO_SWITCH_TO_KNOWLEDGE,
  planUpgrade,
  profileChange,
  readInstalled,
  toolsOf,
  type UpgradePlan,
} from "./plan.ts";
import { type FollowUp, reportText } from "./report.ts";
import { fetchRelease, ghLoggedIn, openSource } from "./source.ts";
import { upgradePath } from "./version.ts";

export const REPORT_PATH = ".specfold/upgrade-report.md";
export const branchFor = (version: string) => `specfold/upgrade-${version}`;

interface Flags {
  check: boolean;
  yes: boolean;
  pr: boolean;
  json: boolean;
  to: string | undefined;
}

const installedVersion = (config: Config) => config.kitVersion || "0.0.0";

/** The plan as JSON: actions and reasons, without file contents. */
const planJson = (plan: UpgradePlan) => ({
  from: plan.from,
  to: plan.to,
  conflicts: plan.conflicts,
  files: plan.files.map(({ path, action, reason }) => ({ path, action, ...(reason ? { reason } : {}) })),
  blocks: plan.blocks.map(({ path, action, reason }) => ({ path, action, ...(reason ? { reason } : {}) })),
  configs: plan.configs.map(({ path, action, reason, notes }) => ({
    path,
    action,
    ...(reason ? { reason } : {}),
    notes,
  })),
  migrations: plan.migrations,
  notes: plan.notes,
});

/** Runs one command in `root` and keeps its exit code and last output line. */
function followUp(root: string, label: string, command: string, args: string[]): FollowUp {
  const r = spawnSync(command, args, { cwd: root, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
  const lines = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.split("\n").filter((l) => l.trim() !== "");
  return {
    command: label,
    code: r.status ?? -1,
    output: r.error ? `could not run: ${r.error.message}` : (lines.at(-1)?.trim() ?? ""),
  };
}

/**
 * The commands an applied upgrade runs with the upgraded CLI; `openspec update` only where OpenSpec is set up,
 * and the gate against `start`, the commit the upgrade branch was created from.
 */
function followUps(root: string, start: string): FollowUp[] {
  const cli = (...args: string[]) =>
    followUp(root, `specfold ${args.join(" ")}`, process.execPath, ["scripts/specfold.mjs", ...args]);
  const results: FollowUp[] = [];
  if (existsSync(join(root, "openspec/config.yaml")))
    results.push(followUp(root, "openspec update", openspecBinary(root).command, ["update"]));
  for (const args of [
    ["agents", "sync"],
    ["permissions", "sync"],
    ["hooks", "install"],
    ["index"],
    ["validate"],
    ["gate", "--base", start, "--local"],
  ])
    results.push(cli(...args));
  return results;
}

/**
 * Sets up OpenSpec after a switch from the knowledge profile: the release's config.yaml when the repository
 * has none, then openspec init, which keeps that config.
 */
function switchToFull(root: string, from: string): void {
  const config = join(root, "openspec/config.yaml");
  const text = existsSync(config)
    ? readFileSync(config, "utf8")
    : readFileSync(join(from, "openspec/config.yaml"), "utf8");
  mkdirSync(dirname(config), { recursive: true });
  writeFileSync(config, text);
  openspecInit(root, toolsOf(readInstalled(root)));
  writeFileSync(config, text);
}

/** The inner stage: plan against the unpacked release in `from`, and with `--yes` apply, commit and open a PR. */
async function inner(
  io: Io,
  config: Config,
  f: Flags,
  from: string,
  base: string | undefined,
  ref: string | undefined,
) {
  const root = config.root;
  for (const p of [CONFIG_FILE, "scripts/specfold.mjs"])
    if (!existsSync(join(from, p)))
      throw new EnvError(`--from ${from} is not a Specfold release: missing ${p}`);
  const shipped = (parse(readFileSync(join(from, CONFIG_FILE), "utf8")) as { kit_version?: unknown } | null)
    ?.kit_version;
  const target = f.to ?? (typeof shipped === "string" ? shipped : undefined);
  if (!target) throw new EnvError(`--from ${from} has no kit_version; pass --to <version>`);
  const plan = planUpgrade({
    root,
    from,
    base,
    installed: installedVersion(config),
    target,
    profile: config.profile,
  });
  const print = (text: string, json: unknown) =>
    io.stdout(f.json ? `${JSON.stringify(json, null, 2)}\n` : text);
  if (!f.yes) {
    print(reportText(plan), { applied: false, ...planJson(plan) });
    return 0;
  }

  if (git(root, ["status", "--porcelain"]).trim() !== "")
    throw new EnvError(
      "the working tree has uncommitted changes; commit or stash them, so the upgrade commit holds only the upgrade",
    );
  const branch = branchFor(target);
  if (gitSucceeds(root, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]))
    throw new EnvError(`branch ${branch} already exists; delete it or finish that upgrade first`);
  const start = git(root, ["rev-parse", "HEAD"]).trim();
  git(root, ["switch", "-q", "-c", branch]);
  applyPlan(root, plan, ref);
  if (plan.switchToFull) switchToFull(root, from);
  const lines: { version: string; line: string }[] = [];
  await runMigrations(root, from, plan.migrations, (version, line) => lines.push({ version, line }));
  const results = followUps(root, start);
  const report = reportText(plan, { migrations: lines, followUps: results });
  mkdirSync(dirname(join(root, REPORT_PATH)), { recursive: true });
  writeFileSync(join(root, REPORT_PATH), report);
  const message = config.upgradeCommitMessage.replaceAll("{version}", target);
  git(root, ["add", "-A", "--", "."]);
  git(root, ["commit", "-q", "-m", message]);
  let pr: string | undefined;
  if (f.pr) {
    git(root, ["push", "-q", "-u", "origin", branch]);
    const r = spawnSync(
      "gh",
      ["pr", "create", "--head", branch, "--title", message, "--body-file", join(root, REPORT_PATH)],
      {
        cwd: root,
        encoding: "utf8",
      },
    );
    if (r.status !== 0)
      throw new EnvError(
        `gh pr create failed: ${(r.stderr || r.error?.message || "").trim()}; the commit is on ${branch}`,
      );
    pr = r.stdout.trim();
  }
  const conflicts = [...plan.files, ...plan.blocks, ...plan.configs].filter(
    (s) => s.action === "conflict",
  ).length;
  print(
    [
      `upgraded ${plan.from} to ${plan.to} on ${branch}: ${message}`,
      `${plural(conflicts, "conflict")}; see ${REPORT_PATH}`,
      ...(pr ? [`pull request: ${pr}`] : []),
      "",
    ].join("\n"),
    { applied: true, branch, commit: message, ...(pr ? { pr } : {}), followUps: results, ...planJson(plan) },
  );
  return plan.conflicts ? 1 : 0;
}

/** The outer stage: find the target, fetch and check it, and hand the upgrade to the target's own CLI. */
async function outer(io: Io, config: Config, f: Flags, passThrough: string[]) {
  if (!config.source)
    throw new EnvError(`${CONFIG_FILE} has no 'source'; set source.github, source.url or source.path`);
  const source = openSource(config.source, config.root, {
    gh: "github" in config.source ? ghLoggedIn() : false,
  });
  if (profileChange(config.root, config.profile) === "to-knowledge")
    throw new EnvError(NO_SWITCH_TO_KNOWLEDGE);
  const installed = installedVersion(config);
  const versions = await source.versions();
  if (f.to !== undefined && !versions.includes(f.to))
    throw new EnvError(`${source.label} has no release ${f.to}`);
  const path = f.to !== undefined ? [f.to] : upgradePath(installed, versions, config.channel);
  if (f.check) {
    const notes = await Promise.all(
      path.map(async (v) => ({ version: v, notes: (await source.notes(v)).trim() })),
    );
    if (f.json)
      io.stdout(`${JSON.stringify({ installed, channel: config.channel, path, notes }, null, 2)}\n`);
    else if (path.length === 0)
      io.stdout(`up to date: ${installed} is the newest release on channel ${config.channel}\n`);
    else {
      const lines = [`installed ${installed}, newest ${path.at(-1)} on channel ${config.channel}`];
      if (path.length > 1) lines.push(`steps: ${path.join(", ")}; each run of specfold upgrade takes one`);
      for (const n of notes) lines.push("", `## ${n.version}`, "", n.notes || "No release notes.");
      io.stdout(`${lines.join("\n")}\n`);
    }
    return path.length === 0 ? 0 : 1;
  }
  // a switch to the full profile reinstalls the installed release when nothing newer exists
  const target =
    path[0] ?? (profileChange(config.root, config.profile) === "to-full" ? installed : undefined);
  if (target === undefined) {
    io.stdout(`up to date: ${installed} is the newest release on channel ${config.channel}\n`);
    return 0;
  }
  const work = mkdtempSync(join(tmpdir(), "specfold-upgrade-"));
  try {
    const next = await fetchRelease(source, target, join(work, "target"));
    let base: string | undefined;
    try {
      base = await fetchRelease(source, installed, join(work, "installed"));
    } catch (error) {
      io.stderr(
        `specfold: the installed release ${installed} is not available (${(error as Error).message}); locally changed kit files become conflicts\n`,
      );
    }
    const ref = source.tag(target);
    const args = [
      join(next, "scripts/specfold.mjs"),
      "upgrade",
      "--from",
      next,
      ...(base ? ["--base-dir", base] : []),
      "--to",
      target,
      ...(ref ? ["--ref", ref] : []),
      ...passThrough,
    ];
    const r = spawnSync(process.execPath, args, { cwd: io.cwd, encoding: "utf8" });
    if (r.error) throw new EnvError(`could not run the ${target} CLI: ${r.error.message}`);
    io.stdout(r.stdout);
    io.stderr(r.stderr);
    return r.status ?? 2;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

register({
  name: "upgrade",
  summary: "upgrade the installed kit to a newer release: check, plan, or apply on its own branch",
  usage: "specfold upgrade [--check] [--to <version>] [--yes] [--pr] [--json]",
  options: {
    check: { type: "boolean" },
    to: { type: "string" },
    yes: { type: "boolean" },
    pr: { type: "boolean" },
    json: { type: "boolean" },
    // set by the outer stage for the target release's CLI; --from also takes an unpacked release by hand
    from: { type: "string" },
    "base-dir": { type: "string" },
    ref: { type: "string" },
  },
  run: async ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const f: Flags = {
      check: values.check === true,
      yes: values.yes === true,
      pr: values.pr === true,
      json: values.json === true,
      to: typeof values.to === "string" ? values.to : undefined,
    };
    if (f.pr && !f.yes) throw new UsageError("--pr needs --yes");
    if (f.check && (f.yes || values.from !== undefined))
      throw new UsageError("--check takes no --yes or --from");
    const config = requireConfig(io.cwd);
    if (typeof values.from === "string") {
      const base = typeof values["base-dir"] === "string" ? resolve(io.cwd, values["base-dir"]) : undefined;
      const ref = typeof values.ref === "string" ? values.ref : undefined;
      return inner(io, config, f, resolve(io.cwd, values.from), base, ref);
    }
    const passThrough = [
      ...(f.yes ? ["--yes"] : []),
      ...(f.pr ? ["--pr"] : []),
      ...(f.json ? ["--json"] : []),
    ];
    return outer(io, config, f, passThrough);
  },
});
