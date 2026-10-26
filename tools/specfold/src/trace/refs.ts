import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { globToRegExp, walkFiles } from "../glob.ts";

const MAX_BYTES = 1024 * 1024;
// `openspec:` must not match, and an id always has a `#`
const REFERENCE = /(?<![\w-])spec:\s*([a-z0-9][a-z0-9/-]*#[a-z0-9-]+)/g;
const NEVER = /^(?:knowledge|openspec)\//;

export interface TestReference {
  id: string;
  /** Repository-relative test file. */
  file: string;
  line: number;
}

/** `spec: <id>` references in files matching the test globs, ordered by file and line. */
export function scanTestReferences(repoRoot: string, testGlobs: string[]): TestReference[] {
  const patterns = testGlobs.map(globToRegExp);
  const refs: TestReference[] = [];
  for (const file of walkFiles(repoRoot)) {
    if (NEVER.test(file) || !patterns.some((p) => p.test(file))) continue;
    const abs = join(repoRoot, file);
    if (statSync(abs).size > MAX_BYTES) continue;
    const text = readFileSync(abs, "utf8");
    if (text.includes("\0")) continue;
    text.split("\n").forEach((content, i) => {
      for (const match of content.matchAll(REFERENCE))
        refs.push({ id: match[1] as string, file, line: i + 1 });
    });
  }
  return refs;
}
