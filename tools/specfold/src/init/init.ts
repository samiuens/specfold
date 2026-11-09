import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { applyLinks, listSkills, planLinks } from "../agents/sync.ts";
import { EnvError } from "../errors.ts";
import { installHooks, writeIfChanged } from "../hooks/install.ts";
import { applyBlock, blockStyle, hasBlock } from "../migrate/blocks.ts";
import { detect } from "../migrate/detect.ts";
import {
  BLOCK_FILES,
  clearAgentTargets,
  MANIFEST_PATH,
  manifestText,
  openspecInit,
  setSourceGlobs,
  sha256,
  type Tool,
  UPGRADE_WORKFLOW,
  UPGRADE_WORKFLOW_NOTE,
} from "../migrate/install.ts";
import { openspecBinary } from "../openspec.ts";
import { LOCAL_SETTINGS, readLimit, writeLimit } from "../parallel/limit.ts";
import { SETTINGS_FILE } from "../permissions/render.ts";
import { planLines, syncPermissions } from "../permissions/sync.ts";
import { CONFIG_FILE, loadConfig, type Profile, parseProfile } from "../repo.ts";

export interface InitOptions {
  /** Git root of a repository holding the template's files. */
  root: string;
  tools: Tool[];
  /** `--profile`; without it, the value in specfold.yaml. */
  profile?: Profile | undefined;
  stack?: string | undefined;
  sourceGlobs?: string[] | undefined;
  /** `--max-subagents`; without it, 3 is set only when no limit exists yet. */
  maxSubagents?: number | undefined;
  /** `--upgrade-workflow`: turn on the weekly upgrade workflow. */
  upgradeWorkflow?: boolean | undefined;
}

export interface InitPlan {
  /** The profile init sets up. */
  profile: Profile;
  values: {
    /** null while the placeholder stays. */
    stack: { value: string | null; source: string };
    sourceGlobs: { value: string[]; source: string };
  };
  /** Files whose new text is already known: settings and markers. */
  edits: { path: string; action: string; text: string }[];
  /** Whether the OpenSpec skills are missing, so `openspec init` runs. */
  openspec: boolean;
  skipped: { path: string; reason: string }[];
  manifest: string;
  /** The subagent limit to write, or undefined to leave the current one. */
  limit: number | undefined;
}

export interface InitResult {
  actions: { path: string; action: string }[];
  skipped: { path: string; reason: string }[];
  /** What the user still has to run, such as `lefthook install`. */
  notes: string[];
}

const OPENSPEC_CONFIG = "openspec/config.yaml";
/** The subagent limit init sets when none exists; each person changes it with `specfold parallel set`. */
export const DEFAULT_LIMIT = 3;
const required = (profile: Profile) =>
  profile === "full" ? [CONFIG_FILE, OPENSPEC_CONFIG, MANIFEST_PATH] : [CONFIG_FILE, MANIFEST_PATH];
const PLACEHOLDER = "<filled by specfold init or sf-migrate>";
const STACK_LINE = /^(\s*)Stack: (.*)$/m;
const TEMPLATE_GLOBS = JSON.stringify(["src/**"]);

const openspecSkills = (tools: Tool[]) => [
  ".agents/skills/openspec-propose/SKILL.md",
  ...(tools.includes("claude") ? [".claude/skills/openspec-propose/SKILL.md"] : []),
];

interface ShippedManifest {
  kit_version?: string;
  ref?: string;
  files?: Record<string, string>;
  blocks?: Record<string, string>;
}

/** What init would change, without writing; refuses a repository without the template's files. */
export function planInit(o: InitOptions): InitPlan {
  const abs = (p: string) => join(o.root, p);
  const configured = existsSync(abs(CONFIG_FILE))
    ? parseProfile((parse(readFileSync(abs(CONFIG_FILE), "utf8")) as { profile?: unknown } | null)?.profile)
    : "full";
  const profile = o.profile ?? configured;
  const missing = required(profile).filter((p) => !existsSync(abs(p)));
  if (missing.length > 0)
    throw new EnvError(
      `not a Specfold template repository (missing ${missing.join(", ")}): copy the template files, or use sf-migrate for a repository with its own files`,
    );
  const read = (p: string) => readFileSync(abs(p), "utf8");
  // the knowledge profile never runs openspec init
  const openspec = profile === "full" && openspecSkills(o.tools).some((p) => !existsSync(abs(p)));
  if (openspec) {
    const bin = openspecBinary(o.root);
    try {
      execFileSync(bin.command, ["--version"], { stdio: "ignore" });
    } catch {
      throw new EnvError(`openspec is not installed (looked for ${bin.command}); init runs openspec init`);
    }
  }
  const plan: InitPlan = {
    profile,
    values: { stack: { value: null, source: "" }, sourceGlobs: { value: [], source: "" } },
    edits: [],
    openspec,
    skipped: [],
    manifest: "",
    limit: o.maxSubagents ?? (readLimit(o.root).value === undefined ? DEFAULT_LIMIT : undefined),
  };
  const edit = (path: string, before: string, after: string, action: string) => {
    if (after !== before) plan.edits.push({ path, action, text: after });
  };
  const found = detect(o.root);

  const detectedStack = found.stack.length > 0 ? found.stack.join(", ") : undefined;
  // the knowledge profile has no config.yaml to hold the stack: it is only printed
  const config = profile === "full" ? read(OPENSPEC_CONFIG) : undefined;
  const line = config === undefined ? null : STACK_LINE.exec(config);
  if (config === undefined) {
    const [value, source] =
      o.stack !== undefined
        ? [o.stack, "--stack; not written in the knowledge profile"]
        : detectedStack
          ? [detectedStack, "detected; not written in the knowledge profile"]
          : [null, "not detected"];
    plan.values.stack = { value, source };
  } else if (!line) {
    plan.skipped.push({ path: OPENSPEC_CONFIG, reason: "has no 'Stack:' line in its context" });
    plan.values.stack = { value: o.stack ?? null, source: "no Stack: line" };
  } else {
    const current = (line[2] as string).trim();
    const detected = detectedStack;
    const [value, source] =
      o.stack !== undefined
        ? [o.stack, "--stack"]
        : current !== PLACEHOLDER
          ? [current, "kept"]
          : detected
            ? [detected, "detected"]
            : [null, "not detected; placeholder kept"];
    plan.values.stack = { value, source };
    if (value !== null)
      edit(OPENSPEC_CONFIG, config, config.replace(STACK_LINE, `$1Stack: ${value}`), "fill");
  }

  const settings = read(CONFIG_FILE);
  const globs = (parse(settings) as { source_globs?: unknown }).source_globs;
  const current = Array.isArray(globs) ? globs.map(String) : [];
  const [value, source] =
    o.sourceGlobs !== undefined && o.sourceGlobs.length > 0
      ? [o.sourceGlobs, "--source-glob"]
      : JSON.stringify(current) !== TEMPLATE_GLOBS
        ? [current, "kept"]
        : found.globsFallback
          ? [current, "fallback: no code folder found"]
          : [found.sourceGlobs, "detected"];
  plan.values.sourceGlobs = { value, source };
  let nextSettings = source === "kept" ? settings : setSourceGlobs(settings, value);
  if (!o.tools.includes("claude")) nextSettings = clearAgentTargets(nextSettings);
  edit(CONFIG_FILE, settings, nextSettings, "fill");

  let shipped: ShippedManifest;
  try {
    shipped = JSON.parse(read(MANIFEST_PATH)) as ShippedManifest;
  } catch {
    throw new EnvError(`${MANIFEST_PATH} is not valid JSON: copy it from the template again`);
  }
  const blocks: Record<string, string> = {};
  for (const p of BLOCK_FILES) {
    const hash = shipped.blocks?.[p];
    if (hash === undefined || (p === "CLAUDE.md" && !o.tools.includes("claude"))) continue;
    if (!existsSync(abs(p))) {
      plan.skipped.push({ path: p, reason: "missing; left out of the manifest" });
      continue;
    }
    const text = read(p);
    const style = blockStyle(p);
    if (hasBlock(text, style)) blocks[p] = hash;
    else if (sha256(text) === hash) {
      edit(p, text, (applyBlock(undefined, text, style) as { text: string }).text, "block");
      blocks[p] = hash;
    } else
      plan.skipped.push({
        path: p,
        reason: "differs from the template; no markers added, left out of the manifest",
      });
  }
  const files = { ...(shipped.files ?? {}) };
  if (o.upgradeWorkflow) {
    const { shipped: from, active } = UPGRADE_WORKFLOW;
    if (!existsSync(abs(from)))
      plan.skipped.push({ path: active, reason: `${from} is missing; copy it from the template` });
    else {
      const text = read(from);
      if (!existsSync(abs(active)) || read(active) !== text)
        plan.edits.push({ path: active, action: "write", text });
      files[active] = sha256(text);
    }
  }
  plan.manifest = manifestText(shipped.kit_version ?? "", shipped.ref, { files, blocks });
  return plan;
}

/** Applies `plan`: settings and markers, the OpenSpec skills, skill links, permissions, git hooks and the manifest. */
export function runInit(o: InitOptions, plan: InitPlan): InitResult {
  const result: InitResult = { actions: [], skipped: [...plan.skipped], notes: [] };
  const act = (path: string, action: string) => result.actions.push({ path, action });
  for (const e of plan.edits) {
    mkdirSync(dirname(join(o.root, e.path)), { recursive: true });
    writeFileSync(join(o.root, e.path), e.text);
    act(e.path, e.action);
    if (e.path === UPGRADE_WORKFLOW.active) result.notes.push(UPGRADE_WORKFLOW_NOTE);
  }
  if (plan.openspec) {
    // openspec init keeps an existing config.yaml; restoring it guards against a version that does not
    const config = readFileSync(join(o.root, OPENSPEC_CONFIG), "utf8");
    openspecInit(o.root, o.tools);
    writeIfChanged(join(o.root, OPENSPEC_CONFIG), config);
    act("openspec/", `run openspec init --tools ${o.tools.join(",")}`);
  }
  const settings = loadConfig(o.root);
  const skills = listSkills(o.root);
  if (skills) {
    const links = planLinks(o.root, skills, settings.agentTargets).filter((l) => l.action !== "kept");
    applyLinks(o.root, links);
    for (const l of links) act(l.path, l.action);
  }
  const permissions = syncPermissions(settings, false);
  if (permissions.conflict)
    result.skipped.push({
      path: SETTINGS_FILE,
      reason: `permissions sync: ${SETTINGS_FILE} ${permissions.conflict}`,
    });
  else if (permissions.problems.length > 0)
    result.skipped.push({
      path: SETTINGS_FILE,
      reason: `permissions sync: ${planLines(permissions).join("; ")}`,
    });
  else if (permissions.text !== undefined)
    act(SETTINGS_FILE, `run permissions sync (${permissions.changes.length} rule changes)`);
  try {
    const hooks = installHooks(settings);
    for (const a of hooks.actions) act(a.path, a.action);
    if (hooks.next) result.notes.push(hooks.next);
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    result.skipped.push({ path: "git hooks", reason: error.message });
  }
  if (plan.limit !== undefined && writeLimit(o.root, plan.limit).length > 0)
    act(LOCAL_SETTINGS, `set subagent limit to ${plan.limit}`);
  if (writeIfChanged(join(o.root, MANIFEST_PATH), plan.manifest)) act(MANIFEST_PATH, "write");
  return result;
}
