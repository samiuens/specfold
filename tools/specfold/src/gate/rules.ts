import { relative, sep } from "node:path";
import { checkChange } from "../change/command.ts";
import { EnvError } from "../errors.ts";
import type { Finding } from "../findings.ts";
import { matchesAny } from "../glob.ts";
import { syncIndexes } from "../indexes/command.ts";
import { generateIndexes } from "../indexes/generate.ts";
import { locationsByConcept, scanReferences } from "../indexes/refs.ts";
import type { OpenSpecBinary } from "../openspec.ts";
import type { Config } from "../repo.ts";
import { planSync } from "../sync/plan.ts";
import { checkChangeTasks } from "../tasks/command.ts";
import type { TaskFinding } from "../tasks/rules.ts";
import { validate } from "../validate/index.ts";
import type { GateDiff } from "./diff.ts";
import { openspecValidate } from "./openspec.ts";

export type Effect = "block" | "warn";

export interface GateFinding {
  rule: string;
  effect: Effect;
  /** Repository-relative path, or null when the finding has no single file. */
  path: string | null;
  line: number | null;
  message: string;
  fix: string;
}

export interface GateContext {
  config: Config;
  bundleRoot: string;
  diff: GateDiff;
  /** `--local`: G3 without OpenSpec and an unsatisfied G4 only warn. */
  local: boolean;
  labels: string[];
  /** Text of the `--pr-body` file. */
  prBody: string | undefined;
  openspec: OpenSpecBinary;
  now: Date;
}

export type GateRule = (ctx: GateContext) => GateFinding[];

const LINK_RULES = new Set(["L1", "L2"]);
const NO_SPEC_REASON = /^No-spec reason:[ \t]*\S/m;

/** A bundle-relative path as a repository-relative one. */
function inRepo(ctx: GateContext, bundleRel: string): string {
  const prefix = relative(ctx.config.root, ctx.bundleRoot).split(sep).join("/");
  return prefix ? `${prefix}/${bundleRel}` : bundleRel;
}

const fromBundle = (ctx: GateContext, rule: string, effect: Effect, f: Finding): GateFinding => ({
  rule,
  effect,
  path: inRepo(ctx, f.path),
  line: f.line,
  message: `${f.rule} ${f.message}`,
  fix: f.fix,
});

const fromChange = (rule: string, f: TaskFinding): GateFinding => ({
  rule,
  effect: f.severity === "error" ? "block" : "warn",
  path: f.file,
  line: f.line,
  message: `${f.rule} ${f.message}`,
  fix: f.fix,
});

const validated = new WeakMap<GateContext, Finding[]>();
function validateFindings(ctx: GateContext): Finding[] {
  let findings = validated.get(ctx);
  if (!findings) {
    findings = validate({
      bundleRoot: ctx.bundleRoot,
      paths: [],
      okfOnly: false,
      config: ctx.config,
    }).findings;
    validated.set(ctx, findings);
  }
  return findings;
}

/** G1: every validate error except the link rules. */
export const g1: GateRule = (ctx) =>
  validateFindings(ctx)
    .filter((f) => f.severity === "error" && !LINK_RULES.has(f.rule))
    .map((f) => fromBundle(ctx, "G1", "block", f));

/** G2: every index.md that `specfold index --check` reports as outdated. */
export const g2: GateRule = (ctx) => {
  const refs = scanReferences(ctx.config.root, ctx.config.sourceGlobs);
  const { indexes } = generateIndexes(ctx.bundleRoot, ctx.config, locationsByConcept(refs));
  return syncIndexes(ctx.config.root, ctx.bundleRoot, indexes, true).map((path) => ({
    rule: "G2",
    effect: "block",
    path,
    line: null,
    message: "index is outdated",
    fix: "run specfold index and commit the result",
  }));
};

/** G3: `openspec validate --all --strict`. */
export const g3: GateRule = (ctx) => {
  const issues = openspecValidate(ctx.config.root, ctx.openspec);
  if (issues === undefined) {
    const message = `openspec is not installed (looked for ${ctx.openspec.command})`;
    if (!ctx.local) throw new EnvError(message);
    return [
      {
        rule: "G3",
        effect: "warn",
        path: null,
        line: null,
        message: `${message}; specs were not validated`,
        fix: "install OpenSpec so that `openspec` is on the PATH or in node_modules/.bin",
      },
    ];
  }
  return issues.map((i) => ({
    rule: "G3",
    effect: "block",
    path: i.path,
    line: null,
    message: i.message,
    fix: "run openspec validate --all --strict and fix the reported items",
  }));
};

/** G4: source changes need an active or archived change, or the escape label with a reason. */
export const g4: GateRule = (ctx) => {
  if (!ctx.config.gate.requireChangeForSourceChanges) return [];
  const sources = ctx.diff.files.filter((f) => matchesAny(f, ctx.config.sourceGlobs));
  if (sources.length === 0) return [];
  if (ctx.diff.activeChanges.length > 0 || ctx.diff.archivedChanges.length > 0) return [];
  const label = ctx.config.gate.escapeLabel;
  const labelled = ctx.labels.includes(label);
  const reasoned = ctx.prBody !== undefined && NO_SPEC_REASON.test(ctx.prBody);
  if (labelled && reasoned) return [];
  const count = sources.length === 1 ? "1 source file" : `${sources.length} source files`;
  return [
    {
      rule: "G4",
      effect: ctx.local ? "warn" : "block",
      path: sources[0] as string,
      line: null,
      message: labelled
        ? `label '${label}' is set but the PR body has no 'No-spec reason:' line`
        : `${count} changed without an OpenSpec change`,
      fix: `add or update a change under openspec/changes/, or set the '${label}' label and a 'No-spec reason:' line in the PR body`,
    },
  ];
};

const touchedChanges = (ctx: GateContext) =>
  ctx.diff.activeChanges.map((change) => checkChange(ctx.config, ctx.bundleRoot, change));

/** G5: knowledge rule errors of every touched active change. */
export const g5: GateRule = (ctx) =>
  touchedChanges(ctx).flatMap((fs) =>
    fs.filter((f) => f.rule.startsWith("K")).map((f) => fromChange("G5", f)),
  );

/** G13: brief rule errors of every touched active change. */
export const g13: GateRule = (ctx) =>
  touchedChanges(ctx).flatMap((fs) =>
    fs.filter((f) => f.rule.startsWith("B")).map((f) => fromChange("G13", f)),
  );

/** G18: `specfold tasks check <change> --base <ref>` for every touched active change. */
export const g18: GateRule = (ctx) =>
  ctx.diff.activeChanges.flatMap((change) =>
    checkChangeTasks(ctx.config, change, ctx.diff.ref).map((f) => fromChange("G18", f)),
  );

/** G6: every archived change's knowledge rules pass and its sync has nothing left to do. */
export const g6: GateRule = (ctx) =>
  ctx.diff.archivedChanges.flatMap((id) => {
    const sync = planSync(ctx.config, ctx.bundleRoot, id, ctx.now);
    if (sync.findings.length > 0)
      return sync.findings.map((f) => ({ ...fromChange("G6", f), effect: "block" as const }));
    const actions = [...(sync.plan?.actions ?? [])];
    if (sync.needsLog) actions.push({ path: sync.logRel, action: "add log entry" });
    const name = id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    return actions.map((a) => ({
      rule: "G6",
      effect: "block" as const,
      path: a.path,
      line: null,
      message: `archived change ${id} is not synced: ${a.action}`,
      fix: `run specfold sync ${name} and commit the result`,
    }));
  });

/** G10: the link rules of validate. */
export const g10: GateRule = (ctx) =>
  validateFindings(ctx)
    .filter((f) => LINK_RULES.has(f.rule))
    .map((f) => fromBundle(ctx, "G10", ctx.config.blockOnBrokenLinks ? "block" : "warn", f));

export const RULES: GateRule[] = [g1, g2, g3, g4, g5, g6, g10, g13, g18];

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const ruleNumber = (rule: string) => Number.parseInt(rule.slice(1), 10);

/** Blocking findings first, then warnings; each by rule number, path (none first) and line. */
export function sortGateFindings(findings: GateFinding[]): GateFinding[] {
  return [...findings].sort(
    (a, b) =>
      (a.effect === b.effect ? 0 : a.effect === "block" ? -1 : 1) ||
      ruleNumber(a.rule) - ruleNumber(b.rule) ||
      compare(a.path ?? "", b.path ?? "") ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}

/** Every gate rule over one context, sorted. */
export const runGate = (ctx: GateContext): GateFinding[] =>
  sortGateFindings(RULES.flatMap((rule) => rule(ctx)));
