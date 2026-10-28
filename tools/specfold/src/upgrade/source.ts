// see knowledge: /architecture/upgrade-flow.md
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { EnvError } from "../errors.ts";
import { isVersion } from "./version.ts";

/** Where releases come from: `source:` in specfold.yaml. */
export type Source = { github: string } | { url: string } | { path: string };

export interface ReleaseSource {
  /** A short name for messages, such as `github samiuens/specfold`. */
  label: string;
  /** Every version the source has, in no particular order. */
  versions(): Promise<string[]>;
  /** The release notes of `version`; empty when the source has none. */
  notes(version: string): Promise<string>;
  /** Puts the tarball of `version` and its `.sha256` into `dir`; returns the tarball's path. */
  download(version: string, dir: string): Promise<string>;
  /** The release's tag for the manifest's `ref`, when the source has tags. */
  tag(version: string): string | undefined;
}

export interface SourceOptions {
  /** Environment for tokens and `GITHUB_API_URL`; never written anywhere. */
  env?: NodeJS.ProcessEnv;
  /** Use the gh CLI for `github` sources; decided by the caller with `ghLoggedIn()`. */
  gh?: boolean;
}

export const tarballName = (version: string) => `specfold-template-v${version}.tar.gz`;

/** Whether `gh` is installed and logged in to github.com. */
export function ghLoggedIn(): boolean {
  try {
    execFileSync("gh", ["auth", "status", "--hostname", "github.com"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

interface MirrorIndex {
  releases?: { version?: unknown; notes?: unknown }[];
}

/** Versions and notes from a parsed `releases.json`. */
function fromIndex(data: unknown, where: string): Map<string, string> {
  const releases = (data as MirrorIndex | null)?.releases;
  if (!Array.isArray(releases)) throw new EnvError(`${where} has no 'releases' list`);
  return new Map(
    releases
      .filter((r) => typeof r.version === "string" && isVersion(r.version))
      .map((r) => [r.version as string, typeof r.notes === "string" ? r.notes : ""]),
  );
}

async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { "user-agent": "specfold", ...headers } });
  } catch (error) {
    throw new EnvError(`could not reach ${url}: ${(error as Error).message}`);
  }
  if (!response.ok) throw new EnvError(`${url} answered ${response.status}`);
  return response;
}

async function save(url: string, file: string, headers: Record<string, string> = {}): Promise<void> {
  writeFileSync(file, Buffer.from(await (await get(url, headers)).arrayBuffer()));
}

function pathSource(dir: string): ReleaseSource {
  const indexFile = join(dir, "releases.json");
  const index = (): Map<string, string> | undefined =>
    existsSync(indexFile) ? fromIndex(JSON.parse(readFileSync(indexFile, "utf8")), indexFile) : undefined;
  return {
    label: `path ${dir}`,
    versions: async () => {
      if (!existsSync(dir)) throw new EnvError(`source.path ${dir} does not exist`);
      const listed = index();
      if (listed) return [...listed.keys()];
      return readdirSync(dir)
        .map((f) => /^specfold-template-v(.+)\.tar\.gz$/.exec(f)?.[1])
        .filter((v): v is string => v !== undefined && isVersion(v));
    },
    notes: async (version) => index()?.get(version) ?? "",
    download: async (version, to) => {
      for (const name of [tarballName(version), `${tarballName(version)}.sha256`]) {
        if (!existsSync(join(dir, name))) throw new EnvError(`${join(dir, name)} does not exist`);
        copyFileSync(join(dir, name), join(to, name));
      }
      return join(to, tarballName(version));
    },
    tag: () => undefined,
  };
}

function urlSource(base: string): ReleaseSource {
  const root = base.replace(/\/+$/, "");
  let cached: Map<string, string> | undefined;
  const index = async () => {
    cached ??= fromIndex(await (await get(`${root}/releases.json`)).json(), `${root}/releases.json`);
    return cached;
  };
  return {
    label: `url ${root}`,
    versions: async () => [...(await index()).keys()],
    notes: async (version) => (await index()).get(version) ?? "",
    download: async (version, to) => {
      for (const name of [tarballName(version), `${tarballName(version)}.sha256`])
        await save(`${root}/${name}`, join(to, name));
      return join(to, tarballName(version));
    },
    tag: () => undefined,
  };
}

interface GithubRelease {
  tag_name: string;
  body?: string | null;
  assets?: { name: string; url: string }[];
}

function githubSource(repo: string, o: SourceOptions): ReleaseSource {
  const env = o.env ?? process.env;
  const token = env.SPECFOLD_TOKEN || env.GITHUB_TOKEN;
  const api = (env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");
  const headers = (accept: string): Record<string, string> => ({
    accept,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  });
  const gh = (args: string[]) =>
    execFileSync("gh", [...args, "--repo", repo], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  let cached: GithubRelease[] | undefined;
  const releases = async (): Promise<GithubRelease[]> => {
    if (cached) return cached;
    if (o.gh) {
      const listed = JSON.parse(gh(["release", "list", "--limit", "100", "--json", "tagName"])) as {
        tagName: string;
      }[];
      cached = listed.map((r) => ({ tag_name: r.tagName }));
    } else {
      const response = await get(
        `${api}/repos/${repo}/releases?per_page=100`,
        headers("application/vnd.github+json"),
      );
      cached = (await response.json()) as GithubRelease[];
    }
    return cached;
  };
  const find = async (version: string) => {
    const release = (await releases()).find((r) => r.tag_name === `v${version}`);
    if (!release) throw new EnvError(`${repo} has no release v${version}`);
    return release;
  };
  return {
    label: `github ${repo}`,
    versions: async () =>
      (await releases()).map((r) => r.tag_name.replace(/^v/, "")).filter((v) => isVersion(v)),
    notes: async (version) => {
      if (o.gh) return JSON.parse(gh(["release", "view", `v${version}`, "--json", "body"])).body ?? "";
      return (await find(version)).body ?? "";
    },
    download: async (version, to) => {
      const names = [tarballName(version), `${tarballName(version)}.sha256`];
      if (o.gh) {
        for (const name of names)
          gh(["release", "download", `v${version}`, "--pattern", name, "--dir", to, "--clobber"]);
      } else {
        const assets = (await find(version)).assets ?? [];
        for (const name of names) {
          const asset = assets.find((a) => a.name === name);
          if (!asset) throw new EnvError(`release v${version} of ${repo} has no ${name}`);
          await save(asset.url, join(to, name), headers("application/octet-stream"));
        }
      }
      return join(to, tarballName(version));
    },
    tag: (version) => `v${version}`,
  };
}

/** The release source for `source`; a relative `path` is resolved against the Specfold root. */
export function openSource(source: Source, root: string, o: SourceOptions = {}): ReleaseSource {
  if ("path" in source) return pathSource(resolve(root, source.path));
  if ("url" in source) return urlSource(source.url);
  return githubSource(source.github, o);
}

/** Stops with an environment error unless `tarball` matches the hash in `tarball.sha256`. */
export function verifyChecksum(tarball: string): void {
  const file = `${tarball}.sha256`;
  if (!existsSync(file)) throw new EnvError(`${file} is missing; the tarball can't be checked`);
  const expected = readFileSync(file, "utf8").trim().split(/\s+/)[0];
  const actual = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  if (actual !== expected) throw new EnvError(`${tarball} does not match its .sha256; nothing was changed`);
}

/** Unpacks a release tarball into `dir`, dropping its top folder. */
export function unpack(tarball: string, dir: string): void {
  mkdirSync(dir, { recursive: true });
  try {
    execFileSync("tar", ["-xzf", tarball, "-C", dir, "--strip-components=1"], { stdio: "pipe" });
  } catch (error) {
    throw new EnvError(
      `could not unpack ${tarball}: ${String((error as { stderr?: unknown }).stderr).trim()}`,
    );
  }
}

/** Downloads `version` from `source` into `work`, checks it and unpacks it into `work/<version>/`. */
export async function fetchRelease(source: ReleaseSource, version: string, work: string): Promise<string> {
  const downloads = join(work, "downloads");
  mkdirSync(downloads, { recursive: true });
  const tarball = await source.download(version, downloads);
  verifyChecksum(tarball);
  const dir = join(work, version);
  unpack(tarball, dir);
  return dir;
}
