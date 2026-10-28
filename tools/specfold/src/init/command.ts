import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { MANIFEST_PATH, parseTools } from "../migrate/install.ts";
import { gitRoot } from "../migrate/repo.ts";
import { planInit, runInit } from "./init.ts";

register({
  name: "init",
  summary: "finish setting up a repository made from the template: settings, OpenSpec skills, links, hooks",
  usage: "specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--dry-run] [--json]",
  options: {
    stack: { type: "string" },
    "source-glob": { type: "string", multiple: true },
    tools: { type: "string" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const root = gitRoot(io.cwd);
    const options = {
      root,
      tools: parseTools(values.tools as string | undefined),
      stack: values.stack as string | undefined,
      sourceGlobs: values["source-glob"] as unknown as string[] | undefined,
    };
    const plan = planInit(options);
    const dryRun = values["dry-run"] === true;
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
        ...(plan.openspec
          ? [{ path: "openspec/", action: `run openspec init --tools ${options.tools.join(",")}` }]
          : []),
        { path: ".agents/skills", action: "run agents sync" },
        { path: "git hooks", action: "run hooks install" },
        ...(manifestChanges ? [{ path: MANIFEST_PATH, action: "write" }] : []),
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
