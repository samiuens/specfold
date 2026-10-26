import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { openspecBinary } from "../openspec.ts";
import { type Config, findRepoRoot, loadConfig } from "../repo.ts";

export type Status = "ok" | "warn" | "fail";

export interface Check {
  id: string;
  status: Status;
  message: string;
  fix: string | null;
}

export interface DoctorEnv {
  cwd: string;
  nodeVersion: string;
  /** Runs a program and returns its stdout, or undefined when it is missing or fails. */
  exec: (cmd: string, args: string[], cwd: string) => string | undefined;
}

export const DEFAULT_OPENSPEC_RANGE = ">=1.15 <2";
const MIN_NODE = "20.19.0";

const parts = (v: string) => v.split(".").map((n) => Number.parseInt(n, 10) || 0);

export function compareVersions(a: string, b: string): number {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length, 3); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

/** True when `version` meets every space-separated comparator in `range`, e.g. `>=1.15 <2`. */
export function satisfies(version: string, range: string): boolean {
  return range
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((comparator) => {
      const m = /^(>=|<=|>|<|=)?v?(\d+(?:\.\d+){0,2})$/.exec(comparator);
      if (!m) return false;
      const c = compareVersions(version, m[2] ?? "0");
      switch (m[1]) {
        case ">=":
          return c >= 0;
        case "<=":
          return c <= 0;
        case ">":
          return c > 0;
        case "<":
          return c < 0;
        default:
          return c === 0;
      }
    });
}

const firstVersion = (text: string | undefined) => (text ? /\d+\.\d+\.\d+/.exec(text)?.[0] : undefined);
const ok = (id: string, message: string): Check => ({ id, status: "ok", message, fix: null });

function hookManagerMentions(root: string): boolean {
  const files = ["lefthook.yml", "lefthook.yaml", ".lefthook.yml", ".pre-commit-config.yaml"].map((f) =>
    join(root, f),
  );
  const husky = join(root, ".husky");
  if (existsSync(husky) && statSync(husky).isDirectory()) {
    for (const f of readdirSync(husky)) files.push(join(husky, f));
  }
  return files.some(
    (f) => existsSync(f) && statSync(f).isFile() && readFileSync(f, "utf8").includes("specfold hook"),
  );
}

export function runChecks(env: DoctorEnv): Check[] {
  const checks: Check[] = [];

  checks.push(
    compareVersions(env.nodeVersion, MIN_NODE) >= 0
      ? ok("D1", `Node ${env.nodeVersion}`)
      : {
          id: "D1",
          status: "fail",
          message: `Node ${env.nodeVersion} is older than ${MIN_NODE}`,
          fix: `install Node ${MIN_NODE} or newer`,
        },
  );

  const root = findRepoRoot(env.cwd);
  let config: Config | undefined;
  if (!root) {
    checks.push({
      id: "D2",
      status: "fail",
      message: "no specfold.yaml found",
      fix: "run 'specfold init' or work inside a Specfold repository",
    });
  } else {
    try {
      config = loadConfig(root);
      checks.push(ok("D2", `specfold.yaml in ${root}`));
    } catch (error) {
      checks.push({
        id: "D2",
        status: "fail",
        message: (error as Error).message,
        fix: "fix specfold.yaml so it parses",
      });
    }
  }

  const range = config?.requires.openspec ?? DEFAULT_OPENSPEC_RANGE;
  const binary = openspecBinary(root);
  const useLocal = binary.source === "node_modules/.bin";
  const source = binary.source;
  const openspec = firstVersion(env.exec(binary.command, ["--version"], env.cwd));
  if (!openspec) {
    checks.push({
      id: "D3",
      status: "fail",
      message: useLocal ? "node_modules/.bin/openspec does not run" : "openspec is not on the PATH",
      fix: "install OpenSpec so that `openspec` is on the PATH or in node_modules/.bin: https://github.com/Fission-AI/OpenSpec",
    });
  } else if (!satisfies(openspec, range)) {
    checks.push({
      id: "D3",
      status: "fail",
      message: `openspec ${openspec} from ${source} does not satisfy ${range}`,
      fix: `install an OpenSpec version matching ${range}`,
    });
  } else {
    checks.push(ok("D3", `openspec ${openspec} from ${source} (${range})`));
  }

  const base = root ?? env.cwd;
  const inGit = env.exec("git", ["rev-parse", "--is-inside-work-tree"], base)?.trim() === "true";
  const hooksPath = inGit ? env.exec("git", ["config", "--get", "core.hooksPath"], base)?.trim() : undefined;
  if (inGit && (hooksPath === ".specfold/hooks" || hookManagerMentions(base))) {
    checks.push(
      ok(
        "D4",
        hooksPath === ".specfold/hooks"
          ? "git hooks via core.hooksPath"
          : "git hooks via an existing hook manager",
      ),
    );
  } else {
    checks.push({
      id: "D4",
      status: "warn",
      message: inGit ? "Specfold git hooks are not installed" : "not inside a git repository",
      fix: "specfold hooks install",
    });
  }

  if (!root || !existsSync(join(root, "knowledge"))) {
    checks.push({
      id: "D5",
      status: "fail",
      message: "no knowledge/ bundle",
      fix: "create knowledge/ with a root index.md, or run 'specfold init'",
    });
  } else if (!existsSync(join(root, "knowledge", "index.md"))) {
    checks.push({
      id: "D5",
      status: "fail",
      message: "knowledge/index.md is missing",
      fix: "run 'specfold index'",
    });
  } else {
    checks.push(ok("D5", "knowledge/ bundle with index.md"));
  }

  const graphify = firstVersion(env.exec("graphify", ["--version"], env.cwd));
  checks.push(ok("D6", graphify ? `graphify ${graphify}` : "graphify not installed (optional)"));
  return checks;
}
