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
