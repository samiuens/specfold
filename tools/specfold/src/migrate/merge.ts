import { isMap, parse, parseDocument, Scalar } from "yaml";
import { OWNED } from "../permissions/actions.ts";
import { yamlText } from "../yaml.ts";
import type { Merged } from "./blocks.ts";

const STACK_PLACEHOLDER = /^(\s*)Stack: <filled by specfold init or sf-migrate>$/m;

/** The template's config.yaml with its `Stack:` placeholder filled; unchanged without a stack. */
export const fillStack = (configText: string, stack: string | undefined) =>
  stack ? configText.replace(STACK_PLACEHOLDER, `$1Stack: ${stack}`) : configText;

interface HookGroup {
  hooks?: { command?: unknown }[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const commandsOf = (groups: unknown): string[] =>
  Array.isArray(groups)
    ? groups.flatMap((g: HookGroup) => (g.hooks ?? []).map((h) => String(h.command)))
    : [];

/**
 * Adds each hook group of the template whose commands are all missing under its event, each missing
 * `permissions.deny` rule after the existing ones, each `env` variable not yet set and each other
 * top-level key the file lacks; keeps every value that is already there.
 */
export function mergeSettings(existing: string | undefined, template: string): Merged {
  if (existing === undefined) return { text: template, changed: true };
  let data: unknown;
  try {
    data = JSON.parse(existing);
  } catch {
    return { conflict: "is not valid JSON" };
  }
  if (!isRecord(data)) return { conflict: "is not a JSON object" };
  const parsed = JSON.parse(template) as {
    hooks?: Record<string, HookGroup[]>;
    permissions?: { deny?: string[] };
    env?: Record<string, string>;
    [key: string]: unknown;
  };
  const wanted = parsed.hooks ?? {};
  const wantedDeny = (parsed.permissions?.deny ?? []).filter((rule) => !OWNED.has(rule));
  if (data.permissions !== undefined && !isRecord(data.permissions))
    return { conflict: "has a 'permissions' value that is not an object" };
  const permissions: Record<string, unknown> = isRecord(data.permissions) ? data.permissions : {};
  if (permissions.deny !== undefined && !Array.isArray(permissions.deny))
    return { conflict: "has a 'permissions.deny' value that is not a list" };
  const deny = (permissions.deny as unknown[] | undefined) ?? [];
  const missingDeny = wantedDeny.filter((rule) => !deny.includes(rule));
  if (data.hooks !== undefined && !isRecord(data.hooks))
    return { conflict: "has a 'hooks' value that is not an object" };
  const hooks: Record<string, unknown> = isRecord(data.hooks) ? data.hooks : {};
  let changed = false;
  for (const [event, groups] of Object.entries(wanted)) {
    const current = hooks[event];
    if (current !== undefined && !Array.isArray(current))
      return { conflict: `has a '${event}' hook entry that is not a list` };
    const present = new Set(commandsOf(current));
    const added = groups.filter((g) => !commandsOf([g]).some((c) => present.has(c)));
    if (added.length === 0) continue;
    hooks[event] = [...((current as unknown[]) ?? []), ...added];
    changed = true;
  }
  if (data.env !== undefined && !isRecord(data.env))
    return { conflict: "has an 'env' value that is not an object" };
  const env: Record<string, unknown> = isRecord(data.env) ? data.env : {};
  const missingEnv = Object.entries(parsed.env ?? {}).filter(([name]) => !(name in env));
  const missingKeys = Object.keys(parsed).filter(
    (key) => !["hooks", "permissions", "env"].includes(key) && !(key in data),
  );
  if (!changed && missingDeny.length === 0 && missingEnv.length === 0 && missingKeys.length === 0)
    return { text: existing, changed: false };
  const out: Record<string, unknown> = { ...data };
  for (const key of missingKeys) out[key] = parsed[key];
  if (missingEnv.length > 0) out.env = { ...env, ...Object.fromEntries(missingEnv) };
  if (missingDeny.length > 0) out.permissions = { ...permissions, deny: [...deny, ...missingDeny] };
  if (changed) out.hooks = hooks;
  return { text: `${JSON.stringify(out, null, 2)}\n`, changed: true };
}

/**
 * Makes an existing openspec/config.yaml use the specfold schema: keeps context, rules and comments,
 * adds the template's missing rules keys (or context and rules when absent) and a `Stack:` line.
 */
export function mergeOpenspecConfig(existing: string, template: string, stack: string | undefined): Merged {
  const doc = parseDocument(existing);
  if (doc.errors[0]) return { conflict: `is not valid YAML: ${doc.errors[0].message.split("\n")[0]}` };
  if (!isMap(doc.contents)) return { conflict: "is not a YAML mapping" };
  const wanted = parse(fillStack(template, stack)) as { context?: string; rules?: Record<string, unknown> };
  // re-serializing reformats the file, so it is written only after a real edit
  let touched = false;
  const edit = (apply: () => void) => {
    apply();
    touched = true;
  };
  if (doc.get("schema") !== "specfold") edit(() => doc.set("schema", "specfold"));
  const context = doc.get("context");
  if (context === undefined && wanted.context !== undefined) {
    const value = wanted.context;
    edit(() => doc.set("context", literal(value)));
  } else if (typeof context === "string" && stack && !/^Stack:/m.test(context)) {
    edit(() => doc.set("context", literal(`${context.replace(/\n*$/, "\n")}Stack: ${stack}\n`)));
  }
  if (!doc.has("rules")) {
    const rules = wanted.rules;
    if (rules) edit(() => doc.set("rules", doc.createNode(rules)));
  } else if (isMap(doc.get("rules"))) {
    for (const [key, value] of Object.entries(wanted.rules ?? {}))
      if (!doc.hasIn(["rules", key])) edit(() => doc.setIn(["rules", key], doc.createNode(value)));
  }
  if (!touched) return { text: existing, changed: false };
  const text = yamlText(doc);
  return { text, changed: text !== existing };
}

function literal(text: string): Scalar {
  const node = new Scalar(text);
  node.type = Scalar.BLOCK_LITERAL;
  return node;
}
