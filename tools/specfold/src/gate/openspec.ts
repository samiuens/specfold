import { spawnSync } from "node:child_process";
import type { OpenSpecBinary } from "../openspec.ts";

export interface OpenSpecIssue {
  /** Repository-relative change or spec folder. */
  path: string;
  message: string;
}

interface Report {
  itemFindings?: {
    id?: string;
    type?: string;
    valid?: boolean;
    issues?: { level?: string; path?: string; message?: string }[];
  }[];
}

/**
 * Runs `openspec validate --all --strict` and returns the failing items' errors and warnings;
 * undefined when the binary cannot be started.
 */
export function openspecValidate(root: string, binary: OpenSpecBinary): OpenSpecIssue[] | undefined {
  const result = spawnSync(
    binary.command,
    ["validate", "--all", "--strict", "--json", "--report", "findings", "--no-interactive"],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  if (result.error) return undefined;
  let report: Report | undefined;
  try {
    report = JSON.parse(result.stdout) as Report;
  } catch {
    report = undefined;
  }
  if (!report?.itemFindings) {
    if (result.status === 0) return [];
    const first = `${result.stderr}\n${result.stdout}`.trim().split("\n")[0] || `exit code ${result.status}`;
    return [{ path: "openspec", message: `openspec validate failed: ${first}` }];
  }
  const issues: OpenSpecIssue[] = [];
  for (const item of report.itemFindings) {
    if (item.valid !== false) continue;
    const path = `openspec/${item.type === "spec" ? "specs" : "changes"}/${item.id ?? ""}`;
    const failing = (item.issues ?? []).filter((i) => i.level === "ERROR" || i.level === "WARNING");
    if (failing.length === 0) issues.push({ path, message: "openspec validate --strict failed" });
    for (const i of failing)
      issues.push({ path, message: `${i.path ? `${i.path}: ` : ""}${i.message ?? ""}` });
  }
  if (issues.length === 0 && result.status !== 0)
    issues.push({ path: "openspec", message: `openspec validate exited with ${result.status}` });
  return issues;
}
