import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isMap, parseDocument } from "yaml";
import { EnvError } from "../errors.ts";
import { LOCAL_FILE } from "../verify/login.ts";
import { yamlText } from "../yaml.ts";

export const LIMIT_VARIABLE = "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS";
export const LOCAL_SETTINGS = ".claude/settings.local.json";
/** Claude Code's own limit when nothing is set (checked 2026-10-28). */
export const TOOL_DEFAULT = 20;

export interface Limit {
  value: number | undefined;
  /** The variable or file the value came from, or "tool default". */
  source: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const positive = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

function readJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new EnvError(`${LOCAL_SETTINGS} is not valid JSON`);
  }
  if (!isRecord(data)) throw new EnvError(`${LOCAL_SETTINGS} is not a JSON object`);
  return data;
}

function readYaml(path: string) {
  const doc = parseDocument(existsSync(path) ? readFileSync(path, "utf8") : "");
  if (doc.errors[0]) throw new EnvError(`${LOCAL_FILE}: ${doc.errors[0].message.split("\n")[0]}`);
  if (doc.contents !== null && !isMap(doc.contents))
    throw new EnvError(`${LOCAL_FILE} is not a YAML mapping`);
  return doc;
}

/** The effective subagent limit: the environment, then the local Claude Code settings, then `.specfold/local.yaml`. */
export function readLimit(root: string, env: NodeJS.ProcessEnv = process.env): Limit {
  const fromEnv = positive(env[LIMIT_VARIABLE]);
  if (fromEnv !== undefined) return { value: fromEnv, source: `${LIMIT_VARIABLE} in the environment` };
  const settings = readJson(join(root, LOCAL_SETTINGS));
  const fromSettings = positive(isRecord(settings.env) ? settings.env[LIMIT_VARIABLE] : undefined);
  if (fromSettings !== undefined) return { value: fromSettings, source: LOCAL_SETTINGS };
  const fromLocal = positive(readYaml(join(root, LOCAL_FILE)).getIn(["parallel", "max_subagents"]));
  if (fromLocal !== undefined) return { value: fromLocal, source: LOCAL_FILE };
  return { value: undefined, source: "tool default" };
}

/** Writes `n` to both personal files, keeping every other key; returns the files that changed. */
export function writeLimit(root: string, n: number): string[] {
  const changed: string[] = [];
  const put = (rel: string, text: string) => {
    const path = join(root, rel);
    if (existsSync(path) && readFileSync(path, "utf8") === text) return;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    changed.push(rel);
  };
  const settings = readJson(join(root, LOCAL_SETTINGS));
  const env = isRecord(settings.env) ? settings.env : {};
  put(
    LOCAL_SETTINGS,
    `${JSON.stringify({ ...settings, env: { ...env, [LIMIT_VARIABLE]: String(n) } }, null, 2)}\n`,
  );
  const doc = readYaml(join(root, LOCAL_FILE));
  doc.setIn(["parallel", "max_subagents"], n);
  put(LOCAL_FILE, yamlText(doc));
  return changed;
}
