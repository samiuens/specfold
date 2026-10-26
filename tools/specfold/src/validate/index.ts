import { existsSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { type Entry, type ParsedFile, parseFile, walk } from "../bundle.ts";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { type Finding, renderHuman, renderJson } from "../findings.ts";
import { type Config, findRepoRoot, requireConfig } from "../repo.ts";

export interface RuleContext {
  bundleRoot: string;
  entries: Entry[];
  config?: Config;
}

/** A rule inspects one Markdown file and returns findings; rules never throw. */
export type Rule = (file: ParsedFile, ctx: RuleContext) => Finding[];

const okfRules: Rule[] = [];

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
  const selected = new Set<string>();
  const markdown = entries.filter((e) => !e.isDir && e.rel.endsWith(".md")).map((e) => e.rel);
  if (input.paths.length === 0) {
    for (const rel of markdown) selected.add(rel);
  } else {
    for (const abs of input.paths) {
      const rel = toRel(input.bundleRoot, abs);
      for (const m of markdown) if (rel === "" || m === rel || m.startsWith(`${rel}/`)) selected.add(m);
    }
  }
  const ctx: RuleContext = {
    bundleRoot: input.bundleRoot,
    entries,
    ...(input.config ? { config: input.config } : {}),
  };
  const rules = okfRules;
  const findings: Finding[] = [];
  for (const rel of [...selected].sort()) {
    const file = parseFile(input.bundleRoot, rel);
    for (const rule of rules) findings.push(...rule(file, ctx));
  }
  return { findings, checked: selected.size };
}

function resolveBundleRoot(cwd: string, bundle: string | undefined, config: Config | undefined): string {
  let root: string;
  if (bundle) {
    root = resolve(cwd, bundle);
  } else {
    const repo = config?.root ?? findRepoRoot(cwd);
    if (!repo)
      throw new EnvError(
        "no bundle found: pass --bundle <dir> or run inside a repository with specfold.yaml",
      );
    root = join(repo, "knowledge");
  }
  if (!existsSync(root) || !statSync(root).isDirectory())
    throw new EnvError(`bundle root not found: ${root}`);
  return root;
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
