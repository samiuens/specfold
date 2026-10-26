import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { auditBundle } from "../audit/rules.ts";
import { parseFile, parseText } from "../bundle.ts";
import { checkChange } from "../change/command.ts";
import { conceptDependencies, coveredBy } from "../drift/deps.ts";
import { EnvError } from "../errors.ts";
import type { Finding } from "../findings.ts";
import { listItems } from "../future/items.ts";
import { matchesAny } from "../glob.ts";
import { syncIndexes } from "../indexes/command.ts";
import { generateIndexes } from "../indexes/generate.ts";
import { locationsByConcept, scanReferences } from "../indexes/refs.ts";
import type { OpenSpecBinary } from "../openspec.ts";
import type { Config } from "../repo.ts";
import { planSync } from "../sync/plan.ts";
import { checkChangeTasks } from "../tasks/command.ts";
import type { TaskFinding } from "../tasks/rules.ts";
import { changedScenarios } from "../trace/specs.ts";
import { buildTraceIndex, changeSpecs } from "../trace/trace.ts";
import { validate } from "../validate/index.ts";
import { isConcept, isRecord } from "../validate/okf.ts";
import { isTimestamp } from "../validate/profile.ts";
import { addedClaims, baseVersion } from "./claims.ts";
import type { GateDiff } from "./diff.ts";
import type { PullRequest } from "./github.ts";
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
  /** The PR read with `--pr`; without it, G7 only warns. */
  pr: PullRequest | undefined;
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

/** Bundle-relative paths of changed concepts that still exist. */
function changedConcepts(ctx: GateContext): string[] {
  const prefix = `${relative(ctx.config.root, ctx.bundleRoot).split(sep).join("/")}/`;
  return ctx.diff.files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".md"))
    .map((f) => f.slice(prefix.length))
    .filter((rel) => isConcept(rel) && existsSync(join(ctx.bundleRoot, rel)));
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

/** Touched active changes with a tasks.md; those without one are still being planned. */
const plannedChanges = (ctx: GateContext) =>
  ctx.diff.activeChanges.filter((change) =>
    existsSync(join(ctx.config.root, "openspec", "changes", change, "tasks.md")),
  );

const touchedChanges = (ctx: GateContext, changes = ctx.diff.activeChanges) =>
  changes.map((change) => checkChange(ctx.config, ctx.bundleRoot, change));

/** G5: knowledge rule errors of every touched active change with a tasks.md. */
export const g5: GateRule = (ctx) =>
  touchedChanges(ctx, plannedChanges(ctx)).flatMap((fs) =>
    fs.filter((f) => f.rule.startsWith("K")).map((f) => fromChange("G5", f)),
  );

/** G13: brief rule errors of every touched active change. */
export const g13: GateRule = (ctx) =>
  touchedChanges(ctx).flatMap((fs) =>
    fs.filter((f) => f.rule.startsWith("B")).map((f) => fromChange("G13", f)),
  );

/** G18: `specfold tasks check <change> --base <ref>` for every touched active change with a tasks.md. */
export const g18: GateRule = (ctx) =>
  plannedChanges(ctx).flatMap((change) =>
    checkChangeTasks(ctx.config, change, ctx.diff.ref).map((f) => fromChange("G18", f)),
  );

/**
 * G15: scenarios added or modified by touched active and archived changes with a tasks.md need a test
 * reference; dangling references block; old gaps in the main specs warn once.
 */
export const g15: GateRule = (ctx) => {
  const root = ctx.config.root;
  const index = buildTraceIndex(ctx.config);
  const covered = new Set(index.refs.map((r) => r.id));
  const checked = new Set<string>();
  const findings: GateFinding[] = [];
  const archived = ctx.diff.archivedChanges
    .map((id) => `openspec/changes/archive/${id}`)
    .filter((rel) => existsSync(join(root, rel, "tasks.md")));
  const changes = [
    ...plannedChanges(ctx).map(
      (name) => index.active.get(name) ?? changeSpecs(root, `openspec/changes/${name}`),
    ),
    ...archived.map((rel) => changeSpecs(root, rel)),
  ];
  for (const s of changes.flatMap(changedScenarios)) {
    if (checked.has(s.id)) continue;
    checked.add(s.id);
    if (!covered.has(s.id))
      findings.push({
        rule: "G15",
        effect: "block",
        path: s.spec,
        line: s.line,
        message: `scenario ${s.id} has no test reference`,
        fix: `name it in a test with a 'spec: ${s.id}' comment`,
      });
  }
  for (const r of index.refs.filter((r) => !index.known.has(r.id)))
    findings.push({
      rule: "G15",
      effect: "block",
      path: r.file,
      line: r.line,
      message: `reference to unknown scenario ${r.id}`,
      fix: "point it at an existing scenario id (see specfold trace) or remove it",
    });
  const gaps = new Set(
    index.main.scenarios
      .filter((s) => index.known.has(s.id) && !covered.has(s.id) && !checked.has(s.id))
      .map((s) => s.id),
  );
  if (gaps.size > 0)
    findings.push({
      rule: "G15",
      effect: "warn",
      path: null,
      line: null,
      message: `${gaps.size === 1 ? "1 main-spec scenario has" : `${gaps.size} main-spec scenarios have`} no test reference`,
      fix: "run specfold trace and add tests for them over time",
    });
  return findings;
};

/** G16: changed files that a concept depends on, while the branch leaves that concept untouched. */
export const g16: GateRule = (ctx) => {
  const changed = new Set(ctx.diff.files);
  const effect: Effect = ctx.config.gate.blockOnDrift ? "block" : "warn";
  return conceptDependencies(ctx.config.root, ctx.bundleRoot, ctx.config.sourceGlobs)
    .filter((c) => !changed.has(c.file))
    .flatMap((c) =>
      ctx.diff.files
        .filter((f) => c.paths.some((p) => coveredBy(f, p)))
        .map((f) => ({
          rule: "G16",
          effect,
          path: f,
          line: null,
          message: `changed file is described by /${c.rel}, which this branch does not update`,
          fix: `check /${c.rel} against the change and update it, or re-verify it with specfold verify`,
        })),
    );
};

const COMMITMENTS_HEADING = /^##\s+Commitments\s*$/;
const COMMITMENT_LINK = /(?:\]\(|`)(\/[^)\s`]+\.md)[)`]/;
const VERDICT = /^\s*:\s*(kept|blocked)\b(?:\s*:\s*(.*))?/;

/** List items of a design's `## Commitments` section with their lines, or undefined without the section. */
function commitmentEntries(text: string): { line: number; text: string }[] | undefined {
  // comments become blank lines, so line numbers stay true and the template's examples never count
  const lines = text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, "")).split("\n");
  const start = lines.findIndex((l) => COMMITMENTS_HEADING.test(l));
  if (start === -1) return undefined;
  const entries: { line: number; text: string }[] = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i] as string); i++)
    if (/^\s*[-*]\s+/.test(lines[i] as string)) entries.push({ line: i + 1, text: lines[i] as string });
  return entries;
}

/** G17: designs of touched changes state how they treat open commitments; withdrawals carry a human verification. */
export const g17: GateRule = (ctx) => {
  const root = ctx.config.root;
  const open = listItems(ctx.bundleRoot, "commitments").filter((c) => c.data.state === "open");
  const findings: GateFinding[] = [];
  const warn = (path: string, line: number | null, message: string, fix: string) =>
    findings.push({ rule: "G17", effect: "warn", path, line, message, fix });

  for (const change of ctx.diff.activeChanges) {
    const rel = `openspec/changes/${change}/design.md`;
    if (!existsSync(join(root, rel))) continue;
    const entries = commitmentEntries(readFileSync(join(root, rel), "utf8"));
    if (entries === undefined) {
      if (open.length > 0)
        warn(
          rel,
          null,
          `design has no '## Commitments' section while ${open.length === 1 ? "1 open commitment exists" : `${open.length} open commitments exist`}`,
          "add '## Commitments' listing each open commitment the change touches as kept or blocked, or 'none'",
        );
      continue;
    }
    for (const entry of entries) {
      const link = COMMITMENT_LINK.exec(entry.text);
      if (!link) {
        warn(
          rel,
          entry.line,
          "commitment entry links no concept",
          "write '- [Title](/commitments/x.md): kept'",
        );
        continue;
      }
      const target = (link[1] as string).slice(1);
      const data = existsSync(join(ctx.bundleRoot, target))
        ? parseFile(ctx.bundleRoot, target).frontmatter?.data
        : undefined;
      if (!isRecord(data) || data.type !== "Deferred Commitment" || data.state !== "open")
        warn(
          rel,
          entry.line,
          `/${target} is not an open commitment`,
          "link an open commitment (specfold commitments list) or remove the entry",
        );
      const verdict = VERDICT.exec(entry.text.slice((link.index ?? 0) + link[0].length));
      if (!verdict)
        warn(
          rel,
          entry.line,
          `entry for /${target} says neither kept nor blocked`,
          "end the entry with ': kept' or ': blocked: <reason>'",
        );
      else if (verdict[1] === "blocked")
        warn(
          rel,
          entry.line,
          `design blocks commitment /${target}${verdict[2] ? `: ${verdict[2].trim()}` : ""}`,
          "change the design to keep it, or have a human withdraw the commitment",
        );
    }
  }

  const verified = new Set(
    addedClaims(root, ctx.bundleRoot, ctx.diff)
      .filter((c) => c.key === "verified")
      .map((c) => c.file),
  );
  for (const { rel, data, lineOf } of changedData(ctx)) {
    if (data.type !== "Deferred Commitment" || data.state !== "withdrawn") continue;
    const file = inRepo(ctx, rel);
    const base = baseVersion(root, ctx.diff.mergeBase, file);
    const before = base === undefined ? undefined : parseText(rel, base).frontmatter?.data;
    if (isRecord(before) && before.state === "withdrawn") continue;
    if (!verified.has(file))
      findings.push({
        rule: "G17",
        effect: "block",
        path: file,
        line: lineOf("state"),
        message: "commitment is withdrawn without a human verification",
        fix: "a human runs specfold commitments withdraw <commitment> --reason <text>, which records their verification",
      });
  }
  return findings;
};

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

/** G7: every human claim the branch adds names the PR author or an approver. */
export const g7: GateRule = (ctx) => {
  const claims = addedClaims(ctx.config.root, ctx.bundleRoot, ctx.diff);
  if (claims.length === 0) return [];
  const { pr } = ctx;
  if (!pr)
    return [
      {
        rule: "G7",
        effect: "warn",
        path: null,
        line: null,
        message: `${claims.length === 1 ? "1 human claim" : `${claims.length} human claims`} added (${claims.map((c) => `human:${c.login}`).join(", ")}); CI checks them against the PR with --pr`,
        fix: "nothing to do locally; make sure the named people author or approve the PR",
      },
    ];
  const allowed = new Set([pr.author, ...pr.approvers]);
  return claims
    .filter((c) => !allowed.has(c.login.toLowerCase()))
    .map((c) => ({
      rule: "G7",
      effect: "block" as const,
      path: c.file,
      line: c.line,
      message: `${c.key} names human:${c.login}, who is neither the author of PR #${pr.number} nor an approving reviewer`,
      fix: `have ${c.login} approve the PR, or remove the claim`,
    }));
};

/** Frontmatter of every changed concept. */
function changedData(ctx: GateContext) {
  return changedConcepts(ctx).flatMap((rel) => {
    const file = parseFile(ctx.bundleRoot, rel);
    const data = file.frontmatter?.data;
    return isRecord(data) ? [{ rel, data, lineOf: (k: string) => file.frontmatter?.lineOf(k) ?? null }] : [];
  });
}

/** G8: no changed concept names a human as its generator. */
export const g8: GateRule = (ctx) =>
  changedData(ctx).flatMap(({ rel, data, lineOf }) => {
    const by = isRecord(data.generated) ? data.generated.by : undefined;
    if (typeof by !== "string" || !by.startsWith("human:")) return [];
    return [
      {
        rule: "G8",
        effect: "block" as const,
        path: inRepo(ctx, rel),
        line: lineOf("generated"),
        message: `generated.by is the human actor '${by}'`,
        fix: "set generated.by to the agent or process that wrote it; humans record review with specfold verify",
      },
    ];
  });

/** G9: no changed concept is past its stale_after. */
export const g9: GateRule = (ctx) =>
  changedData(ctx).flatMap(({ rel, data, lineOf }) => {
    const stale = data.stale_after;
    if (!isTimestamp(stale) || Date.parse(stale as string) >= ctx.now.getTime()) return [];
    return [
      {
        rule: "G9",
        effect: ctx.config.gate.blockOnStaleTouched ? ("block" as const) : ("warn" as const),
        path: inRepo(ctx, rel),
        line: lineOf("stale_after"),
        message: `edited concept is stale since ${stale}`,
        fix: "review it against its sources, then move stale_after forward",
      },
    ];
  });

/** G10: the link rules of validate. */
export const g10: GateRule = (ctx) =>
  validateFindings(ctx)
    .filter((f) => LINK_RULES.has(f.rule))
    .map((f) => fromBundle(ctx, "G10", ctx.config.blockOnBrokenLinks ? "block" : "warn", f));

/** G12: audit rules A1 and A2 over the whole bundle, as warnings. */
export const g12: GateRule = (ctx) =>
  auditBundle(ctx.config, ctx.bundleRoot, ctx.now)
    .filter((f) => f.rule === "A1" || f.rule === "A2")
    .map((f) => fromBundle(ctx, "G12", "warn", f));

/** G14: `see knowledge:` references resolve; missing targets block in changed files. */
export const g14: GateRule = (ctx) => {
  const changed = new Set(ctx.diff.files);
  return scanReferences(ctx.config.root, ctx.config.sourceGlobs).flatMap((ref) => {
    const abs = join(ctx.bundleRoot, ref.concept);
    if (!existsSync(abs))
      return [
        {
          rule: "G14",
          effect: changed.has(ref.file) ? ("block" as const) : ("warn" as const),
          path: ref.file,
          line: ref.line,
          message: `reference to missing concept /${ref.concept}`,
          fix: "point the comment at an existing concept or create it",
        },
      ];
    const data = parseFile(ctx.bundleRoot, ref.concept).frontmatter?.data;
    if (isRecord(data) && data.status === "deprecated")
      return [
        {
          rule: "G14",
          effect: "warn" as const,
          path: ref.file,
          line: ref.line,
          message: `reference to deprecated concept /${ref.concept}`,
          fix: "point the comment at the concept that replaced it",
        },
      ];
    return [];
  });
};

export const RULES: GateRule[] = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g12, g13, g14, g15, g16, g17, g18];

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
