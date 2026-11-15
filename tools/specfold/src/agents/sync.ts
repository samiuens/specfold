import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { EnvError } from "../errors.ts";
import { OMP_CONFIG, ompConfigText, readOmpConfig } from "../omp/config.ts";
import type { Config } from "../repo.ts";
import {
  CLAUDE_AGENTS,
  OMP_AGENTS,
  type PlannedRole,
  type PlannedSetting,
  planRoles,
  setTaskSettings,
} from "./omp.ts";

export const SKILLS_DIR = ".agents/skills";

export type LinkAction = "link" | "relink" | "unlink" | "kept";

export interface PlannedLink {
  /** Repository-relative path of the link, with forward slashes. */
  path: string;
  action: LinkAction;
  /** The link target to write (link, relink), the target being removed (unlink), or the existing target of a kept symlink. */
  target: string | null;
}

const posix = (p: string) => p.split(sep).join("/");

/** Skill folders in `.agents/skills/`, sorted; undefined when the folder does not exist. */
export function listSkills(repoRoot: string): string[] | undefined {
  const dir = join(repoRoot, SKILLS_DIR);
  if (!existsSync(dir)) return undefined;
  return readdirSync(dir)
    .filter((name) => !name.startsWith(".") && statSync(join(dir, name)).isDirectory())
    .sort();
}

function entryKind(path: string): "missing" | "symlink" | "other" {
  try {
    return lstatSync(path).isSymbolicLink() ? "symlink" : "other";
  } catch {
    return "missing";
  }
}

/** Compares each target folder with the skills and returns the actions that bring them in line. */
export function planLinks(repoRoot: string, skills: string[], targets: string[]): PlannedLink[] {
  const skillsRoot = resolve(repoRoot, SKILLS_DIR);
  const own = (resolved: string) => resolved.startsWith(`${skillsRoot}${sep}`);
  const out: PlannedLink[] = [];
  for (const target of [...targets].sort()) {
    const dir = resolve(repoRoot, target);
    for (const name of skills) {
      const link = join(dir, name);
      const path = posix(relative(repoRoot, link));
      const expected = posix(relative(dir, join(skillsRoot, name)));
      const kind = entryKind(link);
      if (kind === "missing") out.push({ path, action: "link", target: expected });
      else if (kind === "other") out.push({ path, action: "kept", target: null });
      else {
        const current = readlinkSync(link);
        if (current === expected) continue;
        out.push(
          own(resolve(dir, current))
            ? { path, action: "relink", target: expected }
            : { path, action: "kept", target: current },
        );
      }
    }
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (skills.includes(name)) continue;
      const link = join(dir, name);
      if (entryKind(link) !== "symlink") continue;
      const current = readlinkSync(link);
      if (own(resolve(dir, current)))
        out.push({ path: posix(relative(repoRoot, link)), action: "unlink", target: current });
    }
  }
  return out;
}

/** Writes the planned link, relink and unlink actions; kept entries are never touched. */
export function applyLinks(repoRoot: string, plan: PlannedLink[]): void {
  for (const step of plan) {
    const link = join(repoRoot, step.path);
    try {
      if (step.action === "relink" || step.action === "unlink") unlinkSync(link);
      if (step.action === "link" || step.action === "relink") {
        mkdirSync(join(link, ".."), { recursive: true });
        symlinkSync(step.target as string, link, "dir");
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "error";
      throw new EnvError(
        `cannot ${step.action} ${step.path} (${code}): symlinks must be allowed in this repository`,
      );
    }
  }
}

/** The `*.md` files of a repository folder by name without the extension; empty when the folder is missing. */
function readRoleFolder(repoRoot: string, folder: string): Record<string, string> {
  const dir = join(repoRoot, folder);
  const out: Record<string, string> = {};
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir).sort()) {
    const path = join(dir, file);
    if (file.endsWith(".md") && statSync(path).isFile())
      out[file.slice(0, -".md".length)] = readFileSync(path, "utf8");
  }
  return out;
}

export interface OmpPlan {
  roles: PlannedRole[];
  settings: PlannedSetting[];
  /** The new `.omp/config.yml` text when a setting changes. */
  configText: string | undefined;
}

/**
 * The omp roles and task settings to bring in line. Without `omp` in `tools`, own roles are removed and
 * `.omp/config.yml` is not read. see knowledge: /references/omp.md
 */
export function planOmp(config: Config): OmpPlan {
  const listed = config.tools.includes("omp");
  const roles = planRoles(
    readRoleFolder(config.root, CLAUDE_AGENTS),
    readRoleFolder(config.root, OMP_AGENTS),
    listed,
  );
  if (!listed) return { roles, settings: [], configText: undefined };
  const doc = readOmpConfig(config.root);
  const settings = setTaskSettings(doc);
  return { roles, settings, configText: settings.length > 0 ? ompConfigText(doc) : undefined };
}

/** Writes, rewrites and removes the planned role files and writes `.omp/config.yml` when a setting changed. */
export function applyOmp(repoRoot: string, plan: OmpPlan): void {
  for (const step of plan.roles) {
    const path = join(repoRoot, step.path);
    if (step.action === "remove") rmSync(path);
    else if (step.text !== undefined) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, step.text);
    }
  }
  if (plan.configText !== undefined) {
    const path = join(repoRoot, OMP_CONFIG);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, plan.configText);
  }
}
