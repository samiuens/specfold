import { relative, sep } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { findRepoRoot, resolveBundleRoot } from "../repo.ts";
import { search } from "./search.ts";

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
    const base = findRepoRoot(io.cwd) ?? io.cwd;
    const type = values.type as string | undefined;
    const hits = search(bundleRoot, query, type ? { type } : {}).slice(0, Number(limitArg));
    const results = hits.map((h) => ({
      path: relative(base, `${bundleRoot}${sep}${h.rel}`).split(sep).join("/"),
      title: h.title,
      description: h.description,
      type: h.type,
      score: h.score,
      flags: h.flags,
    }));
    if (values.json) {
      io.stdout(`${JSON.stringify({ query, results }, null, 2)}\n`);
    } else if (results.length === 0) {
      io.stdout("no matches\n");
    } else {
      const line = (r: (typeof results)[number]) =>
        `${r.path} - ${r.title}${r.description ? `: ${r.description}` : ""}${r.flags.length ? ` [${r.flags.join(", ")}]` : ""}`;
      io.stdout(`${results.map(line).join("\n")}\n`);
    }
    return 0;
  },
});
