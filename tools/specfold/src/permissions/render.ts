import { ACTION_TABLE, ACTIONS, type ActionName } from "./actions.ts";

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
