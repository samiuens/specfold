import { existsSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { type Entry, type ParsedFile, parseFile, walk } from "../bundle.ts";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { type Finding, renderHuman, renderJson } from "../findings.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";
import { l1, l2 } from "./links.ts";
import { okf1, okf2, okf3Index, okf3Log } from "./okf.ts";
import { p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14 } from "./profile.ts";

export interface RuleContext {
  bundleRoot: string;
  entries: Entry[];
  config?: Config;
}

/** A rule inspects one Markdown file and returns findings; rules never throw. */
export type Rule = (file: ParsedFile, ctx: RuleContext) => Finding[];

/** A rule over the whole bundle tree, limited to entries inside the selected paths. */
export type BundleRule = (ctx: RuleContext, inSelection: (rel: string) => boolean) => Finding[];

const okfRules: Rule[] = [okf1, okf2, okf3Index, okf3Log];
/** Profile and link rules; they only run without --okf-only. */
const profileRules: Rule[] = [p1, p2, p3, p4, p5, p6, p7, p9, p10, p11, p12, p13, p14, l1, l2];
const profileBundleRules: BundleRule[] = [p8];

export interface ValidateInput {
  bundleRoot: string;
  /** Absolute files or folders inside the bundle; empty means the whole bundle. */
  paths: string[];
  okfOnly: boolean;
  config?: Config;
}

export interface ValidateResult {
  findings: Finding[];
  checked: number;
}

const toRel = (root: string, abs: string) => relative(root, abs).split(sep).join("/");

export function validate(input: ValidateInput): ValidateResult {
  const entries = walk(input.bundleRoot);
  const roots = input.paths.map((abs) => toRel(input.bundleRoot, abs));
  const inSelection = (rel: string) =>
    roots.length === 0 || roots.some((r) => r === "" || rel === r || rel.startsWith(`${r}/`));
  const selected = new Set(
    entries.filter((e) => !e.isDir && e.rel.endsWith(".md") && inSelection(e.rel)).map((e) => e.rel),
  );
  const ctx: RuleContext = {
    bundleRoot: input.bundleRoot,
    entries,
    ...(input.config ? { config: input.config } : {}),
  };
  const rules = input.okfOnly ? okfRules : [...okfRules, ...profileRules];
  const findings: Finding[] = [];
  for (const rel of [...selected].sort()) {
    const file = parseFile(input.bundleRoot, rel);
    for (const rule of rules) findings.push(...rule(file, ctx));
  }
  if (!input.okfOnly) for (const rule of profileBundleRules) findings.push(...rule(ctx, inSelection));
  return { findings, checked: selected.size };
}

register({
  name: "validate",
  summary: "check a knowledge bundle: OKF conformance, profile rules, links",
  usage: "specfold validate [<path>...] [--bundle <dir>] [--okf-only] [--json]",
  options: { bundle: { type: "string" }, "okf-only": { type: "boolean" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const okfOnly = values["okf-only"] === true;
    const config = okfOnly ? undefined : requireConfig(io.cwd);
    const bundleRoot = resolveBundleRoot(io.cwd, values.bundle as string | undefined, config);
    const paths = positionals.map((p) => {
      const abs = resolve(io.cwd, p);
      const rel = relative(bundleRoot, abs);
      if (rel.startsWith("..") || resolve(bundleRoot, rel) !== abs) {
        throw new UsageError(`path is outside the bundle ${bundleRoot}: ${p}`);
      }
      if (!existsSync(abs)) throw new UsageError(`path not found: ${p}`);
      return abs;
    });
    const { findings, checked } = validate({ bundleRoot, paths, okfOnly, ...(config ? { config } : {}) });
    io.stdout(values.json ? renderJson(findings, checked) : renderHuman(findings, checked));
    return findings.some((f) => f.severity === "error") ? 1 : 0;
  },
});
