import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { register } from "../cli.ts";
import { countBySeverity, type Finding, findingLine, sortFindings } from "../findings.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { generateIndexes } from "./generate.ts";
import { locationsByConcept, scanReferences } from "./refs.ts";

export interface IndexResult {
  written: string[];
  findings: Finding[];
  total: number;
}

/** Regenerates every index and writes the ones that are missing or changed. Paths are repository-relative. */
export function writeIndexes(repoRoot: string, bundleRoot: string, generated: Map<string, string>): string[] {
  const written: string[] = [];
  for (const [rel, content] of [...generated].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const abs = join(bundleRoot, rel);
    if (existsSync(abs) && readFileSync(abs, "utf8") === content) continue;
    writeFileSync(abs, content);
    written.push(relative(repoRoot, abs).split(sep).join("/"));
  }
  return written;
}

register({
  name: "index",
  summary: "generate every index.md of the knowledge bundle",
  usage: "specfold index [--check] [--bundle <dir>] [--json]",
  options: { bundle: { type: "string" }, json: { type: "boolean" } },
  run: ({ io, values }) => {
    const config = requireConfig(io.cwd);
    const bundleRoot = resolveBundleRoot(io.cwd, values.bundle as string | undefined, config);
    const refs = scanReferences(config.root, config.sourceGlobs);
    const { indexes, findings, concepts } = generateIndexes(bundleRoot, config, locationsByConcept(refs));
    for (const ref of refs) {
      if (concepts.has(ref.concept)) continue;
      findings.push({
        rule: "I2",
        severity: "warning",
        path: ref.file,
        line: ref.line,
        message: `reference to missing concept /${ref.concept}`,
        fix: "point the comment at an existing concept or create it",
      });
    }
    const written = writeIndexes(config.root, bundleRoot, indexes);
    const sorted = sortFindings(findings);
    const { errors, warnings } = countBySeverity(sorted);
    if (values.json) {
      io.stdout(
        `${JSON.stringify({ ok: errors === 0, written, outdated: [], findings: sorted }, null, 2)}\n`,
      );
    } else {
      const lines = [
        ...written.map((p) => `wrote ${p}`),
        ...sorted.filter((f) => f.severity === "error").map(findingLine),
        `${indexes.size} indexes, ${written.length} written: ${errors} errors, ${warnings} warnings`,
      ];
      io.stdout(`${lines.join("\n")}\n`);
    }
    return errors > 0 ? 1 : 0;
  },
});
