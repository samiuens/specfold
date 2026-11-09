import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { applyLinks, listSkills, planLinks } from "../agents/sync.ts";
import { EnvError, UsageError } from "../errors.ts";
import { installHooks, writeIfChanged } from "../hooks/install.ts";
import { openspecBinary } from "../openspec.ts";
import { SETTINGS_FILE } from "../permissions/render.ts";
import { planLines, syncPermissions } from "../permissions/sync.ts";
import { profileFiles } from "../profile.ts";
import { CONFIG_FILE, loadConfig, type Profile, parseProfile } from "../repo.ts";
import { applyBlock, blockStyle, type Merged } from "./blocks.ts";
import { detect } from "./detect.ts";
import { fillStack, mergeOpenspecConfig, mergeSettings } from "./merge.ts";

export const TOOLS = ["agents", "claude"] as const;
export type Tool = (typeof TOOLS)[number];
export const MANIFEST_PATH = ".specfold/manifest.json";

/** The weekly upgrade workflow: shipped inactive, turned on by copying it to `active`. */
export const UPGRADE_WORKFLOW = {
  shipped: ".specfold/workflows/specfold-upgrade.yml",
  active: ".github/workflows/specfold-upgrade.yml",
} as const;
export const UPGRADE_WORKFLOW_NOTE =
  "add the SPECFOLD_TOKEN secret (Settings > Secrets and variables > Actions): a token that can read the Specfold kit's releases and write contents, pull requests and workflows in this repository; a fine-grained token works when both repositories have the same owner, otherwise use a classic token with repo and workflow";

/** The `--tools` value of migrate install and init; `agents` is always set up. */
export function parseTools(value: string | undefined): Tool[] {
  if (value === undefined) return [...TOOLS];
  const tools = value.split(",").map((t) => t.trim());
  const unknown = tools.filter((t) => !(TOOLS as readonly string[]).includes(t));
  if (unknown.length > 0 || !tools.includes("agents"))
    throw new UsageError(`--tools takes 'agents' or 'agents,claude', got '${value}'`);
  return tools as Tool[];
}

export interface InstallOptions {
  /** Git root of the repository being migrated. */
  root: string;
  /** Unpacked template folder. */
  from: string;
  tools: Tool[];
  /** `--profile`; the file set and block variants to install. Defaults to full. */
  profile?: Profile | undefined;
  stack?: string | undefined;
  sourceGlobs?: string[] | undefined;
  ref?: string | undefined;
  /** `--upgrade-workflow`: turn on the weekly upgrade workflow. */
  upgradeWorkflow?: boolean | undefined;
}

export interface InstallResult {
  actions: { path: string; action: string }[];
  conflicts: { path: string; reason: string }[];
  /** What the user still has to run, such as `lefthook install`. */
  notes: string[];
}

const REQUIRED = [CONFIG_FILE, "scripts/specfold.mjs", "openspec/schemas/specfold"];
export const BLOCK_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/pull_request_template.md",
  ".gitignore",
  ".github/CODEOWNERS",
  ".gitattributes",
  ".worktreeinclude",
];
export const sha256 = (data: string | Buffer) => `sha256:${createHash("sha256").update(data).digest("hex")}`;

/** Every file below `dir` (dot files included) as a path relative to `base`, sorted. */
export function filesUnder(base: string, dir: string): string[] {
  const abs = join(base, dir);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return [dir];
  return readdirSync(abs, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory() ? filesUnder(base, `${dir}/${d.name}`) : d.isFile() ? [`${dir}/${d.name}`] : [],
    )
    .sort();
}

/**
 * The files only the kit changes: the CLI, the schema, the skills, the gate workflows, the inactive
 * upgrade workflow, the profile block variants and the subagents, limited to the profile's file set.
 */
export function kitOwned(from: string, tools: Tool[], profile: Profile = "full"): string[] {
  const paths = [
    "scripts/specfold.mjs",
    "openspec/schemas/specfold",
    ".agents/skills",
    ".specfold/workflows",
    ".specfold/profiles",
    ".github/workflows/specfold-gate.yml",
    ".github/workflows/specfold-gate-comment.yml",
    ...(tools.includes("claude") ? [".claude/agents"] : []),
  ].flatMap((p) => filesUnder(from, p));
  return profileFiles(paths, profile);
}

export interface Manifest {
  files: Record<string, string>;
  blocks: Record<string, string>;
  /** The installed profile; a manifest without one is a full install. */
  profile?: Profile;
}

/** The file and block hashes of an earlier install; empty when there is none or it cannot be read. */
export function readManifest(path: string): Manifest {
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as Partial<Manifest>;
    return {
      files: data.files ?? {},
      blocks: data.blocks ?? {},
      ...(data.profile === "knowledge" || data.profile === "full" ? { profile: data.profile } : {}),
    };
  } catch {
    return { files: {}, blocks: {} };
  }
}

/** The profile to install: `--profile`, else the existing settings' value, else full; a differing flag fails. */
export function installProfile(root: string, flag: Profile | undefined): Profile {
  const path = join(root, CONFIG_FILE);
  if (!existsSync(path)) return flag ?? "full";
  const data = parse(readFileSync(path, "utf8")) as { profile?: unknown } | null;
  const current = parseProfile(data?.profile);
  if (flag !== undefined && flag !== current)
    throw new EnvError(
      `${CONFIG_FILE} sets profile '${current}' but --profile is '${flag}'; switching profiles at install is not supported`,
    );
  return current;
}

/** Fails before any write when the template folder is incomplete or OpenSpec is needed but missing. */
function preflight(o: InstallOptions, profile: Profile): void {
  const missing = REQUIRED.filter((p) => !existsSync(join(o.from, p)));
  if (missing.length > 0)
    throw new EnvError(`--from ${o.from} is not a Specfold template folder: missing ${missing.join(", ")}`);
  if (profile === "knowledge" || existsSync(join(o.root, "openspec/config.yaml"))) return;
  const bin = openspecBinary(o.root);
  try {
    execFileSync(bin.command, ["--version"], { stdio: "ignore" });
  } catch {
    throw new EnvError(
      `openspec is not installed (looked for ${bin.command}); it sets up openspec/ for this repository`,
    );
  }
}

export function openspecInit(root: string, tools: Tool[]): void {
  const bin = openspecBinary(root);
  try {
    execFileSync(bin.command, ["init", "--tools", tools.join(",")], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });
  } catch (error) {
    const reason = String((error as { stderr?: unknown }).stderr ?? "")
      .trim()
      .split("\n")
      .at(-1);
    throw new EnvError(`openspec init failed${reason ? `: ${reason}` : ""}`);
  }
}

// line edits keep the template's comments and its JSON-style lists
export const setSourceGlobs = (text: string, globs: string[]) =>
  text.replace(/^source_globs:.*$/m, `source_globs: ${JSON.stringify(globs)}`);

/** No skill link targets: the repository does not use Claude Code. */
export const clearAgentTargets = (text: string) =>
  text.replace(/^(agents:\n(?:#.*\n)*\s+targets:).*$/m, "$1 []");

/** `profile` set to a value: the existing line replaced, or a line added after `kit_version`. */
export function setProfile(text: string, profile: Profile): string {
  if (/^profile:.*$/m.test(text)) return text.replace(/^profile:[^\n#]*/m, `profile: ${profile}`);
  return text.replace(/^(kit_version:.*\n)/m, `$1profile: ${profile}\n`);
}

/** `gate.escape_label` set to a value, keeping the line's comment. */
export const setEscapeLabel = (text: string, label: string) =>
  text.replace(/^(\s+escape_label:)[ \t]*[^\s#]+/m, `$1 ${label}`);

/** The template's specfold.yaml with this repository's source globs and profile, and no skill targets without Claude Code. */
function projectSettings(text: string, globs: string[], tools: Tool[], profile: Profile): string {
  let out = setSourceGlobs(text, globs);
  if (profile === "knowledge") out = setEscapeLabel(setProfile(out, profile), "no-knowledge");
  return tools.includes("claude") ? out : clearAgentTargets(out);
}

/** The manifest's text: sorted keys and no time, so an unchanged install writes the same bytes. */
export function manifestText(
  kitVersion: string,
  ref: string | undefined,
  m: Manifest,
  profile: Profile = "full",
): string {
  const sorted = (r: Record<string, string>) =>
    Object.fromEntries(Object.entries(r).sort(([a], [b]) => (a < b ? -1 : 1)));
  return `${JSON.stringify(
    {
      manifest_version: 1,
      kit_version: kitVersion,
      profile,
      ...(ref ? { ref } : {}),
      files: sorted(m.files),
      blocks: sorted(m.blocks),
    },
    null,
    2,
  )}\n`;
}

/** Folder of the template holding a profile's block variants. */
export const profileDir = (profile: Profile) => `.specfold/profiles/${profile}`;

/** The template's block content for a profile: its variant when the template ships one, else the full file. */
export function blockContent(from: string, path: string, profile: Profile): string {
  const variant = join(from, profileDir(profile), path);
  return readFileSync(profile !== "full" && existsSync(variant) ? variant : join(from, path), "utf8");
}

/** Whether a line `@AGENTS.md` stands outside Specfold's managed block. */
function importsAgentsOutside(text: string): boolean {
  let inside = false;
  for (const l of text.split("\n").map((x) => x.trim())) {
    if (l === "<!-- specfold:start -->") inside = true;
    else if (l === "<!-- specfold:end -->") inside = false;
    else if (!inside && l === "@AGENTS.md") return true;
  }
  return false;
}

/** Installs the kit into `o.root` without overwriting anything the repository already has. */
export function installKit(o: InstallOptions): InstallResult {
  const profile = installProfile(o.root, o.profile);
  preflight(o, profile);
  const result: InstallResult = { actions: [], conflicts: [], notes: [] };
  const act = (path: string, action: string) => result.actions.push({ path, action });
  const conflict = (path: string, reason: string) => result.conflicts.push({ path, reason });
  const abs = (p: string) => join(o.root, p);
  const read = (p: string) => (existsSync(abs(p)) ? readFileSync(abs(p), "utf8") : undefined);
  const template = (p: string) => readFileSync(join(o.from, p), "utf8");
  const put = (p: string, data: string | Buffer, mode?: number) => {
    mkdirSync(dirname(abs(p)), { recursive: true });
    writeFileSync(abs(p), data);
    if (mode !== undefined) chmodSync(abs(p), mode);
  };
  const merged = (p: string, m: Merged, action: string) => {
    if ("conflict" in m) conflict(p, m.conflict);
    else if (m.changed) {
      put(p, m.text);
      act(p, action);
    }
    return !("conflict" in m);
  };
  const manifest = { files: {} as Record<string, string>, blocks: {} as Record<string, string> };
  // a file in conflict keeps the hash it was installed with: the base of a later three-way upgrade
  const previous = readManifest(abs(MANIFEST_PATH));
  const claude = o.tools.includes("claude");
  const found = detect(o.root);
  const stack = o.stack ?? (found.stack.length > 0 ? found.stack.join(", ") : undefined);

  // openspec init runs on a repository without openspec/ before anything else is written there;
  // the knowledge profile leaves openspec/ alone
  const openspec = profile === "full";
  const freshOpenspec = openspec && !existsSync(abs("openspec/config.yaml"));
  if (freshOpenspec) {
    openspecInit(o.root, o.tools);
    act("openspec/", `run openspec init --tools ${o.tools.join(",")}`);
  }

  for (const p of kitOwned(o.from, o.tools, profile)) {
    const data = readFileSync(join(o.from, p));
    if (!existsSync(abs(p))) {
      put(p, data, statSync(join(o.from, p)).mode & 0o777);
      act(p, "write");
    } else if (!readFileSync(abs(p)).equals(data)) {
      conflict(p, "differs from the kit's copy; left unchanged");
      if (previous.files[p]) manifest.files[p] = previous.files[p];
      continue;
    }
    manifest.files[p] = sha256(data);
  }

  // the upgrade workflow is on with the flag, or when an earlier install turned it on
  const workflow = join(o.from, UPGRADE_WORKFLOW.shipped);
  if ((o.upgradeWorkflow || previous.files[UPGRADE_WORKFLOW.active]) && existsSync(workflow)) {
    const p = UPGRADE_WORKFLOW.active;
    const data = readFileSync(workflow);
    if (!existsSync(abs(p))) {
      put(p, data);
      act(p, "write");
      result.notes.push(UPGRADE_WORKFLOW_NOTE);
      manifest.files[p] = sha256(data);
    } else if (!readFileSync(abs(p)).equals(data)) {
      conflict(p, "differs from the kit's copy; left unchanged");
      if (previous.files[p]) manifest.files[p] = previous.files[p];
    } else manifest.files[p] = sha256(data);
  }

  for (const p of BLOCK_FILES) {
    if (p === "CLAUDE.md" && !claude) continue;
    const content = blockContent(o.from, p, profile);
    const existing = read(p);
    // a bare import outside the block already does the block's job; text outside the markers stays untouched
    const body =
      p === "CLAUDE.md" && existing !== undefined && importsAgentsOutside(existing)
        ? content.replace(/^@AGENTS\.md\n+/m, "")
        : content;
    if (merged(p, applyBlock(existing, body, blockStyle(p)), "block")) manifest.blocks[p] = sha256(content);
    else if (previous.blocks[p]) manifest.blocks[p] = previous.blocks[p];
  }
  if (claude) {
    const current = read(".claude/settings.json");
    const settings = mergeSettings(current, template(".claude/settings.json"));
    merged(".claude/settings.json", settings, current === undefined ? "write" : "merge");
  }

  if (read(CONFIG_FILE) === undefined) {
    put(
      CONFIG_FILE,
      projectSettings(template(CONFIG_FILE), o.sourceGlobs ?? found.sourceGlobs, o.tools, profile),
    );
    act(CONFIG_FILE, "write");
  }
  for (const p of filesUnder(o.from, "knowledge"))
    if (!existsSync(abs(p))) {
      put(p, readFileSync(join(o.from, p)));
      act(p, "write");
    }

  const config = template("openspec/config.yaml");
  if (freshOpenspec) {
    put("openspec/config.yaml", fillStack(config, stack));
    act("openspec/config.yaml", "write");
  } else if (openspec) {
    merged(
      "openspec/config.yaml",
      mergeOpenspecConfig(read("openspec/config.yaml") as string, config, stack),
      "merge",
    );
  }

  const settings = loadConfig(o.root);
  const skills = listSkills(o.root);
  if (skills) {
    const links = planLinks(o.root, skills, settings.agentTargets).filter((l) => l.action !== "kept");
    applyLinks(o.root, links);
    for (const l of links) act(l.path, l.action);
  }
  // the sync settles the rules it owns after the merge; an invalid setting leaves the file as merged
  if (claude) {
    const permissions = syncPermissions(settings, false);
    if (permissions.conflict) conflict(SETTINGS_FILE, `permissions sync: ${permissions.conflict}`);
    else if (permissions.problems.length > 0)
      conflict(SETTINGS_FILE, `permissions sync: ${planLines(permissions).join("; ")}`);
    else if (permissions.text !== undefined) act(SETTINGS_FILE, "run permissions sync");
  }
  try {
    const hooks = installHooks(settings);
    for (const a of hooks.actions) act(a.path, a.action);
    if (hooks.next) result.notes.push(hooks.next);
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    conflict("git hooks", error.message);
  }

  const kitVersion = String((parse(template(CONFIG_FILE)) as { kit_version?: unknown }).kit_version ?? "");
  const text = manifestText(kitVersion, o.ref, manifest, profile);
  if (writeIfChanged(abs(MANIFEST_PATH), text)) act(MANIFEST_PATH, "write");
  return result;
}
