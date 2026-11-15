import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { OMP_CONFIG } from "../omp/config.ts";
import { CONFIG_FILE, type Config } from "../repo.ts";
import { type OmpPlan, planOmpPermissions } from "./omp.ts";
import { type Plan, planPermissions, SETTINGS_FILE } from "./render.ts";

/** The raw `permissions` value of specfold.yaml; loadConfig has already checked that the file parses. */
export function readPermissionsSetting(root: string): unknown {
  const data = parse(readFileSync(join(root, CONFIG_FILE), "utf8")) as Record<string, unknown> | null;
  return data?.permissions;
}

export interface SyncPlan extends Plan {
  /** The plan for `.omp/config.yml`; undefined when `tools` does not list omp. */
  omp?: OmpPlan;
}

const readText = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : undefined);

function write(file: string, text: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

/**
 * Reads the setting and the settings files, plans the sync and writes it unless `check`. Nothing is written
 * when either file can't be read; a broken `.omp/config.yml` throws an environment error.
 */
export function syncPermissions(config: Config, check: boolean): SyncPlan {
  const file = join(config.root, SETTINGS_FILE);
  const setting = readPermissionsSetting(config.root);
  const plan: SyncPlan = planPermissions(setting, config.agentTargets, readText(file));
  const ompFile = join(config.root, OMP_CONFIG);
  if (config.tools.includes("omp")) plan.omp = planOmpPermissions(setting, readText(ompFile));
  if (check || plan.conflict) return plan;
  if (plan.text !== undefined) write(file, plan.text);
  if (plan.omp?.text !== undefined) write(ompFile, plan.omp.text);
  return plan;
}

/** One line per change and problem, for the sync and the commands that run it. */
export function planLines(plan: SyncPlan): string[] {
  return [
    ...plan.problems.map((p) => `${p.action}: ${p.message}`),
    ...plan.changes.map((c) => `${c.pattern}: ${c.from} -> ${c.to}`),
    ...(plan.omp?.changes ?? []).map((c) => `${c.target} ${c.pattern}: ${c.from} -> ${c.to}`),
  ];
}
