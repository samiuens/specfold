import type { UpgradePlan } from "./plan.ts";

export interface FollowUp {
  command: string;
  code: number;
  /** The last line the command printed. */
  output: string;
}

export interface ReportExtras {
  /** Lines the migrations reported, by version. */
  migrations?: { version: string; line: string }[];
  /** Follow-up results; absent for a plan that was not applied. */
  followUps?: FollowUp[];
}

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The upgrade report: conflicts first, then the changes, kept files, migrations, follow-ups and notes. */
export function reportText(plan: UpgradePlan, extras: ReportExtras = {}): string {
  const steps = [...plan.files, ...plan.blocks, ...plan.configs];
  const conflicts = steps.filter((s) => s.action === "conflict");
  const changes = steps.filter((s) => !["unchanged", "conflict", "keep", "unmanaged"].includes(s.action));
  const kept = [
    ...steps
      .filter((s) => s.action === "keep" || s.action === "unmanaged")
      .map((s) => `${s.path}: ${s.reason}`),
    ...plan.configs.flatMap((c) => c.notes.map((n) => `${c.path}: ${n}`)),
  ];
  const lines = [
    `# Specfold upgrade: ${plan.from} to ${plan.to}`,
    "",
    ...(plan.switchToFull
      ? [
          "Switched from the knowledge profile to full: OpenSpec is set up. Review `gate.escape_label` in specfold.yaml; the full profile's pull request template asks for a `No-spec reason:` line.",
          "",
        ]
      : []),
    `## Conflicts (${conflicts.length})`,
    "",
  ];
  if (conflicts.length === 0) lines.push("None.");
  for (const c of conflicts) lines.push(`- \`${c.path}\`: ${c.reason}`);
  lines.push("", "## Changes", "");
  if (changes.length === 0) lines.push("None.");
  else
    lines.push(
      "| Path | Action |",
      "| --- | --- |",
      ...changes.map((s) => `| \`${cell(s.path)}\` | ${s.action} |`),
    );
  lines.push("", "## Kept", "", ...(kept.length > 0 ? kept.map((k) => `- ${k}`) : ["None."]));
  lines.push("", "## Migrations", "");
  if (plan.migrations.length === 0) lines.push("None.");
  for (const version of plan.migrations) {
    lines.push(`- ${version}`);
    for (const m of extras.migrations?.filter((x) => x.version === version) ?? [])
      lines.push(`  - ${m.line}`);
  }
  lines.push("", "## Follow-up commands", "");
  if (extras.followUps === undefined) lines.push("Not run: this is the plan.");
  else
    lines.push(
      "| Command | Exit | Last line |",
      "| --- | --- | --- |",
      ...extras.followUps.map((f) => `| \`${cell(f.command)}\` | ${f.code} | ${cell(f.output)} |`),
    );
  lines.push("", "## Upgrade notes", "");
  if (plan.notes.length === 0) lines.push("No manual steps.");
  for (const n of plan.notes)
    lines.push(`### ${n.version}`, "", n.text.replace(/^## Upgrade notes\n+/, ""), "");
  return `${lines.join("\n").trimEnd()}\n`;
}
