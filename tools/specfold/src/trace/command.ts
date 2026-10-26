import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { changeDir } from "../tasks/command.ts";
import { changedScenarios } from "./specs.ts";
import { buildTraceIndex, changeSpecs, traceReport } from "./trace.ts";

register({
  name: "trace",
  summary: "map spec scenarios to the tests that reference them; report uncovered and dangling ones",
  usage: "specfold trace [--change <name>] [--json]",
  options: { change: { type: "string" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const config = requireConfig(io.cwd);
    const change = values.change as string | undefined;
    const index = buildTraceIndex(config);
    if (change !== undefined) changeDir(config, change);
    const scope =
      change === undefined
        ? undefined
        : changedScenarios(
            index.active.get(change) ?? changeSpecs(config.root, `openspec/changes/${change}`),
          );
    const report = traceReport(index, scope);
    const uncovered = report.scenarios.filter((s) => s.refs.length === 0);
    const counts = {
      scenarios: report.scenarios.length,
      covered: report.scenarios.length - uncovered.length,
      uncovered: uncovered.length,
      dangling: report.dangling.length,
    };
    const ok = counts.uncovered === 0 && counts.dangling === 0;
    if (values.json) {
      io.stdout(
        `${JSON.stringify({ ok, scenarios: report.scenarios, dangling: report.dangling, counts }, null, 2)}\n`,
      );
    } else {
      const lines = [
        ...uncovered.map((s) => `uncovered ${s.id} (${s.spec}:${s.line})`),
        ...report.dangling.map((r) => `dangling ${r.file}:${r.line} ${r.id}`),
        `trace: ${plural(counts.scenarios, "scenario")}, ${counts.covered} covered, ${counts.uncovered} uncovered, ${counts.dangling} dangling`,
      ];
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
