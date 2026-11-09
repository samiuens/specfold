import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { openspecBinary } from "../openspec.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";
import { computeDiff } from "./diff.ts";
import { fetchPullRequest, githubEnv } from "./github.ts";
import { describeResult, MANUAL_STEPS, RequireError, realGh, requireGate } from "./require.ts";
import { type GateContext, type GateFinding, runGate } from "./rules.ts";
import { renderSummary } from "./summary.ts";

const location = (f: GateFinding) =>
  f.path === null ? "" : `${f.path}${f.line === null ? "" : `:${f.line}`} `;

/** Findings per effect and per rule id. */
export function countFindings(findings: GateFinding[]) {
  const rules: Record<string, number> = {};
  for (const f of findings) rules[f.rule] = (rules[f.rule] ?? 0) + 1;
  const block = findings.filter((f) => f.effect === "block").length;
  return { block, warn: findings.length - block, rules };
}

type ContextOptions = Pick<GateContext, "local" | "labels" | "prBody" | "pr">;

function gateContext(config: Config, cwd: string, base: string, o: ContextOptions): GateContext {
  return {
    config,
    bundleRoot: resolveBundleRoot(cwd, undefined, config),
    diff: computeDiff(config.root, base, o.local),
    ...o,
    openspec: openspecBinary(config.root),
    now: new Date(),
  };
}

/** The findings of `specfold gate --base <base> --local`, as the pre-push and Claude Code stop hooks run it. */
export const localGate = (config: Config, cwd: string, base: string): GateFinding[] =>
  runGate(gateContext(config, cwd, base, { local: true, labels: [], prBody: undefined, pr: undefined }));

/** Notes, findings (blocking ones with their fix), then the verdict line. */
export function renderGate(findings: GateFinding[], notes: string[] = []): string {
  const lines = [...notes];
  lines.push(
    ...findings.flatMap((f) => [
      `${f.effect} ${f.rule} ${location(f)}${f.message}`,
      ...(f.effect === "block" ? [`    fix: ${f.fix}`] : []),
    ]),
  );
  lines.push(`gate: ${verdict(findings)}`);
  return `${lines.join("\n")}\n`;
}

/** `passed, 2 warnings` or `blocked by G2, G4 (3 blocking findings, 2 warnings)`. */
function verdict(findings: GateFinding[]): string {
  const counts = countFindings(findings);
  const blocking = [...new Set(findings.filter((f) => f.effect === "block").map((f) => f.rule))];
  const warnings = plural(counts.warn, "warning");
  return counts.block === 0
    ? `passed, ${warnings}`
    : `blocked by ${blocking.join(", ")} (${plural(counts.block, "blocking finding")}, ${warnings})`;
}

const GATE_ONLY = ["base", "local", "pr", "label", "pr-body", "summary"];

/** `specfold gate require`: exit 0 when the check is required afterwards, 2 when GitHub refuses. */
function runRequire(values: Record<string, unknown>, out: (text: string) => void): number {
  const extra = GATE_ONLY.find((o) => values[o] !== undefined);
  if (extra) throw new UsageError(`--${extra} does not apply to 'gate require'`);
  try {
    const result = requireGate(realGh, { dryRun: values["dry-run"] === true });
    out(
      values.json ? `${JSON.stringify({ ok: true, ...result }, null, 2)}\n` : `${describeResult(result)}\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof RequireError)
      throw new EnvError(`could not make specfold-gate a required check: ${error.message}\n${MANUAL_STEPS}`);
    throw error;
  }
}

register({
  name: "gate",
  summary:
    "decide whether a branch may merge: run the merge-gate rules on its diff; require makes it a required check",
  usage:
    "specfold gate --base <ref> [--local] [--pr <number>] [--label <name>]... [--pr-body <file>] [--summary <file>] [--json] | require [--dry-run] [--json]",
  options: {
    base: { type: "string" },
    local: { type: "boolean" },
    pr: { type: "string" },
    label: { type: "string", multiple: true },
    "pr-body": { type: "string" },
    summary: { type: "string" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" },
  },
  run: async ({ io, values, positionals }) => {
    if (positionals[0] === "require" && positionals.length === 1) return runRequire(values, io.stdout);
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    if (values["dry-run"]) throw new UsageError("--dry-run applies only to 'gate require'");
    const base = values.base as string | undefined;
    if (!base) throw new UsageError("missing --base <ref>");
    const bodyFile = values["pr-body"] as string | undefined;
    if (bodyFile !== undefined && !existsSync(resolve(io.cwd, bodyFile)))
      throw new UsageError(`PR body file not found: ${bodyFile}`);
    const prArg = values.pr as string | undefined;
    if (prArg !== undefined && !/^[1-9]\d*$/.test(prArg))
      throw new UsageError(`--pr must be a pull request number, got '${prArg}'`);
    const config = requireConfig(io.cwd);
    const local = values.local === true;
    // read the PR before the diff is judged, so a missing token fails fast
    const pr = prArg === undefined ? undefined : await fetchPullRequest(githubEnv(), Number(prArg));
    const ctx = gateContext(config, io.cwd, base, {
      local,
      labels: (values.label as unknown as string[] | undefined) ?? [],
      prBody: bodyFile === undefined ? undefined : readFileSync(resolve(io.cwd, bodyFile), "utf8"),
      pr,
    });
    const findings = runGate(ctx);
    const adoption = ctx.diff.adoption;
    const skipped = config.profile === "knowledge" ? "G19" : "G4";
    const notes = adoption ? [`adoption PR: the base has no specfold.yaml, so ${skipped} is skipped`] : [];
    const summary = values.summary as string | undefined;
    if (summary !== undefined)
      writeFileSync(resolve(io.cwd, summary), renderSummary(findings, verdict(findings), notes));
    const counts = countFindings(findings);
    const ok = counts.block === 0;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, base, adoption, findings, counts }, null, 2)}\n`);
    } else {
      io.stdout(renderGate(findings, notes));
    }
    return ok ? 0 : 1;
  },
});
