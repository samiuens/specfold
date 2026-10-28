// see knowledge: /architecture/upgrade-flow.md

export type Channel = "stable" | "next";

interface Version {
  core: [number, number, number];
  pre: string[];
}

/** A semver `X.Y.Z` with an optional `-prerelease`, with or without a leading `v`; undefined otherwise. */
export function parseVersion(text: string): Version | undefined {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(text.trim());
  if (!m) return undefined;
  return { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split(".") : [] };
}

export const isVersion = (text: string) => parseVersion(text) !== undefined;

/** Negative when `a` is older than `b`, positive when newer, 0 when equal; a prerelease sorts below its release. */
export function compareVersions(a: string, b: string): number {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) throw new Error(`not a version: ${x ? b : a}`);
  for (let i = 0; i < 3; i++)
    if (x.core[i] !== y.core[i]) return (x.core[i] as number) - (y.core[i] as number);
  if (x.pre.length === 0 || y.pre.length === 0) return y.pre.length - x.pre.length;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === q) continue;
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    const numeric = /^\d+$/.test(p) && /^\d+$/.test(q);
    return numeric ? Number(p) - Number(q) : p < q ? -1 : 1;
  }
  return 0;
}

export const isPrerelease = (version: string) => (parseVersion(version)?.pre.length ?? 0) > 0;

const major = (version: string) => (parseVersion(version) as Version).core[0];

/** The versions a channel offers: `stable` only final releases, `next` release candidates too. */
export const onChannel = (versions: string[], channel: Channel) =>
  versions.filter((v) => isVersion(v) && (channel === "next" || !isPrerelease(v)));

/**
 * The upgrade steps from `installed`: the newest release in the same major, otherwise the newest of the
 * next major that has a release, repeated until nothing newer is left. Each run of upgrade takes one step.
 */
export function upgradePath(installed: string, available: string[], channel: Channel): string[] {
  const offered = onChannel(available, channel);
  const newest = (vs: string[]) => [...vs].sort(compareVersions).at(-1) as string;
  const path: string[] = [];
  let current = installed;
  for (;;) {
    const newer = offered.filter((v) => compareVersions(v, current) > 0);
    if (newer.length === 0) return path;
    const same = newer.filter((v) => major(v) === major(current));
    const nextMajor = Math.min(...newer.map(major));
    current = newest(same.length > 0 ? same : newer.filter((v) => major(v) === nextMajor));
    path.push(current);
  }
}
