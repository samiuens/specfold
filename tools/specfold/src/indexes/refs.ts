import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { globToRegExp, walkFiles } from "../glob.ts";

const MAX_BYTES = 1024 * 1024;
// comma-separated bundle-absolute .md paths; the label after " - " ends the list
const PATH = String.raw`\/[^\s"'\`),]+\.md`;
const REFERENCE = new RegExp(String.raw`see knowledge:\s+(${PATH}(?:\s*,\s*${PATH})*)`, "g");

export interface CodeReference {
  /** Bundle-relative concept path, without the leading slash. */
  concept: string;
  /** Repository-relative source file. */
  file: string;
  line: number;
}

/** Finds `see knowledge:` references in files matching the source globs, ordered by file and line. */
export function scanReferences(repoRoot: string, sourceGlobs: string[]): CodeReference[] {
  if (sourceGlobs.length === 0) return [];
  const patterns = sourceGlobs.map(globToRegExp);
  const refs: CodeReference[] = [];
  for (const file of walkFiles(repoRoot)) {
    if (!patterns.some((p) => p.test(file))) continue;
    const abs = join(repoRoot, file);
    if (statSync(abs).size > MAX_BYTES) continue;
    const text = readFileSync(abs, "utf8");
    if (text.includes("\0")) continue;
    text.split("\n").forEach((content, i) => {
      for (const match of content.matchAll(REFERENCE)) {
        for (const path of (match[1] ?? "").split(",")) {
          refs.push({ concept: path.trim().slice(1), file, line: i + 1 });
        }
      }
    });
  }
  return refs;
}

/** Groups references as `path:line` strings per concept, keeping file and line order. */
export function locationsByConcept(refs: CodeReference[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of refs) map.set(r.concept, [...(map.get(r.concept) ?? []), `${r.file}:${r.line}`]);
  return map;
}
