import { relative, sep } from "node:path";
import { register } from "../cli.ts";
import { conceptDependencies } from "../drift/deps.ts";
import { driftOf, hasHistory } from "../drift/drift.ts";
import { UsageError } from "../errors.ts";
import { findRepoRoot, loadConfig, resolveBundleRoot } from "../repo.ts";
import { contextConcepts, type Hit, search } from "./search.ts";

/** Bundle-relative paths of the hits that are possibly stale; empty outside a git repository. */
function drifted(repoRoot: string | undefined, bundleRoot: string, hits: Hit[]): Set<string> {
  if (!repoRoot || hits.length === 0 || !hasHistory(repoRoot)) return new Set();
  let sourceGlobs: string[] = [];
  try {
    sourceGlobs = loadConfig(repoRoot).sourceGlobs;
  } catch {
    // a broken specfold.yaml only costs the code references here
  }
  const wanted = new Set(hits.map((h) => h.rel));
  return new Set(
    conceptDependencies(repoRoot, bundleRoot, sourceGlobs)
      .filter((c) => wanted.has(c.rel) && driftOf(repoRoot, c) !== undefined)
      .map((c) => c.rel),
  );
}

/** Inserts `drift` before `unverified`, keeping the documented flag order. */
const withDrift = (flags: string[]) => {
  const at = flags.indexOf("unverified");
  return at === -1 ? [...flags, "drift"] : [...flags.slice(0, at), "drift", ...flags.slice(at)];
};

register({
  name: "lookup",
  summary: "find concepts by their frontmatter",
  usage: "specfold lookup <query...> [--type <type>] [--limit <n>] [--bundle <dir>] [--json]",
  options: {
    type: { type: "string" },
    limit: { type: "string" },
    bundle: { type: "string" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    const query = positionals.join(" ").trim();
    if (!query) throw new UsageError("missing query");
    const limitArg = (values.limit as string | undefined) ?? "10";
    if (!/^[1-9]\d*$/.test(limitArg))
      throw new UsageError(`--limit must be a positive integer, got '${limitArg}'`);

    const bundleRoot = resolveBundleRoot(io.cwd, values.bundle as string | undefined, undefined);
    const repoRoot = findRepoRoot(io.cwd);
    const base = repoRoot ?? io.cwd;
    const type = values.type as string | undefined;
    const hits = search(bundleRoot, query, type ? { type } : {}).slice(0, Number(limitArg));
    const extra = contextConcepts(bundleRoot, query, new Set(hits.map((h) => h.rel)));
    const stale = drifted(repoRoot, bundleRoot, [...hits, ...extra]);
    const shape = (h: Hit) => ({
      path: relative(base, `${bundleRoot}${sep}${h.rel}`).split(sep).join("/"),
      title: h.title,
      description: h.description,
      type: h.type,
      flags: stale.has(h.rel) ? withDrift(h.flags) : h.flags,
    });
    const results = hits.map((h) => ({ ...shape(h), score: h.score }));
    const context = extra.map(shape);
    if (values.json) {
      io.stdout(`${JSON.stringify({ query, results, context }, null, 2)}\n`);
    } else {
      const line = (r: ReturnType<typeof shape>) =>
        `${r.path} - ${r.title}${r.description ? `: ${r.description}` : ""}${r.flags.length ? ` [${r.flags.join(", ")}]` : ""}`;
      const lines = results.length === 0 ? ["no matches"] : results.map(line);
      if (context.length > 0) lines.push("vision and open commitments:", ...context.map(line));
      io.stdout(`${lines.join("\n")}\n`);
    }
    return 0;
  },
});
