import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { type ParsedFile, parseFile, walk } from "../bundle.ts";
import type { Finding } from "../findings.ts";
import { walkFiles } from "../glob.ts";
import { scanReferences } from "../indexes/refs.ts";
import type { Config } from "../repo.ts";
import { bodyLinks } from "../validate/links.ts";
import { isConcept, isRecord } from "../validate/okf.ts";
import { isTimestamp } from "../validate/profile.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Concept {
  file: ParsedFile;
  data: Record<string, unknown>;
}

const finding = (rule: string, path: string, line: number | null, message: string, fix: string): Finding => ({
  rule,
  severity: "warning",
  path,
  line,
  message,
  fix,
});

function concepts(bundleRoot: string): Map<string, Concept> {
  const out = new Map<string, Concept>();
  for (const entry of walk(bundleRoot)) {
    if (entry.isDir || !entry.rel.endsWith(".md") || !isConcept(entry.rel)) continue;
    const file = parseFile(bundleRoot, entry.rel);
    const data = file.frontmatter?.data;
    if (isRecord(data)) out.set(entry.rel, { file, data });
  }
  return out;
}

/** Rules A1-A5 over the whole bundle and the main specs, as of `now`. */
export function auditBundle(config: Config, bundleRoot: string, now: Date): Finding[] {
  const all = concepts(bundleRoot);
  const findings: Finding[] = [];
  const line = (c: Concept, key: string) => c.file.frontmatter?.lineOf(key) ?? null;
  const toRel = (abs: string) => relative(bundleRoot, abs).split(sep).join("/");

  const incoming = new Set<string>();
  for (const [rel, c] of all) {
    // A1: stale.
    const stale = c.data.stale_after;
    if (isTimestamp(stale) && Date.parse(stale as string) < now.getTime())
      findings.push(
        finding(
          "A1",
          rel,
          line(c, "stale_after"),
          `stale since ${stale}`,
          "review the concept against its sources, then move stale_after forward or deprecate it",
        ),
      );

    // A2: unverified for too long.
    const at = isRecord(c.data.generated) ? c.data.generated.at : undefined;
    if (c.data.verified === undefined && isTimestamp(at)) {
      const days = Math.floor((now.getTime() - Date.parse(at as string)) / DAY_MS);
      if (days > config.unverifiedAfterDays)
        findings.push(
          finding(
            "A2",
            rel,
            line(c, "generated"),
            `unverified for ${days} days (limit ${config.unverifiedAfterDays})`,
            "have a human review it and run specfold verify, or deprecate it",
          ),
        );
    }

    // A3 and incoming links for A4.
    const deprecated = c.data.status === "deprecated";
    for (const link of bodyLinks(c.file, bundleRoot)) {
      if (!link.abs) continue;
      const target = toRel(link.abs);
      if (target !== rel) incoming.add(target);
      const linked = all.get(target);
      if (!deprecated && linked?.data.status === "deprecated")
        findings.push(
          finding(
            "A3",
            rel,
            link.line,
            `links to deprecated concept /${target}`,
            "link the concept that replaced it, or remove the link",
          ),
        );
    }
  }

  // A4: orphans.
  for (const ref of scanReferences(config.root, config.sourceGlobs)) incoming.add(ref.concept);
  for (const [rel, c] of all) {
    if (incoming.has(rel) || rel.startsWith("vision/")) continue;
    const spec = c.data.spec;
    if (c.data.type === "Capability" && typeof spec === "string" && existsSync(join(config.root, spec)))
      continue;
    findings.push(
      finding(
        "A4",
        rel,
        null,
        "no concept links here and no code references it",
        "link it from a related concept, or deprecate it",
      ),
    );
  }

  // A5: specs without a capability card.
  const carded = new Set(
    [...all.values()]
      .filter((c) => c.data.type === "Capability" && typeof c.data.spec === "string")
      .map((c) => c.data.spec as string),
  );
  const specsDir = join(config.root, "openspec", "specs");
  if (existsSync(specsDir)) {
    for (const rel of walkFiles(specsDir)) {
      if (!rel.endsWith("/spec.md")) continue;
      const spec = `openspec/specs/${rel}`;
      if (!carded.has(spec))
        findings.push(
          finding(
            "A5",
            spec,
            null,
            `spec '${rel.slice(0, -"/spec.md".length)}' has no capability card`,
            `create a Capability concept with spec: ${spec}`,
          ),
        );
    }
  }
  return findings;
}
