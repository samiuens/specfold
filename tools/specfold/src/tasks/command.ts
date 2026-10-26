import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { type Config, requireConfig } from "../repo.ts";
import { checkTrailers, commitsSinceBase } from "./git.ts";
import { parseTasks } from "./parse.ts";
import { checkStatic, type TaskFinding } from "./rules.ts";
import { knownScenarioIds } from "./scenarios.ts";

const CHANGE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The active change's folder; a malformed name is a usage error, an unknown change an environment error. */
export function changeDir(config: Config, change: string | undefined): string {
  if (!change) throw new UsageError("missing change name");
  if (!CHANGE_NAME.test(change) || change === "archive")
    throw new UsageError(`'${change}' is not a change name (kebab-case)`);
  const dir = join(config.root, "openspec", "changes", change);
  if (!existsSync(dir) || !statSync(dir).isDirectory())
    throw new EnvError(`unknown change '${change}': no folder openspec/changes/${change}/`);
  return dir;
}

/** Rules T0-T11 for one change; T10 and T11 only when `base` is given. */
export function checkChangeTasks(config: Config, change: string, base?: string): TaskFinding[] {
  const dir = changeDir(config, change);
  const file = `openspec/changes/${change}/tasks.md`;
  const path = join(dir, "tasks.md");
  if (!existsSync(path)) {
    return [
      {
        rule: "T0",
        severity: "error",
        file,
        group: null,
        task: null,
        line: null,
        message: `change '${change}' has no tasks.md`,
        fix: "write tasks.md with task groups and tasks",
      },
    ];
  }
  const tasks = parseTasks(readFileSync(path, "utf8"));
  const findings = checkStatic(tasks, {
    repoRoot: config.root,
    file,
    knownScenarios: knownScenarioIds(config.root, dir),
    maxTasksPerGroup: config.tasks.maxTasksPerGroup,
  });
  if (base !== undefined) {
    findings.push(
      ...checkTrailers(tasks, commitsSinceBase(config.root, base), {
        change,
        file,
        maxFilesPerTask: config.tasks.maxFilesPerTask,
      }),
    );
  }
  return findings.sort(
    (a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0),
  );
}

export const taskFindingLine = (f: TaskFinding) =>
  `${f.file}${f.line === null ? "" : `:${f.line}`} ${f.rule} ${f.message}`;

register({
  name: "tasks",
  summary: "check a change's task breakdown",
  usage: "specfold tasks check <change> [--base <ref>] [--json]",
  options: { base: { type: "string" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, change, ...extra] = positionals;
    if (sub !== "check")
      throw new UsageError(
        sub ? `unknown tasks subcommand '${sub}'` : "missing subcommand: specfold tasks check",
      );
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const config = requireConfig(io.cwd);
    const findings = checkChangeTasks(config, change as string, values.base as string | undefined);
    const errors = findings.filter((f) => f.severity === "error").length;
    const warnings = findings.length - errors;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: errors === 0, change, errors, warnings, findings }, null, 2)}\n`);
    } else {
      const lines = findings.filter((f) => f.severity === "error").map(taskFindingLine);
      lines.push(`tasks check ${change}: ${plural(errors, "error")}, ${plural(warnings, "warning")}`);
      io.stdout(`${lines.join("\n")}\n`);
    }
    return errors === 0 ? 0 : 1;
  },
});
