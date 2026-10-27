import { isMap, parse, parseDocument, Scalar } from "yaml";
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

/** Adds each hook group of the template whose commands are all missing under its event; keeps every other key. */
export function mergeSettings(existing: string | undefined, template: string): Merged {
  if (existing === undefined) return { text: template, changed: true };
  let data: unknown;
  try {
    data = JSON.parse(existing);
  } catch {
    return { conflict: "is not valid JSON" };
  }
  if (!isRecord(data)) return { conflict: "is not a JSON object" };
  const wanted = (JSON.parse(template) as { hooks?: Record<string, HookGroup[]> }).hooks ?? {};
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
  if (!changed) return { text: existing, changed: false };
  return { text: `${JSON.stringify({ ...data, hooks }, null, 2)}\n`, changed: true };
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
  if (doc.get("schema") !== "specfold") doc.set("schema", "specfold");
  const context = doc.get("context");
  if (context === undefined && wanted.context !== undefined) {
    doc.set("context", literal(wanted.context));
  } else if (typeof context === "string" && stack && !/^Stack:/m.test(context)) {
    doc.set("context", literal(`${context.replace(/\n*$/, "\n")}Stack: ${stack}\n`));
  }
  if (!doc.has("rules")) {
    if (wanted.rules) doc.set("rules", doc.createNode(wanted.rules));
  } else if (isMap(doc.get("rules"))) {
    for (const [key, value] of Object.entries(wanted.rules ?? {}))
      if (!doc.hasIn(["rules", key])) doc.setIn(["rules", key], doc.createNode(value));
  }
  const text = String(doc);
  return { text, changed: text !== existing };
}

function literal(text: string): Scalar {
  const node = new Scalar(text);
  node.type = Scalar.BLOCK_LITERAL;
  return node;
}
