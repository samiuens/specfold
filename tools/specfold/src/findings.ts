export type Severity = "error" | "warning";

export interface Finding {
  rule: string;
  severity: Severity;
  /** Path relative to the bundle root (or repository root, per command), with forward slashes. */
  path: string;
  line: number | null;
  message: string;
  fix: string;
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Orders by path, then line (no line first), then rule id. Code-unit order keeps output locale-independent. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => compare(a.path, b.path) || (a.line ?? 0) - (b.line ?? 0) || compare(a.rule, b.rule),
  );
}

export function countBySeverity(findings: Finding[]): { errors: number; warnings: number } {
  const errors = findings.filter((f) => f.severity === "error").length;
  return { errors, warnings: findings.length - errors };
}

export function findingLine(f: Finding): string {
  return `${f.path}${f.line === null ? "" : `:${f.line}`} ${f.rule} ${f.message}`;
}

export const plural = (n: number, word: string) =>
  `${n} ${n === 1 ? word : word.endsWith("x") ? `${word}es` : `${word}s`}`;

/** Error lines followed by one summary line; warnings only appear as a count. */
export function renderHuman(findings: Finding[], checked: number): string {
  const sorted = sortFindings(findings);
  const { errors, warnings } = countBySeverity(sorted);
  const lines = sorted.filter((f) => f.severity === "error").map(findingLine);
  lines.push(
    `${plural(checked, "file")} checked: ${plural(errors, "error")}, ${plural(warnings, "warning")}`,
  );
  return `${lines.join("\n")}\n`;
}

export function renderJson(findings: Finding[], checked: number): string {
  const sorted = sortFindings(findings);
  const { errors, warnings } = countBySeverity(sorted);
  return `${JSON.stringify({ ok: errors === 0, checked, errors, warnings, findings: sorted }, null, 2)}\n`;
}
