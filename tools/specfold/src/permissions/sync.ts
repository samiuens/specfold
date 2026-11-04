import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { CONFIG_FILE, type Config } from "../repo.ts";
import { type Plan, planPermissions, SETTINGS_FILE } from "./render.ts";

/** The raw `permissions` value of specfold.yaml; loadConfig has already checked that the file parses. */
export function readPermissionsSetting(root: string): unknown {
  const data = parse(readFileSync(join(root, CONFIG_FILE), "utf8")) as Record<string, unknown> | null;
  return data?.permissions;
}

/** Reads the setting and the settings file, plans the sync and writes it unless `check`. */
export function syncPermissions(config: Config, check: boolean): Plan {
  const file = join(config.root, SETTINGS_FILE);
  const current = existsSync(file) ? readFileSync(file, "utf8") : undefined;
  const plan = planPermissions(readPermissionsSetting(config.root), config.agentTargets, current);
  if (!check && plan.text !== undefined) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, plan.text);
  }
  return plan;
}

/** One line per change and problem, for the sync and the commands that run it. */
export function planLines(plan: Plan): string[] {
  return [
    ...plan.problems.map((p) => `${p.action}: ${p.message}`),
    ...plan.changes.map((c) => `${c.pattern}: ${c.from} -> ${c.to}`),
  ];
}
