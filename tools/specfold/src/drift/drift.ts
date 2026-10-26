import { git, gitSucceeds } from "../git.ts";
import { isRecord } from "../validate/okf.ts";
import { type ConceptDeps, coveredBy } from "./deps.ts";

export interface DriftCommit {
  hash: string;
  date: string;
  subject: string;
  /** The concept's dependent paths this commit changed. */
  paths: string[];
}

export interface Drift {
  /** Repository-relative concept file. */
  path: string;
  baseline: string;
  commits: DriftCommit[];
}

/** The latest `verified[].at`, else `generated.at`, as written. */
function trustTime(data: Record<string, unknown>): string | undefined {
  const verified = Array.isArray(data.verified)
    ? data.verified
    : data.verified === undefined
      ? []
      : [data.verified];
  const times = verified
    .map((v) => (isRecord(v) && typeof v.at === "string" ? v.at : undefined))
    .filter((t): t is string => t !== undefined && !Number.isNaN(Date.parse(t)));
  if (times.length > 0) return times.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a));
  const at = isRecord(data.generated) ? data.generated.at : undefined;
  return typeof at === "string" && !Number.isNaN(Date.parse(at)) ? at : undefined;
}

/** True when `repoRoot` is inside a git work tree with at least one commit. */
export const hasHistory = (repoRoot: string) =>
  gitSucceeds(repoRoot, ["rev-parse", "--verify", "--quiet", "HEAD"]);

/** The later of the concept's trust time and its file's last commit; undefined when it has neither. */
export function baselineOf(repoRoot: string, concept: ConceptDeps): string | undefined {
  const committed = git(repoRoot, ["log", "-1", "--format=%cI", "--", concept.file]).trim() || undefined;
  const trusted = trustTime(concept.data);
  if (!committed || !trusted) return committed ?? trusted;
  return Date.parse(committed) > Date.parse(trusted) ? committed : trusted;
}

/** The commits after the baseline that changed a dependent path, or undefined when there are none. */
export function driftOf(repoRoot: string, concept: ConceptDeps): Drift | undefined {
  if (concept.paths.length === 0) return undefined;
  const baseline = baselineOf(repoRoot, concept);
  if (!baseline) return undefined;
  const after = Date.parse(baseline);
  const log = git(repoRoot, [
    "log",
    "--relative",
    "--name-only",
    "--format=%x00%h%x09%cI%x09%s",
    `--since=${baseline}`,
    "--",
    ...concept.paths,
  ]);
  const commits: DriftCommit[] = [];
  for (const chunk of log.split("\0").slice(1)) {
    const [head = "", ...files] = chunk.split("\n");
    const [hash = "", date = "", ...subject] = head.split("\t");
    if (Date.parse(date) <= after) continue;
    const paths = concept.paths.filter((p) => files.some((f) => f !== "" && coveredBy(f, p)));
    if (paths.length > 0) commits.push({ hash, date, subject: subject.join("\t"), paths });
  }
  return commits.length > 0 ? { path: concept.file, baseline, commits } : undefined;
}
