import { parseFile, RESERVED, walk } from "../bundle.ts";

export const WEIGHTS = { title: 3, tags: 2, description: 1, type: 1 } as const;
type Field = keyof typeof WEIGHTS;

export interface Hit {
  /** Bundle-relative path. */
  rel: string;
  title: string;
  description: string | null;
  type: string;
  score: number;
  flags: string[];
}

export interface SearchOptions {
  type?: string;
  now?: number;
}

/** Splits text into lowercase words on anything that is not a letter or digit. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);

function flagsOf(data: Record<string, unknown>, now: number): string[] {
  const flags: string[] = [];
  if (data.status === "deprecated") flags.push("deprecated");
  const stale = typeof data.stale_after === "string" ? Date.parse(data.stale_after) : Number.NaN;
  if (!Number.isNaN(stale) && stale < now) flags.push("stale");
  const verified = Array.isArray(data.verified) ? data.verified.length > 0 : data.verified !== undefined;
  if (!verified) flags.push("unverified");
  return flags;
}

interface Indexed {
  rel: string;
  title: string;
  description: string | null;
  type: string;
  data: Record<string, unknown>;
  fields: Record<Field, string[]>;
}

/** Every concept with its searchable fields. */
function* indexed(bundleRoot: string): Generator<Indexed> {
  for (const entry of walk(bundleRoot)) {
    const name = entry.rel.slice(entry.rel.lastIndexOf("/") + 1);
    if (entry.isDir || !name.endsWith(".md") || RESERVED.has(name)) continue;
    const data = parseFile(bundleRoot, entry.rel).frontmatter?.data;
    if (!isRecord(data)) continue;
    const type = text(data.type);
    if (!type) continue;
    const title = text(data.title) ?? name.slice(0, -3);
    const description = text(data.description) ?? null;
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((t) => typeof t === "string")
      : text(data.tags)
        ? [data.tags as string]
        : [];
    const fields: Record<Field, string[]> = {
      title: words(title),
      tags: words(tags.join(" ")),
      description: words(description ?? ""),
      type: words(type),
    };
    yield { rel: entry.rel, title, description, type, data, fields };
  }
}

/** The highest weight of a field holding a word that starts with `term`, or 0. */
const bestWeight = (c: Indexed, term: string) =>
  Math.max(
    0,
    ...(Object.keys(WEIGHTS) as Field[])
      .filter((f) => c.fields[f].some((w) => w.startsWith(term)))
      .map((f) => WEIGHTS[f]),
  );

/** Searches concept frontmatter; every query word has to prefix-match a word in some field. */
export function search(bundleRoot: string, query: string, options: SearchOptions = {}): Hit[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  const now = options.now ?? Date.now();
  const wanted = options.type?.toLowerCase();
  const hits: Hit[] = [];
  for (const c of indexed(bundleRoot)) {
    if (wanted !== undefined && c.type.toLowerCase() !== wanted) continue;
    let score = 0;
    for (const term of terms) {
      const best = bestWeight(c, term);
      if (best === 0) {
        score = 0;
        break;
      }
      score += best;
    }
    if (score > 0)
      hits.push({
        rel: c.rel,
        title: c.title,
        description: c.description,
        type: c.type,
        score,
        flags: flagsOf(c.data, now),
      });
  }
  return hits.sort((a, b) => b.score - a.score || (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}

/**
 * Every Vision, and every open Deferred Commitment that at least one query word matches, except the
 * excluded paths; visions first, each group by path. `score` is 0.
 */
export function contextConcepts(
  bundleRoot: string,
  query: string,
  exclude: Set<string>,
  now = Date.now(),
): Hit[] {
  const terms = words(query);
  const out: Hit[] = [];
  for (const c of indexed(bundleRoot)) {
    if (exclude.has(c.rel)) continue;
    const vision = c.type === "Vision";
    const commitment =
      c.type === "Deferred Commitment" && c.data.state === "open" && terms.some((t) => bestWeight(c, t) > 0);
    if (vision || commitment)
      out.push({
        rel: c.rel,
        title: c.title,
        description: c.description,
        type: c.type,
        score: 0,
        flags: flagsOf(c.data, now),
      });
  }
  const rank = (h: Hit) => (h.type === "Vision" ? 0 : 1);
  return out.sort((a, b) => rank(a) - rank(b) || (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}
