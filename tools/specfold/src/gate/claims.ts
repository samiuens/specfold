import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseText } from "../bundle.ts";
import { git } from "../git.ts";
import { isConcept, isRecord } from "../validate/okf.ts";
import type { GateDiff } from "./diff.ts";

export interface Claim {
  /** The login after `human:`, as written. */
  login: string;
  /** Repository-relative file. */
  file: string;
  line: number | null;
  key: "verified" | "confirmed_by";
}

const BRIEF = /^openspec\/changes\/(?:archive\/)?[^/]+\/brief\.md$/;
const ARCHIVED_BRIEF = /^openspec\/changes\/archive\/\d{4}-\d{2}-\d{2}-([^/]+)\/brief\.md$/;
const CONFIRMED_BY = /^confirmed_by:[ \t]*(\S+)/;

/** `human:` actors in a concept's `verified` (a mapping or a list of mappings), with the key's line. */
function verifiedClaims(file: string, text: string): Claim[] {
  const fm = parseText(file, text).frontmatter;
  if (!fm || !isRecord(fm.data)) return [];
  const verified = fm.data.verified;
  const entries = Array.isArray(verified) ? verified : verified === undefined ? [] : [verified];
  return entries.flatMap((e) =>
    isRecord(e) && typeof e.by === "string" && e.by.startsWith("human:")
      ? [{ login: e.by.slice("human:".length), file, line: fm.lineOf("verified"), key: "verified" as const }]
      : [],
  );
}

/** A brief's `confirmed_by` when it names a human. */
function briefClaims(file: string, text: string): Claim[] {
  const lines = text.split(/\r?\n/);
  return lines.flatMap((l, i) => {
    const by = CONFIRMED_BY.exec(l)?.[1];
    return by?.startsWith("human:")
      ? [{ login: by.slice("human:".length), file, line: i + 1, key: "confirmed_by" as const }]
      : [];
  });
}

function baseVersion(root: string, mergeBase: string, file: string): string | undefined {
  try {
    return git(root, ["show", `${mergeBase}:./${file}`]);
  } catch {
    return undefined;
  }
}

/** Human claims in changed concepts and briefs that the merge-base version of the same file lacks. */
export function addedClaims(root: string, bundleRoot: string, diff: GateDiff): Claim[] {
  const bundlePrefix = `${relative(root, bundleRoot).split(sep).join("/")}/`;
  const out: Claim[] = [];
  for (const file of diff.files) {
    const abs = join(root, file);
    if (!existsSync(abs)) continue;
    let extract: ((file: string, text: string) => Claim[]) | undefined;
    if (BRIEF.test(file)) extract = briefClaims;
    else if (
      file.startsWith(bundlePrefix) &&
      file.endsWith(".md") &&
      isConcept(file.slice(bundlePrefix.length))
    )
      extract = verifiedClaims;
    if (!extract) continue;
    // an archived brief was the active change's brief at the merge base
    const active = ARCHIVED_BRIEF.exec(file);
    const bases = [file, ...(active ? [`openspec/changes/${active[1]}/brief.md`] : [])];
    const before = new Set(
      bases.flatMap((path) => {
        const base = baseVersion(root, diff.mergeBase, path);
        return base === undefined ? [] : extract(file, base).map((c) => c.login.toLowerCase());
      }),
    );
    for (const claim of extract(file, readFileSync(abs, "utf8")))
      if (!before.has(claim.login.toLowerCase())) out.push(claim);
  }
  return out;
}
