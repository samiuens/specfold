import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";
import { EnvError } from "./errors.ts";

export const CONFIG_FILE = "specfold.yaml";

export interface FolderInfo {
  title?: string;
  description?: string;
}

export interface Config {
  /** Repository root: the directory holding specfold.yaml. */
  root: string;
  types: string[];
  sourceGlobs: string[];
  blockOnBrokenLinks: boolean;
  folders: Record<string, FolderInfo>;
  /** `actors.agent_prefix`, prepended to the model for agent-written `generated.by`. */
  agentPrefix: string;
  /** Supported tool ranges from `requires:`, e.g. `openspec: ">=1.15 <2"`. */
  requires: Record<string, string>;
  /** `tasks.max_files_per_task` and `tasks.max_tasks_per_group`; both limits only warn. */
  tasks: { maxFilesPerTask: number; maxTasksPerGroup: number };
  /** `agents.targets`: repository-relative folders that receive one symlink per skill. */
  agentTargets: string[];
  /** `audit.unverified_after_days`: age after which a concept without `verified` is an audit finding. */
  unverifiedAfterDays: number;
  /** `gate.*` settings beyond `block_on_broken_links`. */
  gate: { requireChangeForSourceChanges: boolean; escapeLabel: string; blockOnStaleTouched: boolean };
  /** `hooks.extra`: shell commands per git hook name, run after Specfold's own checks. */
  hooksExtra: Record<string, string[]>;
}

/** The nearest directory at or above `cwd` that contains specfold.yaml. */
export function findRepoRoot(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (existsSync(join(dir, CONFIG_FILE))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const positiveInt = (v: unknown, key: string, fallback: number): number => {
  if (v === undefined) return fallback;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1) {
    throw new EnvError(`${CONFIG_FILE}: '${key}' must be a positive integer`);
  }
  return v;
};

/** A repository-relative folder: not absolute, no `..` segment. */
function repoFolder(path: string, key: string): string {
  const clean = path.replace(/\/+$/, "");
  if (clean === "" || clean.startsWith("/") || /^[A-Za-z]:/.test(clean) || clean.split("/").includes(".."))
    throw new EnvError(`${CONFIG_FILE}: '${key}' entry '${path}' must be a folder inside the repository`);
  return clean;
}

const stringList = (v: unknown, key: string): string[] => {
  if (v === undefined) return [];
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
    throw new EnvError(`${CONFIG_FILE}: '${key}' must be a list of strings`);
  }
  return v;
};

export function loadConfig(root: string): Config {
  let data: unknown;
  try {
    data = parse(readFileSync(join(root, CONFIG_FILE), "utf8"));
  } catch (error) {
    throw new EnvError(`${CONFIG_FILE}: ${(error as Error).message.split("\n")[0]}`);
  }
  if (!isRecord(data)) throw new EnvError(`${CONFIG_FILE}: expected a mapping at the top level`);
  const gate = isRecord(data.gate) ? data.gate : {};
  const actors = isRecord(data.actors) ? data.actors : {};
  const tasks = isRecord(data.tasks) ? data.tasks : {};
  const agents = isRecord(data.agents) ? data.agents : {};
  const audit = isRecord(data.audit) ? data.audit : {};
  const hooks = isRecord(data.hooks) ? data.hooks : {};
  const extra = hooks.extra === undefined ? {} : hooks.extra;
  if (!isRecord(extra))
    throw new EnvError(`${CONFIG_FILE}: 'hooks.extra' must map hook names to command lists`);
  const hooksExtra: Record<string, string[]> = {};
  for (const [name, commands] of Object.entries(extra)) {
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(name))
      throw new EnvError(`${CONFIG_FILE}: '${name}' in 'hooks.extra' is not a hook name`);
    hooksExtra[name] = stringList(commands, `hooks.extra.${name}`);
  }
  const folders: Record<string, FolderInfo> = {};
  if (isRecord(data.folders)) {
    for (const [path, info] of Object.entries(data.folders)) {
      if (!isRecord(info)) continue;
      folders[path] = {
        ...(typeof info.title === "string" ? { title: info.title } : {}),
        ...(typeof info.description === "string" ? { description: info.description } : {}),
      };
    }
  }
  return {
    root,
    types: stringList(data.types, "types"),
    sourceGlobs: stringList(data.source_globs, "source_globs"),
    blockOnBrokenLinks: gate.block_on_broken_links !== false,
    folders,
    agentPrefix: typeof actors.agent_prefix === "string" ? actors.agent_prefix : "",
    requires: Object.fromEntries(
      Object.entries(isRecord(data.requires) ? data.requires : {}).filter(
        (e): e is [string, string] => typeof e[1] === "string",
      ),
    ),
    tasks: {
      maxFilesPerTask: positiveInt(tasks.max_files_per_task, "tasks.max_files_per_task", 5),
      maxTasksPerGroup: positiveInt(tasks.max_tasks_per_group, "tasks.max_tasks_per_group", 8),
    },
    agentTargets:
      agents.targets === undefined
        ? [".claude/skills"]
        : stringList(agents.targets, "agents.targets").map((t) => repoFolder(t, "agents.targets")),
    unverifiedAfterDays: positiveInt(audit.unverified_after_days, "audit.unverified_after_days", 30),
    gate: {
      requireChangeForSourceChanges: gate.require_change_for_source_changes !== false,
      escapeLabel:
        typeof gate.escape_label === "string" && gate.escape_label !== "" ? gate.escape_label : "no-spec",
      blockOnStaleTouched: gate.block_on_stale_touched !== false,
    },
    hooksExtra,
  };
}

/** Finds and loads the repository configuration, or fails with an environment error. */
export function requireConfig(cwd: string): Config {
  const root = findRepoRoot(cwd);
  if (!root) throw new EnvError(`no ${CONFIG_FILE} found in ${resolve(cwd)} or any parent directory`);
  return loadConfig(root);
}

/** The bundle root: `--bundle` relative to cwd, or knowledge/ under the repository root. */
export function resolveBundleRoot(
  cwd: string,
  bundle: string | undefined,
  config: Config | undefined,
): string {
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
