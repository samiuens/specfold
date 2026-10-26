import type { GateFinding } from "./rules.ts";

// a table cell holds one line; a literal | would end the cell
const cell = (text: string) => text.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");

/** The verdict as a Markdown heading, one table of findings in output order, and warnings per rule. */
export function renderSummary(findings: GateFinding[], verdict: string): string {
  const lines = [`## specfold gate: ${verdict}`, ""];
  if (findings.length > 0) {
    lines.push("| Rule | Effect | Path | Message | Fix |", "| --- | --- | --- | --- | --- |");
    for (const f of findings) {
      const path = f.path === null ? "" : `\`${cell(f.path)}${f.line === null ? "" : `:${f.line}`}\``;
      lines.push(`| ${f.rule} | ${f.effect} | ${path} | ${cell(f.message)} | ${cell(f.fix)} |`);
    }
    lines.push("");
  }
  const warnings = new Map<string, number>();
  for (const f of findings) if (f.effect === "warn") warnings.set(f.rule, (warnings.get(f.rule) ?? 0) + 1);
  lines.push(
    `Warnings: ${warnings.size === 0 ? "none" : [...warnings].map(([rule, n]) => `${rule} ${n}`).join(", ")}`,
  );
  return `${lines.join("\n")}\n`;
}
