import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { openspecBinary } from "../openspec.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { computeDiff } from "./diff.ts";
import { type GateFinding, runGate } from "./rules.ts";

const location = (f: GateFinding) =>
  f.path === null ? "" : `${f.path}${f.line === null ? "" : `:${f.line}`} `;

/** Findings per effect and per rule id. */
export function countFindings(findings: GateFinding[]) {
  const rules: Record<string, number> = {};
  for (const f of findings) rules[f.rule] = (rules[f.rule] ?? 0) + 1;
  const block = findings.filter((f) => f.effect === "block").length;
  return { block, warn: findings.length - block, rules };
}

register({
  name: "gate",
  summary: "decide whether a branch may merge: run the merge-gate rules on its diff",
  usage: "specfold gate --base <ref> [--local] [--label <name>]... [--pr-body <file>] [--json]",
  options: {
    base: { type: "string" },
    local: { type: "boolean" },
    label: { type: "string", multiple: true },
    "pr-body": { type: "string" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const base = values.base as string | undefined;
    if (!base) throw new UsageError("missing --base <ref>");
    const bodyFile = values["pr-body"] as string | undefined;
    if (bodyFile !== undefined && !existsSync(resolve(io.cwd, bodyFile)))
      throw new UsageError(`PR body file not found: ${bodyFile}`);
    const config = requireConfig(io.cwd);
    const local = values.local === true;
    const findings = runGate({
      config,
      bundleRoot: resolveBundleRoot(io.cwd, undefined, config),
      diff: computeDiff(config.root, base, local),
      local,
      labels: (values.label as unknown as string[] | undefined) ?? [],
      prBody: bodyFile === undefined ? undefined : readFileSync(resolve(io.cwd, bodyFile), "utf8"),
      openspec: openspecBinary(config.root),
      now: new Date(),
    });
    const counts = countFindings(findings);
    const ok = counts.block === 0;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, base, findings, counts }, null, 2)}\n`);
    } else {
      const lines = findings.flatMap((f) => [
        `${f.effect} ${f.rule} ${location(f)}${f.message}`,
        ...(f.effect === "block" ? [`    fix: ${f.fix}`] : []),
      ]);
      const blocking = [...new Set(findings.filter((f) => f.effect === "block").map((f) => f.rule))];
      const warnings = plural(counts.warn, "warning");
      lines.push(
        ok
          ? `gate: passed, ${warnings}`
          : `gate: blocked by ${blocking.join(", ")} (${plural(counts.block, "blocking finding")}, ${warnings})`,
      );
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
