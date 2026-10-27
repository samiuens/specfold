import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { EnvError } from "../errors.ts";
import { STATE_PATH } from "./repo.ts";

/** Migration steps in order; the CLI records the first, second and fourth, `migrate mark` the others. */
export const STEPS = ["start", "inventory", "plan", "install", "convert", "seed", "report"] as const;
export type Step = (typeof STEPS)[number];
export const MARKABLE: Step[] = ["plan", "convert", "seed", "report"];

export interface MigrationState {
  state_version: 1;
  default_branch: string | null;
  /** The default branch's commit the migration branch started from. */
  base: string | null;
  /** Step → time it was first recorded. */
  steps: Partial<Record<Step, string>>;
  inventory?: unknown;
}

export function readState(root: string): MigrationState {
  const path = join(root, STATE_PATH);
  if (!existsSync(path)) return { state_version: 1, default_branch: null, base: null, steps: {} };
  try {
    return JSON.parse(readFileSync(path, "utf8")) as MigrationState;
  } catch (error) {
    throw new EnvError(`${STATE_PATH}: ${(error as Error).message}`);
  }
}

export function writeState(root: string, state: MigrationState): void {
  const path = join(root, STATE_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

/** Records a step as done, keeping the time of its first run. */
export function markStep(state: MigrationState, step: Step, now: Date): MigrationState {
  return state.steps[step] ? state : { ...state, steps: { ...state.steps, [step]: now.toISOString() } };
}

export const nextStep = (state: MigrationState): Step | null => STEPS.find((s) => !state.steps[s]) ?? null;
