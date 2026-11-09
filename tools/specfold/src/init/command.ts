import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import {
  describeResult,
  MANUAL_STEPS,
  RequireError,
  RULESET_NAME,
  realGh,
  requireGate,
} from "../gate/require.ts";
import { MANIFEST_PATH, parseTools } from "../migrate/install.ts";
import { gitRoot } from "../migrate/repo.ts";
import { LOCAL_SETTINGS } from "../parallel/limit.ts";
import { parseProfile } from "../repo.ts";
import { planInit, runInit } from "./init.ts";

const GATE_STEP = `ruleset ${RULESET_NAME}`;

register({
  name: "init",
  summary: "finish setting up a repository made from the template: settings, OpenSpec skills, links, hooks",
  usage:
    "specfold init [--profile <full|knowledge>] [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--max-subagents <n>] [--upgrade-workflow] [--require-gate] [--dry-run] [--json]",
  options: {
    profile: { type: "string" },
    stack: { type: "string" },
    "source-glob": { type: "string", multiple: true },
    tools: { type: "string" },
    "max-subagents": { type: "string" },
    "upgrade-workflow": { type: "boolean" },
    "require-gate": { type: "boolean" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const root = gitRoot(io.cwd);
    const max = values["max-subagents"] as string | undefined;
    if (max !== undefined && !/^[1-9]\d*$/.test(max))
      throw new UsageError(`--max-subagents takes a positive whole number, got '${max}'`);
    const options = {
      root,
      tools: parseTools(values.tools as string | undefined),
      profile: values.profile === undefined ? undefined : parseProfile(values.profile, "--profile"),
      stack: values.stack as string | undefined,
      sourceGlobs: values["source-glob"] as unknown as string[] | undefined,
      maxSubagents: max === undefined ? undefined : Number(max),
      upgradeWorkflow: values["upgrade-workflow"] === true,
    };
    const plan = planInit(options);
    const dryRun = values["dry-run"] === true;
    const requireFlag = values["require-gate"] === true;
    const { stack, sourceGlobs } = plan.values;
    const valueLines = [
      `stack: ${stack.value ?? "unknown"} (${stack.source})`,
      `source globs: ${sourceGlobs.value.join(", ")} (${sourceGlobs.source})`,
    ];
    const skippedLines = (skipped: { path: string; reason: string }[]) =>
      skipped.map((s) => `${s.path}: skipped: ${s.reason}`);
    const filled = { stack: stack.value, source_globs: sourceGlobs.value };

    if (dryRun) {
      const manifestPath = join(root, MANIFEST_PATH);
      const manifestChanges =
        !existsSync(manifestPath) || readFileSync(manifestPath, "utf8") !== plan.manifest;
      const actions = [
        ...plan.edits.map((e) => ({ path: e.path, action: e.action })),
        ...plan.remove.map((path) => ({ path, action: "remove" })),
        ...(plan.openspec
          ? [{ path: "openspec/", action: `run openspec init --tools ${options.tools.join(",")}` }]
          : []),
        { path: ".agents/skills", action: "run agents sync" },
        { path: ".claude/settings.json", action: "run permissions sync" },
        { path: "git hooks", action: "run hooks install" },
        ...(plan.limit !== undefined
          ? [{ path: LOCAL_SETTINGS, action: `set subagent limit to ${plan.limit}` }]
          : []),
        ...(manifestChanges ? [{ path: MANIFEST_PATH, action: "write" }] : []),
        ...(requireFlag ? [{ path: GATE_STEP, action: "run gate require" }] : []),
      ];
      if (values.json)
        io.stdout(
          `${JSON.stringify({ ok: true, dry_run: true, values: filled, actions, skipped: plan.skipped, notes: [] }, null, 2)}\n`,
        );
      else
        io.stdout(
          `${[
            ...valueLines,
            ...actions.map((a) => `${a.path}: would ${a.action}`),
            ...skippedLines(plan.skipped),
            "init: dry run, nothing written",
          ].join("\n")}\n`,
        );
      return 0;
    }

    const result = runInit(options, plan);
    if (requireFlag) {
      // a refusal is a skipped step: the repository is set up, only the GitHub setting is missing
      try {
        const gate = requireGate(realGh);
        if (gate.action !== "unchanged") result.actions.push({ path: GATE_STEP, action: gate.action });
        else result.notes.push(describeResult(gate));
      } catch (error) {
        if (!(error instanceof RequireError)) throw error;
        result.skipped.push({ path: GATE_STEP, reason: error.message });
        result.notes.push(MANUAL_STEPS);
      }
    }
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: true, dry_run: false, values: filled, ...result }, null, 2)}\n`);
      return 0;
    }
    io.stdout(
      `${[
        ...valueLines,
        ...result.actions.map((a) => `${a.path}: ${a.action}`),
        ...skippedLines(result.skipped),
        result.actions.length === 0
          ? "init: everything is up to date"
          : `init: ${plural(result.actions.length, "change")}`,
        ...result.notes.map((n) => `then: ${n}`),
      ].join("\n")}\n`,
    );
    return 0;
  },
});
