import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { register } from "../cli.ts";
import { countBySeverity, findingLine, plural, sortFindings } from "../findings.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { generateIndexes } from "./generate.ts";
import { locationsByConcept, scanReferences } from "./refs.ts";

/** Repository-relative paths of indexes that are missing or differ; writes them unless `check` is set. */
export function syncIndexes(
  repoRoot: string,
  bundleRoot: string,
  generated: Map<string, string>,
  check: boolean,
): string[] {
  const changed: string[] = [];
  for (const [rel, content] of [...generated].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const abs = join(bundleRoot, rel);
    if (existsSync(abs) && readFileSync(abs, "utf8") === content) continue;
    if (!check) writeFileSync(abs, content);
    changed.push(relative(repoRoot, abs).split(sep).join("/"));
  }
  return changed;
}

register({
  name: "index",
  summary: "generate every index.md of the knowledge bundle",
  usage: "specfold index [--check] [--bundle <dir>] [--json]",
  options: { check: { type: "boolean" }, bundle: { type: "string" }, json: { type: "boolean" } },
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
    const check = values.check === true;
    const changed = syncIndexes(config.root, bundleRoot, indexes, check);
    const written = check ? [] : changed;
    const outdated = check ? changed : [];
    const sorted = sortFindings(findings);
    const { errors, warnings } = countBySeverity(sorted);
    const ok = errors === 0 && outdated.length === 0;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, written, outdated, findings: sorted }, null, 2)}\n`);
    } else {
      const counted = check ? `${outdated.length} outdated` : `${written.length} written`;
      const lines = [
        ...written.map((p) => `wrote ${p}`),
        ...outdated.map((p) => `outdated ${p}`),
        ...sorted.filter((f) => f.severity === "error").map(findingLine),
        `${plural(indexes.size, "index")}, ${counted}: ${plural(errors, "error")}, ${plural(warnings, "warning")}`,
      ];
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
