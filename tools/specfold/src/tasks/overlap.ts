import { globToRegExp, matchesAny } from "../glob.ts";
import type { Group } from "./parse.ts";

const WILDCARD = /[*?{[]/;

/** The segments before the first one holding a wildcard: `src/checkout/**` → `src/checkout`. */
function staticPrefix(glob: string): string {
  const segments = glob.split("/");
  const end = segments.findIndex((s) => WILDCARD.test(s));
  return segments.slice(0, end === -1 ? segments.length : end).join("/");
}

/** A path or glob both `a` and `b` claim, or undefined when they are disjoint as far as can be told. */
export function sharedFiles(a: string[], b: string[], repoFiles: () => string[]): string | undefined {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const) {
    for (const entry of x) {
      if (!WILDCARD.test(entry) && (y.includes(entry) || matchesAny(entry, y))) return entry;
    }
    for (const glob of x) {
      if (glob === "**") return glob;
      if (!glob.endsWith("/**")) continue;
      const dir = glob.slice(0, -3);
      for (const other of y) {
        const prefix = staticPrefix(other);
        if (prefix === dir || prefix.startsWith(`${dir}/`)) return `${glob} and ${other}`;
      }
    }
  }
  const ra = a.map(globToRegExp);
  const rb = b.map(globToRegExp);
  return repoFiles().find((f) => ra.some((r) => r.test(f)) && rb.some((r) => r.test(f)));
}

/** For each group number, every group it waits for through `depends`, directly or transitively. */
export function transitiveDepends(groups: Group[]): Map<number, Set<number>> {
  const direct = new Map(groups.map((g) => [g.number, g.meta?.depends ?? []]));
  const reach = new Map<number, Set<number>>();
  for (const g of groups) {
    const seen = new Set<number>();
    const stack = [...(direct.get(g.number) ?? [])];
    while (stack.length > 0) {
      const n = stack.pop() as number;
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(direct.get(n) ?? []));
    }
    reach.set(g.number, seen);
  }
  return reach;
}

export interface Overlap {
  first: Group;
  second: Group;
  shared: string;
}

/** Pairs of groups that may run in parallel (neither waits for the other) and claim the same files. */
export function parallelOverlaps(groups: Group[], repoFiles: () => string[]): Overlap[] {
  const reach = transitiveDepends(groups);
  let files: string[] | undefined;
  const lazyFiles = () => {
    files ??= repoFiles();
    return files;
  };
  const out: Overlap[] = [];
  const withMeta = groups.filter((g) => g.meta);
  for (let i = 0; i < withMeta.length; i++) {
    for (let j = i + 1; j < withMeta.length; j++) {
      const a = withMeta[i] as Group;
      const b = withMeta[j] as Group;
      if (reach.get(a.number)?.has(b.number) || reach.get(b.number)?.has(a.number)) continue;
      const shared = sharedFiles(a.meta?.files ?? [], b.meta?.files ?? [], lazyFiles);
      if (shared !== undefined) out.push({ first: a, second: b, shared });
    }
  }
  return out;
}
