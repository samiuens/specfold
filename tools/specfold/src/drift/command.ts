import { existsSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { conceptDependencies } from "./deps.ts";
import { type Drift, driftOf, hasHistory } from "./drift.ts";

/** A path argument as a bundle-relative concept path: repository-relative first, then bundle-relative. */
function conceptRel(arg: string, root: string, bundleRoot: string, known: Set<string>): string {
  const rel = [resolve(root, arg), resolve(bundleRoot, arg)]
    .map((abs) => relative(bundleRoot, abs).split(sep).join("/"))
    .find((r) => known.has(r) && existsSync(join(bundleRoot, r)) && statSync(join(bundleRoot, r)).isFile());
  if (!rel) throw new UsageError(`'${arg}' is not a concept in the bundle`);
  return rel;
}

register({
  name: "drift",
  summary: "find concepts whose code or sources changed after they were last written or verified",
  usage: "specfold drift [<path>...] [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const config = requireConfig(io.cwd);
    const bundleRoot = resolveBundleRoot(io.cwd, undefined, config);
    const all = conceptDependencies(config.root, bundleRoot, config.sourceGlobs);
    const known = new Set(all.map((c) => c.rel));
    const wanted = new Set(positionals.map((arg) => conceptRel(arg, config.root, bundleRoot, known)));
    if (!hasHistory(config.root)) throw new EnvError("specfold drift needs a git repository with commits");
    const checked = wanted.size === 0 ? all : all.filter((c) => wanted.has(c.rel));
    const concepts = checked.flatMap((c) => driftOf(config.root, c) ?? []);
    const counts = { checked: checked.length, drifted: concepts.length };
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: concepts.length === 0, concepts, counts }, null, 2)}\n`);
    } else {
      const block = (d: Drift) => [
        `${d.path} (baseline ${d.baseline})`,
        ...d.commits.map((c) => `  ${c.hash} ${c.date.slice(0, 10)} ${c.subject}: ${c.paths.join(", ")}`),
      ];
      const lines = [
        ...concepts.flatMap(block),
        `drift: ${plural(concepts.length, "concept")} possibly stale of ${counts.checked} checked`,
      ];
      io.stdout(`${lines.join("\n")}\n`);
    }
    return concepts.length === 0 ? 0 : 1;
  },
});
