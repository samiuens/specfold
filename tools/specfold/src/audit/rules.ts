import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { type ParsedFile, parseFile, walk } from "../bundle.ts";
import { hasHistory } from "../drift/drift.ts";
import type { Finding } from "../findings.ts";
import { dueDate, listItems } from "../future/items.ts";
import { git } from "../git.ts";
import { walkFiles } from "../glob.ts";
import { scanReferences } from "../indexes/refs.ts";
import type { Config } from "../repo.ts";
import { bodyLinks } from "../validate/links.ts";
import { isConcept, isRecord } from "../validate/okf.ts";
import { isTimestamp } from "../validate/profile.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md"];
const EXEMPT_FOLDERS = ["vision/", "backlog/"];
// a bundle-absolute concept path, written as a link target or in backticks
const MENTION = /(?:^|[\s(`[])\/([a-z0-9][a-z0-9/-]*\.md)\b/g;

/** Concept paths named in the repository's root agent instruction files. */
function instructionMentions(repoRoot: string): string[] {
  return INSTRUCTION_FILES.filter((f) => existsSync(join(repoRoot, f))).flatMap((f) =>
    [...readFileSync(join(repoRoot, f), "utf8").matchAll(MENTION)].map((m) => m[1] as string),
  );
}

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

/** Rules A1-A8 over the whole bundle and the main specs, as of `now`. */
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
  for (const mention of instructionMentions(config.root)) incoming.add(mention);
  for (const [rel, c] of all) {
    if (incoming.has(rel) || EXEMPT_FOLDERS.some((f) => rel.startsWith(f))) continue;
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

  // A6 and A7: open commitments that are overdue or anchored to no vision.
  for (const item of listItems(bundleRoot, "commitments")) {
    if (item.data.state !== "open") continue;
    const c = all.get(item.rel);
    const due = dueDate(item.data.trigger);
    if (due && due.getTime() < now.getTime())
      findings.push(
        finding(
          "A6",
          item.rel,
          c ? line(c, "trigger") : null,
          `commitment was due on ${String(item.data.trigger)}`,
          "keep it with a change, or have a human withdraw it with specfold commitments withdraw",
        ),
      );
    if (item.data.vision === undefined)
      findings.push(
        finding(
          "A7",
          item.rel,
          null,
          "commitment links to no vision",
          "set 'vision' to the Vision concept this promise serves",
        ),
      );
  }

  // A8: open backlog items nobody has touched for too long.
  if (hasHistory(config.root)) {
    for (const item of listItems(bundleRoot, "backlog")) {
      if (item.data.state !== "open") continue;
      const file = relative(config.root, item.abs).split(sep).join("/");
      const last = git(config.root, ["log", "-1", "--format=%cI", "--", file]).trim();
      if (!last) continue;
      const days = Math.floor((now.getTime() - Date.parse(last)) / DAY_MS);
      if (days > config.backlogUntouchedDays)
        findings.push(
          finding(
            "A8",
            item.rel,
            null,
            `open backlog item untouched for ${days} days (limit ${config.backlogUntouchedDays})`,
            "promote it with specfold backlog promote, drop it with specfold backlog drop, or update it",
          ),
        );
    }
  }
  return findings;
}
