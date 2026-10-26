import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";
import { changeDir, checkChangeTasks, taskFindingLine } from "../tasks/command.ts";
import type { TaskFinding } from "../tasks/rules.ts";
import { checkBrief } from "./brief.ts";
import { checkKnowledge } from "./knowledge.ts";

/** `skip_specs: true` in the change's .openspec.yaml. */
function skipsSpecs(dir: string): boolean {
  const path = join(dir, ".openspec.yaml");
  if (!existsSync(path)) return false;
  try {
    return (parse(readFileSync(path, "utf8")) as { skip_specs?: unknown } | null)?.skip_specs === true;
  } catch {
    return false;
  }
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Brief, knowledge and tasks findings for one active change, ordered by file, line and rule. */
export function checkChange(config: Config, bundleRoot: string, change: string): TaskFinding[] {
  const dir = changeDir(config, change);
  const findings = [
    ...checkBrief(bundleRoot, dir, change, skipsSpecs(dir)),
    ...checkKnowledge(config, bundleRoot, dir, { relDir: `openspec/changes/${change}` }).findings.filter(
      (f) => !(skipsSpecs(dir) && f.rule === "K5"),
    ),
    ...checkChangeTasks(config, change),
  ];
  return findings.sort(
    (a, b) => compare(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0) || compare(a.rule, b.rule),
  );
}

register({
  name: "change",
  summary: "check a change's brief.md, knowledge.md and tasks.md",
  usage: "specfold change check <change> [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, change, ...extra] = positionals;
    if (sub !== "check")
      throw new UsageError(
        sub ? `unknown change subcommand '${sub}'` : "missing subcommand: specfold change check",
      );
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const config = requireConfig(io.cwd);
    changeDir(config, change);
    const findings = checkChange(config, resolveBundleRoot(io.cwd, undefined, config), change as string);
    const errors = findings.filter((f) => f.severity === "error").length;
    const warnings = findings.length - errors;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: errors === 0, change, errors, warnings, findings }, null, 2)}\n`);
    } else {
      const lines = findings.filter((f) => f.severity === "error").map(taskFindingLine);
      lines.push(`change check ${change}: ${plural(errors, "error")}, ${plural(warnings, "warning")}`);
      io.stdout(`${lines.join("\n")}\n`);
    }
    return errors === 0 ? 0 : 1;
  },
});
