import { isDeepStrictEqual } from "node:util";
import { ACTION_TABLE, ACTIONS, type ActionName, RETIRED } from "./actions.ts";

// see knowledge: /decisions/agent-permissions.md

export const LEVELS = ["allow", "ask", "deny"] as const;
export type Level = (typeof LEVELS)[number];

export const SETTINGS_FILE = ".claude/settings.json";
export const CLAUDE_TARGET = ".claude/skills";

export interface Problem {
  action: string;
  message: string;
}

export interface Change {
  pattern: string;
  from: Level | "none";
  to: Level | "none";
}

export type Desired = Record<Level, string[]>;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const strictness: Record<Level, number> = { allow: 0, ask: 1, deny: 2 };

/** The level of every action from the raw `permissions` value, or the problems that make it invalid. */
export function resolveLevels(setting: unknown): { levels: Record<ActionName, Level>; problems: Problem[] } {
  const levels = Object.fromEntries(ACTIONS.map((a) => [a, "ask"])) as Record<ActionName, Level>;
  const problems: Problem[] = [];
  if (setting === undefined || setting === null) return { levels, problems };
  if (!isRecord(setting)) {
    problems.push({ action: "permissions", message: "'permissions' must map action names to a level" });
    return { levels, problems };
  }
  for (const [name, level] of Object.entries(setting)) {
    if (!(ACTIONS as readonly string[]).includes(name)) {
      problems.push({
        action: name,
        message: `unknown action '${name}'; known actions: ${ACTIONS.join(", ")}`,
      });
    } else if (!(LEVELS as readonly unknown[]).includes(level)) {
      problems.push({
        action: name,
        message: `'${name}' has level '${String(level)}'; allowed levels: ${LEVELS.join(", ")}`,
      });
    } else {
      levels[name as ActionName] = level as Level;
    }
  }
  for (const action of ACTION_TABLE) {
    if (!action.parent) continue;
    const own = levels[action.name];
    const parent = levels[action.parent];
    if (strictness[own] < strictness[parent])
      problems.push({
        action: action.name,
        message: `'${action.name}: ${own}' is looser than '${action.parent}: ${parent}'; the ${action.parent} rule matches it too, so set it to ${parent} or stricter`,
      });
  }
  return { levels, problems };
}

/** The owned patterns per list, in the order of the action table. */
export function desiredRules(levels: Record<ActionName, Level>): Desired {
  const desired: Desired = { allow: [], ask: [], deny: [] };
  for (const action of ACTION_TABLE) desired[levels[action.name]].push(...action.patterns);
  return desired;
}

export type ApplyResult = { settings: Record<string, unknown>; changes: Change[] } | { conflict: string };

/**
 * Moves the owned patterns into their lists: retired ones leave every list, current ones leave the two
 * lists they don't belong in and are appended to their own when missing. Every other key and rule stays.
 */
export function applyRules(settings: Record<string, unknown>, desired: Desired): ApplyResult {
  if (settings.permissions !== undefined && !isRecord(settings.permissions))
    return { conflict: "has a 'permissions' value that is not an object" };
  const permissions = { ...((settings.permissions as Record<string, unknown> | undefined) ?? {}) };
  const lists = {} as Record<Level, string[]>;
  for (const level of LEVELS) {
    const list = permissions[level] ?? [];
    if (!Array.isArray(list)) return { conflict: `has a 'permissions.${level}' value that is not a list` };
    lists[level] = [...list];
  }
  const changes: Change[] = [];
  const remove = (level: Level, pattern: string) => {
    lists[level] = lists[level].filter((r) => r !== pattern);
  };
  for (const pattern of RETIRED)
    for (const level of LEVELS)
      if (lists[level].includes(pattern)) {
        remove(level, pattern);
        changes.push({ pattern, from: level, to: "none" });
      }
  for (const to of LEVELS)
    for (const pattern of desired[to]) {
      const wrong = LEVELS.filter((l) => l !== to && lists[l].includes(pattern));
      for (const from of wrong) {
        remove(from, pattern);
        changes.push({ pattern, from, to });
      }
      if (!lists[to].includes(pattern)) {
        lists[to].push(pattern);
        if (wrong.length === 0) changes.push({ pattern, from: "none", to });
      }
    }
  if (changes.length === 0) return { settings, changes };
  for (const level of LEVELS)
    if (lists[level].length > 0 || permissions[level] !== undefined) permissions[level] = lists[level];
  return { settings: { ...settings, permissions }, changes };
}

export interface Plan {
  /** `.claude/settings.json`, or null when no tool needs rendered rules. */
  target: string | null;
  problems: Problem[];
  changes: Change[];
  /** The new settings file text; undefined when nothing changes or nothing may be written. */
  text?: string;
  /** Set when the settings file can't be read as a JSON object. */
  conflict?: string;
}

/** The whole sync without I/O: `settingsText` is the current file, undefined when it is missing. */
export function planPermissions(
  setting: unknown,
  agentTargets: string[],
  settingsText: string | undefined,
): Plan {
  const { levels, problems } = resolveLevels(setting);
  const target = agentTargets.includes(CLAUDE_TARGET) ? SETTINGS_FILE : null;
  if (problems.length > 0 || target === null) return { target, problems, changes: [] };
  let settings: unknown = {};
  if (settingsText !== undefined) {
    try {
      settings = JSON.parse(settingsText);
    } catch {
      return { target, problems, changes: [], conflict: "is not valid JSON" };
    }
  }
  if (!isRecord(settings)) return { target, problems, changes: [], conflict: "is not a JSON object" };
  const result = applyRules(settings, desiredRules(levels));
  if ("conflict" in result) return { target, problems, changes: [], conflict: result.conflict };
  if (result.changes.length === 0 || isDeepStrictEqual(result.settings, settings))
    return { target, problems, changes: result.changes };
  return { target, problems, changes: result.changes, text: `${JSON.stringify(result.settings, null, 2)}\n` };
}
