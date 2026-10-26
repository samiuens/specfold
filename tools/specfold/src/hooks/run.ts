import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { checkPlannedChange } from "../change/command.ts";
import type { Io } from "../cli.ts";
import { findingLine } from "../findings.ts";
import { localGate, renderGate } from "../gate/command.ts";
import { openspecValidate } from "../gate/openspec.ts";
import { git } from "../git.ts";
import { openspecBinary } from "../openspec.ts";
import { type Config, resolveBundleRoot } from "../repo.ts";
import { taskFindingLine } from "../tasks/command.ts";
import { validate } from "../validate/index.ts";
import { isConcept } from "../validate/okf.ts";
import { localBase } from "./base.ts";
import { postToolUse, sessionStart, stop } from "./claude.ts";

export interface HookContext {
  config: Config;
  io: Io;
  /** The arguments git passed to the hook. */
  args: string[];
}

type OwnHook = (ctx: HookContext) => number | Promise<number>;

const ACTIVE_CHANGE = /^openspec\/changes\/([^/]+)\//;
const lines = (text: string) => text.split("\n").filter((l) => l !== "");

/** Validates staged concepts, checks staged changes and runs OpenSpec when openspec/ is staged. */
function preCommit({ config, io }: HookContext): number {
  const staged = lines(
    git(config.root, ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--relative"]),
  );
  const bundleRoot = resolveBundleRoot(config.root, undefined, config);
  const prefix = relative(config.root, bundleRoot).split(sep).join("/");
  const errors: string[] = [];

  const concepts = staged
    .filter((f) => f.startsWith(`${prefix}/`) && f.endsWith(".md") && isConcept(f.slice(prefix.length + 1)))
    .map((f) => join(config.root, f));
  if (concepts.length > 0) {
    const { findings } = validate({ bundleRoot, paths: concepts, okfOnly: false, config });
    for (const f of findings.filter((x) => x.severity === "error"))
      errors.push(findingLine({ ...f, path: `${prefix}/${f.path}` }));
  }

  const changes = new Set(
    staged.flatMap((f) => {
      const name = ACTIVE_CHANGE.exec(f)?.[1];
      const dir = name ? join(config.root, "openspec", "changes", name) : "";
      return name && name !== "archive" && existsSync(dir) && statSync(dir).isDirectory() ? [name] : [];
    }),
  );
  for (const change of changes)
    for (const f of checkPlannedChange(config, bundleRoot, change).filter((x) => x.severity === "error"))
      errors.push(taskFindingLine(f));

  if (staged.some((f) => f.startsWith("openspec/")))
    for (const issue of openspecValidate(config.root, openspecBinary(config.root)) ?? [])
      errors.push(`${issue.path} openspec ${issue.message}`);

  if (errors.length === 0) return 0;
  io.stdout(
    `${[...errors, `pre-commit: ${errors.length} error${errors.length === 1 ? "" : "s"}, commit stopped`].join("\n")}\n`,
  );
  return 1;
}

/** The local gate against origin; without a base the push goes through, because CI still gates. */
function prePush({ config, io }: HookContext): number {
  const base = localBase(config.root);
  if (!base) {
    io.stderr(
      "pre-push: no origin/HEAD or origin/main to compare with; skipping the gate (CI still runs it)\n",
    );
    return 0;
  }
  const findings = localGate(config, config.root, base);
  if (findings.every((f) => f.effect !== "block")) return 0;
  io.stdout(renderGate(findings));
  return 1;
}

/** Refreshes an installed graphify graph; never fails and stays silent. */
function refreshGraph({ config }: HookContext): number {
  spawnSync("graphify", ["update", "."], {
    cwd: config.root,
    env: { ...process.env, GRAPHIFY_BACKEND: "none" },
    stdio: "ignore",
    timeout: 120_000,
  });
  return 0;
}

const OWN_CHECKS: Record<string, OwnHook> = {
  "pre-commit": preCommit,
  "pre-push": prePush,
  "post-checkout": refreshGraph,
  "post-merge": refreshGraph,
  "claude-session-start": sessionStart,
  "claude-post-tool-use": postToolUse,
  "claude-stop": stop,
};

/** Runs each `hooks.extra.<name>` command with `sh -c`, the hook's arguments as `$1`, `$2`, ...; stops at the first failure. */
function runExtras(name: string, { config, io, args }: HookContext): number {
  for (const command of config.hooksExtra[name] ?? []) {
    const result = spawnSync("sh", ["-c", command, "specfold-hook", ...args], {
      cwd: config.root,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      io.stderr(
        `hook ${name}: '${command}' failed${result.status === null ? "" : ` with exit code ${result.status}`}\n`,
      );
      return 1;
    }
  }
  return 0;
}

/** A hook's own checks, then, if they pass, its extra commands. */
export async function runHook(name: string, ctx: HookContext): Promise<number> {
  const own = OWN_CHECKS[name];
  const code = own ? await own(ctx) : 0;
  return code === 0 ? runExtras(name, ctx) : code;
}
