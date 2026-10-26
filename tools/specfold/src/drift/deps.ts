import { existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { parseFile, RESERVED, walk } from "../bundle.ts";
import { scanReferences } from "../indexes/refs.ts";
import { SCHEME } from "../validate/links.ts";
import { isRecord } from "../validate/okf.ts";

export interface ConceptDeps {
  /** Bundle-relative concept path. */
  rel: string;
  /** Repository-relative concept file. */
  file: string;
  data: Record<string, unknown>;
  /** Repository-relative files and folders the concept describes, sorted. */
  paths: string[];
}

const toRepo = (repoRoot: string, abs: string) => {
  const rel = relative(repoRoot, abs).split(sep).join("/");
  return rel === "" || rel.startsWith("../") || rel === ".." ? undefined : rel;
};

/** `resource` and `sources[].resource` values that resolve like rule L2 to existing repository paths. */
function resourcePaths(repoRoot: string, bundleRoot: string, rel: string, data: Record<string, unknown>) {
  const values: unknown[] = [data.resource];
  if (Array.isArray(data.sources)) for (const s of data.sources) if (isRecord(s)) values.push(s.resource);
  return values.flatMap((value) => {
    if (typeof value !== "string" || value.trim() === "" || SCHEME.test(value)) return [];
    const path = value.split("#")[0] ?? "";
    const abs = path.startsWith("/") ? join(bundleRoot, path) : join(bundleRoot, dirname(rel), path);
    const inRepo = existsSync(abs) ? toRepo(repoRoot, abs) : undefined;
    return inRepo ? [inRepo] : [];
  });
}

/** Every concept with the repository paths it depends on: its resources and the code that references it. */
export function conceptDependencies(
  repoRoot: string,
  bundleRoot: string,
  sourceGlobs: string[],
): ConceptDeps[] {
  const code = new Map<string, string[]>();
  for (const ref of scanReferences(repoRoot, sourceGlobs))
    code.set(ref.concept, [...(code.get(ref.concept) ?? []), ref.file]);
  const out: ConceptDeps[] = [];
  for (const entry of walk(bundleRoot)) {
    const name = entry.rel.slice(entry.rel.lastIndexOf("/") + 1);
    if (entry.isDir || !name.endsWith(".md") || RESERVED.has(name)) continue;
    const data = parseFile(bundleRoot, entry.rel).frontmatter?.data;
    if (!isRecord(data)) continue;
    const file = toRepo(repoRoot, join(bundleRoot, entry.rel)) ?? entry.rel;
    const paths = new Set([
      ...resourcePaths(repoRoot, bundleRoot, entry.rel, data),
      ...(code.get(entry.rel) ?? []),
    ]);
    paths.delete(file);
    out.push({ rel: entry.rel, file, data, paths: [...paths].sort() });
  }
  return out;
}

/** True when `file` is `path` or lies below the folder `path`. */
export const coveredBy = (file: string, path: string) => file === path || file.startsWith(`${path}/`);
