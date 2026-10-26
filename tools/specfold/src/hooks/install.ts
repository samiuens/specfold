import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EnvError } from "../errors.ts";
import { git } from "../git.ts";
import type { Config } from "../repo.ts";

export const HOOKS_PATH = ".specfold/hooks";
/** Hooks with Specfold's own checks; `hooks.extra` adds more. */
export const OWN_HOOKS = ["pre-commit", "pre-push", "post-checkout", "post-merge"];

export interface InstallAction {
  path: string;
  action: string;
}

export interface InstallResult {
  /** The hook manager that got the entries, or null for the built-in hooks. */
  manager: string | null;
  actions: InstallAction[];
  /** What the user still has to run, if anything. */
  next: string | null;
}

/** Specfold's own hooks plus every hook named in `hooks.extra`. */
export const hookNames = (config: Config) => [...new Set([...OWN_HOOKS, ...Object.keys(config.hooksExtra)])];

export const hookCommand = (hook: string) => `node scripts/specfold.mjs hook ${hook}`;

function gitConfig(root: string, key: string): string | undefined {
  try {
    return git(root, ["config", "--get", key]).trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Writes `text` to `path` when it differs; returns whether it wrote. */
export function writeIfChanged(path: string, text: string, mode?: number): boolean {
  if (existsSync(path) && readFileSync(path, "utf8") === text) return false;
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
  if (mode !== undefined) chmodSync(path, mode);
  return true;
}

function requireGitRoot(root: string): void {
  let top: string;
  try {
    top = git(root, ["rev-parse", "--show-toplevel"]).trim();
  } catch {
    throw new EnvError("not inside a git repository: run git init first");
  }
  if (realpathSync(top) !== realpathSync(root))
    throw new EnvError(
      `specfold.yaml is in a subfolder of the git repository ${top}; hooks are installed from the git root, because core.hooksPath applies to the whole repository`,
    );
}

function installBuiltIn(config: Config): InstallResult {
  const current = gitConfig(config.root, "core.hooksPath");
  if (current !== undefined && current.replace(/\/+$/, "") !== HOOKS_PATH)
    throw new EnvError(
      `core.hooksPath is already set to '${current}' and no known hook manager was found; move its hooks to hooks.extra in specfold.yaml and unset it, or add specfold to your hook manager`,
    );
  const actions: InstallAction[] = [];
  for (const hook of hookNames(config)) {
    const path = `${HOOKS_PATH}/${hook}`;
    const script = `#!/bin/sh\n# Installed by specfold hooks install; project commands go into hooks.extra in specfold.yaml.\nexec ${hookCommand(hook)} "$@"\n`;
    if (writeIfChanged(join(config.root, path), script, 0o755)) actions.push({ path, action: "write" });
  }
  if (current === undefined) {
    git(config.root, ["config", "core.hooksPath", HOOKS_PATH]);
    actions.push({ path: "core.hooksPath", action: `set to ${HOOKS_PATH}` });
  }
  return { manager: null, actions, next: null };
}

/** Installs Specfold's hooks: into the repository's hook manager, or as built-in hooks via core.hooksPath. */
export function installHooks(config: Config): InstallResult {
  requireGitRoot(config.root);
  return installBuiltIn(config);
}
