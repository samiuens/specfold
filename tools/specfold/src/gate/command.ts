import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { openspecBinary } from "../openspec.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";
import { computeDiff } from "./diff.ts";
import { fetchPullRequest, githubEnv } from "./github.ts";
import { type GateContext, type GateFinding, runGate } from "./rules.ts";

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

/** Findings (blocking ones with their fix), then the verdict line. */
export function renderGate(findings: GateFinding[]): string {
  const counts = countFindings(findings);
  const lines = findings.flatMap((f) => [
    `${f.effect} ${f.rule} ${location(f)}${f.message}`,
    ...(f.effect === "block" ? [`    fix: ${f.fix}`] : []),
  ]);
  const blocking = [...new Set(findings.filter((f) => f.effect === "block").map((f) => f.rule))];
  const warnings = plural(counts.warn, "warning");
  lines.push(
    counts.block === 0
      ? `gate: passed, ${warnings}`
      : `gate: blocked by ${blocking.join(", ")} (${plural(counts.block, "blocking finding")}, ${warnings})`,
  );
  return `${lines.join("\n")}\n`;
}

register({
  name: "gate",
  summary: "decide whether a branch may merge: run the merge-gate rules on its diff",
  usage:
    "specfold gate --base <ref> [--local] [--pr <number>] [--label <name>]... [--pr-body <file>] [--json]",
  options: {
    base: { type: "string" },
    local: { type: "boolean" },
    pr: { type: "string" },
    label: { type: "string", multiple: true },
    "pr-body": { type: "string" },
    json: { type: "boolean" },
  },
  run: async ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
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
    const findings = runGate(
      gateContext(config, io.cwd, base, {
        local,
        labels: (values.label as unknown as string[] | undefined) ?? [],
        prBody: bodyFile === undefined ? undefined : readFileSync(resolve(io.cwd, bodyFile), "utf8"),
        pr,
      }),
    );
    const counts = countFindings(findings);
    const ok = counts.block === 0;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, base, findings, counts }, null, 2)}\n`);
    } else {
      io.stdout(renderGate(findings));
    }
    return ok ? 0 : 1;
  },
});
