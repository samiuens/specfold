import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { findingLine, plural, sortFindings } from "../findings.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { auditBundle } from "./rules.ts";

register({
  name: "audit",
  summary:
    "report stale, unverified, deprecated-linked and orphaned concepts, specs without a card, overdue commitments and old backlog items",
  usage: "specfold audit [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 0) throw new UsageError(`unexpected argument '${positionals[0]}'`);
    const config = requireConfig(io.cwd);
    const findings = sortFindings(
      auditBundle(config, resolveBundleRoot(io.cwd, undefined, config), new Date()),
    );
    const counts: Record<string, number> = {};
    for (const f of findings) counts[f.rule] = (counts[f.rule] ?? 0) + 1;
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: findings.length === 0, findings, counts }, null, 2)}\n`);
    } else {
      const lines = findings.map(findingLine);
      const byRule = Object.entries(counts)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([rule, n]) => `${rule} ${n}`)
        .join(", ");
      lines.push(`audit: ${plural(findings.length, "finding")}${byRule ? ` (${byRule})` : ""}`);
      io.stdout(`${lines.join("\n")}\n`);
    }
    return findings.length === 0 ? 0 : 1;
  },
});
