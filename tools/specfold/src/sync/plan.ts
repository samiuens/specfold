import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { checkKnowledge, type DeltaOp } from "../change/knowledge.ts";
import type { Config } from "../repo.ts";
import type { TaskFinding } from "../tasks/rules.ts";
import { planOps, type SyncPlan } from "./apply.ts";

export interface ArchivedSync {
  /** Knowledge rule errors; when there are any, nothing is planned. */
  findings: TaskFinding[];
  ops: DeltaOp[];
  /** Stub and key writes; index writes are left to the caller. */
  plan: SyncPlan | undefined;
  logPath: string;
  /** Repository-relative path of log.md. */
  logRel: string;
  logText: string | undefined;
  /** No log entry names the change yet. */
  needsLog: boolean;
}

/** What `specfold sync <id>` would do for an archived change, without writing anything. */
export function planSync(config: Config, bundleRoot: string, id: string, now = new Date()): ArchivedSync {
  const relDir = `openspec/changes/archive/${id}`;
  const { findings, ops } = checkKnowledge(config, bundleRoot, join(config.root, relDir), {
    relDir,
    archived: true,
  });
  const logPath = join(bundleRoot, "log.md");
  const logRel = relative(config.root, logPath).split(sep).join("/");
  const logText = existsSync(logPath) ? readFileSync(logPath, "utf8") : undefined;
  if (findings.length > 0)
    return { findings, ops, plan: undefined, logPath, logRel, logText, needsLog: false };

  const model = process.env.SPECFOLD_MODEL;
  const by = model ? `${config.agentPrefix}${model}` : "process:specfold-sync";
  const plan = planOps(ops, { repoRoot: config.root, bundleRoot, archivedId: id, by, now });
  return { findings, ops, plan, logPath, logRel, logText, needsLog: !logText?.includes(id) };
}
