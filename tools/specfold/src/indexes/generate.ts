import { basename, relative, sep } from "node:path";
import { parseFile, RESERVED, walk } from "../bundle.ts";
import type { Finding } from "../findings.ts";
import type { Config } from "../repo.ts";

export const LOG_ENTRY = "* [Log](log.md) - Dated record of changes to this bundle";

interface Concept {
  file: string;
  type: string;
  title: string;
  description: string | undefined;
  deprecated: boolean;
}

export interface Generated {
  /** Expected content per index, keyed by bundle-relative path (`index.md`, `decisions/index.md`). */
  indexes: Map<string, string>;
  findings: Finding[];
  /** Bundle-relative paths of every concept that made it into an index. */
  concepts: Set<string>;
}

const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const oneLine = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.replace(/\s+/g, " ").trim() : undefined;

export function folderTitle(config: Config, folder: string, fallbackName: string): string {
  const configured = config.folders[folder]?.title;
  if (configured) return configured;
  const words = fallbackName.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds the content of every index.md from the bundle tree and concept frontmatter.
 * `refs` maps bundle-relative concept paths to sorted `path:line` code locations.
 */
export function generateIndexes(
  bundleRoot: string,
  config: Config,
  refs: Map<string, string[]> = new Map(),
): Generated {
  const entries = walk(bundleRoot);
  const folders = ["", ...entries.filter((e) => e.isDir).map((e) => e.rel)];
  const repoRel = (rel: string) => relative(config.root, `${bundleRoot}${sep}${rel}`).split(sep).join("/");
  const findings: Finding[] = [];
  const concepts = new Set<string>();
  const indexes = new Map<string, string>();
  const typeOrder = (t: string) => {
    const i = config.types.indexOf(t);
    return i === -1 ? config.types.length : i;
  };

  for (const folder of folders) {
    const prefix = folder ? `${folder}/` : "";
    const children = entries.filter(
      (e) => e.rel.startsWith(prefix) && !e.rel.slice(prefix.length).includes("/"),
    );
    const subfolders = children.filter((e) => e.isDir).map((e) => e.rel);
    const items: Concept[] = [];
    for (const child of children) {
      const name = child.rel.slice(prefix.length);
      if (child.isDir || !name.endsWith(".md") || RESERVED.has(name)) continue;
      const parsed = parseFile(bundleRoot, child.rel);
      const data = parsed.frontmatter?.data;
      const type = isRecord(data) ? oneLine(data.type) : undefined;
      if (!isRecord(data) || type === undefined) {
        const why = parsed.frontmatterError
          ? `invalid frontmatter: ${parsed.frontmatterError.message}`
          : "no frontmatter or no 'type'";
        findings.push({
          rule: "I1",
          severity: "error",
          path: repoRel(child.rel),
          line: parsed.frontmatterError?.line ?? 1,
          message: `left out of the index: ${why}`,
          fix: "fix the frontmatter; 'specfold validate' shows the details",
        });
        continue;
      }
      concepts.add(child.rel);
      items.push({
        file: name,
        type,
        title: oneLine(data.title) ?? name.slice(0, -3),
        description: oneLine(data.description),
        deprecated: data.status === "deprecated",
      });
    }

    const blocks: string[] = [];
    if (subfolders.length > 0) {
      const lines = subfolders.map((sub) => {
        const name = sub.slice(prefix.length);
        const description = config.folders[sub]?.description;
        return `* [${folderTitle(config, sub, name)}](${name}/)${description ? ` - ${description}` : ""}`;
      });
      blocks.push(["# Sections", "", ...lines].join("\n"));
    }
    const types = [...new Set(items.map((i) => i.type))].sort(
      (a, b) => typeOrder(a) - typeOrder(b) || byCodeUnit(a, b),
    );
    for (const type of types) {
      const group = items
        .filter((i) => i.type === type)
        .sort(
          (a, b) => byCodeUnit(a.title.toLowerCase(), b.title.toLowerCase()) || byCodeUnit(a.file, b.file),
        );
      const lines = group.flatMap((i) => [
        `* [${i.title}](${i.file})${i.deprecated ? " (deprecated)" : ""}${i.description ? ` - ${i.description}` : ""}`,
        ...(refs.get(`${prefix}${i.file}`) ?? []).map((loc) => `  * Referenced from code: ${loc}`),
      ]);
      blocks.push([`# ${type}`, "", ...lines].join("\n"));
    }
    const hasLog = folder === "" && entries.some((e) => !e.isDir && e.rel === "log.md");
    if (blocks.length === 0) {
      const title = folder
        ? folderTitle(config, folder, folder.slice(folder.lastIndexOf("/") + 1))
        : folderTitle(config, "", basename(bundleRoot));
      blocks.push(`# ${title}\n\nNo concepts yet.`);
    }
    if (hasLog) blocks.push(`# Log\n\n${LOG_ENTRY}`);
    if (folder === "") blocks.unshift('---\nokf_version: "0.2"\n---');
    indexes.set(`${prefix}index.md`, `${blocks.join("\n\n")}\n`);
  }
  return { indexes, findings, concepts };
}
