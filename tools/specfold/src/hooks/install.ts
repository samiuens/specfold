import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Document, isMap, isScalar, isSeq, parseDocument, type YAMLSeq } from "yaml";
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

const LEFTHOOK_FILES = ["lefthook.yml", "lefthook.yaml", ".lefthook.yml"];
const PRE_COMMIT_FILE = ".pre-commit-config.yaml";

/** The first hook manager found: lefthook, husky, then pre-commit/prek. */
export function detectManager(root: string): { name: string; path: string } | undefined {
  const lefthook = LEFTHOOK_FILES.find((f) => existsSync(join(root, f)));
  if (lefthook) return { name: "lefthook", path: lefthook };
  if (existsSync(join(root, ".husky"))) return { name: "husky", path: ".husky" };
  if (existsSync(join(root, PRE_COMMIT_FILE))) return { name: "pre-commit", path: PRE_COMMIT_FILE };
  return undefined;
}

/** The YAML file as an editable document that keeps comments; a missing or empty file becomes an empty mapping. */
function readDocument(path: string): Document {
  const doc = parseDocument(existsSync(path) ? readFileSync(path, "utf8") : "");
  if (doc.errors[0]) throw new EnvError(`${path}: ${doc.errors[0].message.split("\n")[0]}`);
  return isMap(doc.contents) ? doc : new Document({});
}

/** One `specfold` command per hook; a hook that already uses `jobs` gets a job instead. */
function lefthookEntries(config: Config, file: string): InstallAction[] {
  const path = join(config.root, file);
  const doc = readDocument(path);
  const actions: InstallAction[] = [];
  for (const hook of hookNames(config)) {
    const run = `${hookCommand(hook)} {0}`;
    const jobs = doc.getIn([hook, "jobs"]);
    if (isSeq(jobs)) {
      if (jobs.items.some((j) => isMap(j) && j.get("name") === "specfold")) continue;
      jobs.add(doc.createNode({ name: "specfold", run }));
    } else {
      if (doc.hasIn([hook, "commands", "specfold"])) continue;
      doc.setIn([hook, "commands", "specfold"], doc.createNode({ run }));
    }
    actions.push({ path: file, action: `add specfold to ${hook}` });
  }
  if (actions.length > 0) writeFileSync(path, String(doc));
  return actions;
}

/** One line per hook file in `.husky/`, created when missing. */
function huskyEntries(config: Config): InstallAction[] {
  const actions: InstallAction[] = [];
  for (const hook of hookNames(config)) {
    const path = `.husky/${hook}`;
    const abs = join(config.root, path);
    const line = `${hookCommand(hook)} "$@"`;
    const text = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    if (text.split("\n").some((l) => l.trim() === line)) continue;
    writeIfChanged(abs, `${text}${text === "" || text.endsWith("\n") ? "" : "\n"}${line}\n`, 0o755);
    actions.push({ path, action: `add ${hook}` });
  }
  return actions;
}

const idOf = (hook: unknown) => (isMap(hook) ? String(hook.get("id")) : "");

/** A local repo with one `specfold-<hook>` hook per hook, and every hook type in default_install_hook_types. */
function preCommitEntries(config: Config): InstallAction[] {
  const path = join(config.root, PRE_COMMIT_FILE);
  const doc = readDocument(path);
  if (!isSeq(doc.get("repos"))) doc.set("repos", doc.createNode([]));
  const repos = doc.get("repos") as YAMLSeq;
  const hookSeqs = repos.items.flatMap((repo) => {
    const hooks = isMap(repo) ? repo.get("hooks") : undefined;
    return isSeq(hooks) ? [{ repo, hooks }] : [];
  });
  const ids = new Set(hookSeqs.flatMap(({ hooks }) => hooks.items.map(idOf)));
  const actions: InstallAction[] = [];
  const missing = hookNames(config).filter((hook) => !ids.has(`specfold-${hook}`));
  if (missing.length > 0) {
    let target = hookSeqs.find(
      ({ repo, hooks }) =>
        isMap(repo) &&
        repo.get("repo") === "local" &&
        hooks.items.some((h) => idOf(h).startsWith("specfold-")),
    )?.hooks;
    if (!target) {
      target = doc.createNode([]) as YAMLSeq;
      repos.add(doc.createNode({ repo: "local", hooks: target }));
    }
    for (const hook of missing) {
      target.add(
        doc.createNode({
          id: `specfold-${hook}`,
          name: `specfold ${hook}`,
          entry: hookCommand(hook),
          language: "system",
          always_run: true,
          pass_filenames: hook === "commit-msg",
          stages: [hook],
        }),
      );
      actions.push({ path: PRE_COMMIT_FILE, action: `add specfold-${hook}` });
    }
  }
  // pre-commit installs only the hook types listed here, [pre-commit] when the key is missing
  const listed = doc.get("default_install_hook_types");
  const types = isSeq(listed) ? listed.items.map((t) => String(isScalar(t) ? t.value : t)) : ["pre-commit"];
  const added = hookNames(config).filter((h) => !types.includes(h));
  if (added.length > 0) {
    doc.set("default_install_hook_types", doc.createNode([...types, ...added], { flow: true }));
    actions.push({ path: PRE_COMMIT_FILE, action: `install hook types ${added.join(", ")}` });
  }
  if (actions.length > 0) writeFileSync(path, String(doc));
  return actions;
}

/** Installs Specfold's hooks: into the repository's hook manager, or as built-in hooks via core.hooksPath. */
export function installHooks(config: Config): InstallResult {
  requireGitRoot(config.root);
  const manager = detectManager(config.root);
  if (!manager) return installBuiltIn(config);
  if (manager.name === "lefthook") {
    const actions = lefthookEntries(config, manager.path);
    return { manager: "lefthook", actions, next: actions.length > 0 ? "run lefthook install" : null };
  }
  if (manager.name === "husky") return { manager: "husky", actions: huskyEntries(config), next: null };
  const actions = preCommitEntries(config);
  return {
    manager: "pre-commit",
    actions,
    next: actions.length > 0 ? "run pre-commit install (or prek install)" : null,
  };
}
