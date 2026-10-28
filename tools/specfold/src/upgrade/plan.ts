// see knowledge: /decisions/upgrade-file-classes.md
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { applyBlock, blockStyle } from "../migrate/blocks.ts";
import { BLOCK_FILES, kitOwned, MANIFEST_PATH, sha256, type Tool } from "../migrate/install.ts";
import { type ConfigMerge, upgradeOpenspecConfig, upgradeSettings } from "./config.ts";
import { mergeThreeWay } from "./merge.ts";
import { compareVersions, isVersion } from "./version.ts";

export type FileAction = "add" | "replace" | "merge" | "remove" | "keep" | "conflict" | "unchanged";
export type BlockAction = "replace" | "merge" | "conflict" | "unmanaged" | "unchanged";

export interface FileStep {
  path: string;
  action: FileAction;
  /** Why the file is kept or in conflict. */
  reason?: string;
  /** What to write for add, replace, merge and a merge conflict. */
  data?: Buffer | string;
  /** File mode of a written file, from the new release. */
  mode?: number;
}

export interface BlockStep {
  path: string;
  action: BlockAction;
  reason?: string;
  /** The whole file after the block is replaced or merged. */
  text?: string;
}

export interface ConfigStep {
  path: string;
  action: "merge" | "unchanged" | "conflict";
  reason?: string;
  text?: string;
  /** What the merge left alone, such as an edited context. */
  notes: string[];
}

export interface InstalledManifest {
  kit_version?: string;
  ref?: string;
  files: Record<string, string>;
  blocks: Record<string, string>;
}

export interface UpgradePlan {
  from: string;
  to: string;
  files: FileStep[];
  blocks: BlockStep[];
  /** `.claude/settings.json` and `openspec/config.yaml`. */
  configs: ConfigStep[];
  /** Migration versions to run, in order. */
  migrations: string[];
  /** Upgrade notes of every version passed, oldest first. */
  notes: { version: string; text: string }[];
  /** File and block hashes to record once the plan is applied. */
  manifest: { files: Record<string, string>; blocks: Record<string, string> };
  /** Whether any file or block is left in conflict. */
  conflicts: boolean;
}

export interface PlanOptions {
  /** The Specfold root being upgraded. */
  root: string;
  /** The unpacked target release. */
  from: string;
  /** The unpacked installed release, when it could be fetched and checked. */
  base?: string | undefined;
  /** The installed version (`kit_version`). */
  installed: string;
  /** The target version. */
  target: string;
}

/** The manifest of the repository being upgraded; empty lists when there is none. */
export function readInstalled(root: string): InstalledManifest {
  try {
    const data = JSON.parse(readFileSync(join(root, MANIFEST_PATH), "utf8")) as Partial<InstalledManifest>;
    return { ...data, files: data.files ?? {}, blocks: data.blocks ?? {} };
  } catch {
    return { files: {}, blocks: {} };
  }
}

/** Claude Code is set up when the manifest lists `.claude/` files or the `CLAUDE.md` block. */
export const toolsOf = (m: InstalledManifest): Tool[] =>
  Object.keys(m.files).some((p) => p.startsWith(".claude/")) || "CLAUDE.md" in m.blocks
    ? ["agents", "claude"]
    : ["agents"];

const MARKERS = {
  markdown: ["<!-- specfold:start -->", "<!-- specfold:end -->"],
  hash: ["# specfold:start", "# specfold:end"],
} as const;

/** The text between Specfold's markers, or undefined when the file has no complete block. */
function blockContent(text: string, path: string): string | undefined {
  const [start, end] = MARKERS[blockStyle(path)];
  const lines = text.split("\n");
  const from = lines.findIndex((l) => l.trim() === start);
  const to = lines.findIndex((l, i) => i > from && l.trim() === end);
  return from === -1 || to === -1 ? undefined : lines.slice(from + 1, to).join("\n");
}

/** Whether block `content` (without a trailing newline) is what an install with hash `hash` wrote. */
const sameBlock = (content: string, hash: string | undefined) =>
  hash !== undefined && [content, `${content}\n`].some((c) => sha256(c) === hash);

/** Versions `v` with `installed < v <= target` among the names `<version>.<ext>` in `dir`, oldest first. */
function versionsIn(dir: string, ext: string, installed: string, target: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length))
    .filter(
      (v) =>
        isVersion(v) &&
        (!isVersion(installed) || compareVersions(v, installed) > 0) &&
        compareVersions(v, target) <= 0,
    )
    .sort(compareVersions);
}

/** What an upgrade from `o.base` to `o.from` changes in `o.root`, without writing anything. */
export function planUpgrade(o: PlanOptions): UpgradePlan {
  const installed = readInstalled(o.root);
  const tools = toolsOf(installed);
  const files: FileStep[] = [];
  const blocks: BlockStep[] = [];
  const manifest = { files: {} as Record<string, string>, blocks: {} as Record<string, string> };
  const local = (p: string) => join(o.root, p);
  const baseCopy = (p: string, hash: string | undefined) => {
    if (!o.base || hash === undefined || !existsSync(join(o.base, p))) return undefined;
    const data = readFileSync(join(o.base, p));
    return sha256(data) === hash ? data : undefined;
  };

  const shipped = new Set(kitOwned(o.from, tools));
  const paths = [...new Set([...shipped, ...Object.keys(installed.files)])].sort();
  for (const p of paths) {
    const recorded = installed.files[p];
    const exists = existsSync(local(p));
    const current = exists ? readFileSync(local(p)) : undefined;
    const changed = current !== undefined && sha256(current) !== recorded;
    if (!shipped.has(p)) {
      if (current === undefined) continue;
      if (!changed) files.push({ path: p, action: "remove" });
      else
        files.push({
          path: p,
          action: "keep",
          reason: "the new release no longer ships it, and it was changed here",
        });
      continue;
    }
    const next = readFileSync(join(o.from, p));
    const mode = statSync(join(o.from, p)).mode & 0o777;
    const hash = sha256(next);
    if (current === undefined) {
      files.push({ path: p, action: "add", data: next, mode });
    } else if (current.equals(next)) {
      files.push({ path: p, action: "unchanged" });
    } else if (!changed) {
      files.push({ path: p, action: "replace", data: next, mode });
    } else {
      const base = baseCopy(p, recorded);
      if (base === undefined) {
        files.push({
          path: p,
          action: "conflict",
          reason: "changed here, and the installed release's copy is not available to merge with",
        });
        if (recorded) manifest.files[p] = recorded;
        continue;
      }
      const merged = mergeThreeWay(current.toString("utf8"), base.toString("utf8"), next.toString("utf8"));
      files.push(
        merged.conflict
          ? {
              path: p,
              action: "conflict",
              reason: "changed here and in the new release; resolve the conflict markers",
              data: merged.text,
              mode,
            }
          : { path: p, action: "merge", data: merged.text, mode },
      );
    }
    manifest.files[p] = hash;
  }

  for (const p of BLOCK_FILES) {
    if (p === "CLAUDE.md" && !tools.includes("claude")) continue;
    if (!existsSync(join(o.from, p))) continue;
    const next = readFileSync(join(o.from, p), "utf8");
    const recorded = installed.blocks[p];
    const text = existsSync(local(p)) ? readFileSync(local(p), "utf8") : undefined;
    if (recorded === undefined) {
      if (text !== undefined)
        blocks.push({ path: p, action: "unmanaged", reason: "not in the manifest; left as it is" });
      continue;
    }
    const content = text === undefined ? undefined : blockContent(text, p);
    if (text === undefined || content === undefined) {
      blocks.push({
        path: p,
        action: "conflict",
        reason: text === undefined ? "missing" : "the specfold markers are gone",
      });
      manifest.blocks[p] = recorded;
      continue;
    }
    const style = blockStyle(p);
    const trimmed = next.replace(/\s+$/, "");
    if (content === trimmed) {
      blocks.push({ path: p, action: "unchanged" });
    } else if (sameBlock(content, recorded)) {
      const applied = applyBlock(text, next, style);
      blocks.push({ path: p, action: "replace", text: "text" in applied ? applied.text : text });
    } else {
      const base = o.base && existsSync(join(o.base, p)) ? readFileSync(join(o.base, p), "utf8") : undefined;
      if (base === undefined || sha256(base) !== recorded) {
        blocks.push({
          path: p,
          action: "conflict",
          reason:
            "the block was edited here, and the installed release's block is not available to merge with",
        });
        manifest.blocks[p] = recorded;
        continue;
      }
      const merged = mergeThreeWay(`${content}\n`, `${base.replace(/\s+$/, "")}\n`, `${trimmed}\n`);
      const applied = applyBlock(text, merged.text, style);
      blocks.push({
        path: p,
        action: merged.conflict ? "conflict" : "merge",
        ...(merged.conflict
          ? { reason: "edited here and in the new release; resolve the conflict markers" }
          : {}),
        text: "text" in applied ? applied.text : text,
      });
    }
    manifest.blocks[p] = sha256(next);
  }

  const configs: ConfigStep[] = [];
  type Merge = (local: string, base: string | undefined, next: string) => ConfigMerge;
  const merges: [string, Merge][] = [["openspec/config.yaml", upgradeOpenspecConfig]];
  if (tools.includes("claude")) merges.unshift([".claude/settings.json", upgradeSettings]);
  for (const [p, merge] of merges) {
    if (!existsSync(local(p)) || !existsSync(join(o.from, p))) continue;
    const base = o.base && existsSync(join(o.base, p)) ? readFileSync(join(o.base, p), "utf8") : undefined;
    const result = merge(readFileSync(local(p), "utf8"), base, readFileSync(join(o.from, p), "utf8"));
    if ("conflict" in result)
      configs.push({ path: p, action: "conflict", reason: result.conflict, notes: [] });
    else if (result.changed)
      configs.push({ path: p, action: "merge", text: result.text, notes: result.notes });
    else configs.push({ path: p, action: "unchanged", notes: result.notes });
  }

  const migrations = versionsIn(join(o.from, "upgrade/migrations"), ".mjs", o.installed, o.target);
  const notes = versionsIn(join(o.from, "upgrade/notes"), ".md", o.installed, o.target).map((version) => ({
    version,
    text: readFileSync(join(o.from, "upgrade/notes", `${version}.md`), "utf8").trimEnd(),
  }));
  return {
    from: o.installed,
    to: o.target,
    files,
    blocks,
    configs,
    migrations,
    notes,
    manifest,
    conflicts: [...files, ...blocks, ...configs].some((s) => s.action === "conflict"),
  };
}
