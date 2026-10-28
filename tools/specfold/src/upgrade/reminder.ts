// see knowledge: /architecture/upgrade-flow.md
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Config } from "../repo.ts";
import { ghLoggedIn, openSource, type ReleaseSource } from "./source.ts";
import { isVersion, upgradePath } from "./version.ts";

export const STATE_FILE = ".specfold/local-state.json";
const LIMIT_MS = 2000;

interface LocalState {
  upgrade_check?: { date?: string; versions?: string[] | null };
  [key: string]: unknown;
}

export interface ReminderOptions {
  now?: Date;
  /** Overall limit for the check; 2 seconds by default. */
  timeoutMs?: number;
  /** The source to ask instead of the one in specfold.yaml (tests). */
  source?: ReleaseSource;
}

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function readState(root: string): LocalState {
  try {
    const data = JSON.parse(readFileSync(join(root, STATE_FILE), "utf8")) as unknown;
    return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as LocalState) : {};
  } catch {
    return {};
  }
}

/** Rejects when `promise` takes longer than `ms`; the timer never keeps the process alive. */
function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    timer.unref();
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * The session-start line about a newer release on the repository's channel, or undefined. The source is
 * asked at most once a day (cached in `.specfold/local-state.json`, failures included) within 2 seconds;
 * nothing here ever throws.
 */
export async function upgradeReminder(config: Config, o: ReminderOptions = {}): Promise<string | undefined> {
  if (!config.upgradeReminder || !config.source || !isVersion(config.kitVersion)) return undefined;
  const today = localDate(o.now ?? new Date());
  const state = readState(config.root);
  let versions: string[] | null;
  if (state.upgrade_check?.date === today) {
    versions = Array.isArray(state.upgrade_check.versions) ? state.upgrade_check.versions : null;
  } else {
    const timeoutMs = o.timeoutMs ?? LIMIT_MS;
    try {
      const source =
        o.source ??
        openSource(config.source, config.root, {
          timeoutMs,
          gh: "github" in config.source ? ghLoggedIn(timeoutMs) : false,
        });
      versions = await within(source.versions(), timeoutMs);
    } catch {
      versions = null;
    }
    try {
      const file = join(config.root, STATE_FILE);
      if (!existsSync(dirname(file))) mkdirSync(dirname(file), { recursive: true });
      writeFileSync(
        file,
        `${JSON.stringify({ ...state, upgrade_check: { date: today, versions } }, null, 2)}\n`,
      );
    } catch {
      // a read-only checkout only loses the cache
    }
  }
  if (!versions) return undefined;
  const newest = upgradePath(config.kitVersion, versions, config.channel).at(-1);
  return newest === undefined
    ? undefined
    : `Specfold ${newest} is available (installed ${config.kitVersion}): run node scripts/specfold.mjs upgrade (skill sf-upgrade)`;
}
