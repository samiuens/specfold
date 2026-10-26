import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { parseFile } from "../bundle.ts";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { isoWithOffset } from "../new/command.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { isConcept, isRecord } from "../validate/okf.ts";
import { verifyText } from "./apply.ts";
import { agentReason, resolveLogin } from "./login.ts";

interface Target {
  arg: string;
  /** Bundle-relative concept path, when the argument names one. */
  rel?: string;
  reason?: string;
}

/** Resolves an argument, repository-relative first, then bundle-relative, and checks it can be verified. */
function check(arg: string, root: string, bundleRoot: string): Target {
  const inBundle = [resolve(root, arg), resolve(bundleRoot, arg)]
    .map((abs) => relative(bundleRoot, abs).split(sep).join("/"))
    .filter((rel) => rel !== "" && !rel.startsWith("..") && !rel.startsWith("/"));
  const rel = inBundle.find((r) => existsSync(join(bundleRoot, r)) && statSync(join(bundleRoot, r)).isFile());
  if (!rel)
    return { arg, reason: inBundle.length === 0 ? "outside the bundle" : "no such file in the bundle" };
  if (!rel.endsWith(".md") || !isConcept(rel))
    return { arg, rel, reason: "not a concept (index.md and log.md are generated)" };
  const parsed = parseFile(bundleRoot, rel);
  if (!isRecord(parsed.frontmatter?.data)) return { arg, rel, reason: "no readable frontmatter" };
  if (parsed.frontmatter.data.status === "deprecated")
    return { arg, rel, reason: "deprecated concepts are not verified" };
  return { arg, rel };
}

register({
  name: "verify",
  summary: "mark concepts as verified by you (humans only)",
  usage: "specfold verify <path>... [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    if (positionals.length === 0) throw new UsageError("missing path: specfold verify <path>...");
    const agent = agentReason();
    if (agent)
      throw new EnvError(`only humans verify (${agent}); run specfold verify yourself in a terminal`);
    const config = requireConfig(io.cwd);
    const bundleRoot = resolveBundleRoot(io.cwd, undefined, config);
    const login = resolveLogin(config.root);
    const targets = positionals.map((arg) => check(arg, config.root, bundleRoot));
    const prefix = relative(config.root, bundleRoot).split(sep).join("/");
    const shown = (t: Target) => (t.rel ? `${prefix}/${t.rel}` : t.arg);
    const refused = targets.filter((t) => t.reason !== undefined);

    const verified: string[] = [];
    if (refused.length === 0) {
      const at = isoWithOffset(new Date());
      const written = targets.map((t) => {
        const abs = join(bundleRoot, t.rel as string);
        return { abs, text: verifyText(readFileSync(abs, "utf8"), login, at) };
      });
      for (const w of written) writeFileSync(w.abs, w.text);
      verified.push(...targets.map(shown));
    }
    const ok = refused.length === 0;
    if (values.json) {
      const out = {
        ok,
        login,
        verified,
        refused: refused.map((t) => ({ path: shown(t), reason: t.reason })),
      };
      io.stdout(`${JSON.stringify(out, null, 2)}\n`);
    } else {
      const lines = ok
        ? [
            ...verified.map((p) => `verified ${p}`),
            `verify: ${plural(verified.length, "concept")} verified as human:${login}`,
          ]
        : [
            ...refused.map((t) => `refused ${shown(t)}: ${t.reason}`),
            `verify: ${plural(refused.length, "path")} refused, nothing written`,
          ];
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
