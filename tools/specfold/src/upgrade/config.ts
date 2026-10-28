// see knowledge: /decisions/upgrade-file-classes.md
import { isDeepStrictEqual } from "node:util";
import { isMap, parse, parseDocument, Scalar } from "yaml";
import { yamlText } from "../yaml.ts";

/** A config file after an upgrade: its text and whether it changed, or why it was left alone. */
export type ConfigMerge = { text: string; changed: boolean; notes: string[] } | { conflict: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface HookGroup {
  hooks?: { command?: unknown }[];
}

/** A hook group of Specfold's: every command runs `scripts/specfold.mjs`. */
const isSpecfoldGroup = (g: unknown) => {
  const hooks = (g as HookGroup | null)?.hooks;
  return (
    Array.isArray(hooks) &&
    hooks.length > 0 &&
    hooks.every((h) => String(h.command).includes("scripts/specfold.mjs"))
  );
};

/**
 * `.claude/settings.json` from `local`, the installed release's copy `base` and the new release's `next`:
 * deny rules the new release adds are added and those it drops are removed, Specfold's hook groups are
 * replaced, env values still equal to the base are updated, and missing top-level keys are added.
 * Without a base, nothing is removed or updated.
 */
export function upgradeSettings(local: string, base: string | undefined, next: string): ConfigMerge {
  let data: unknown;
  try {
    data = JSON.parse(local);
  } catch {
    return { conflict: "is not valid JSON" };
  }
  if (!isRecord(data)) return { conflict: "is not a JSON object" };
  const want = JSON.parse(next) as Record<string, unknown>;
  const was = (base ? JSON.parse(base) : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...data };
  const record = (v: unknown) => (isRecord(v) ? v : {});

  const denyOf = (v: unknown) => {
    const deny = record(v).deny;
    return Array.isArray(deny) ? deny : [];
  };
  if (data.permissions !== undefined && !isRecord(data.permissions))
    return { conflict: "has a 'permissions' value that is not an object" };
  const permissions = record(data.permissions);
  if (permissions.deny !== undefined && !Array.isArray(permissions.deny))
    return { conflict: "has a 'permissions.deny' value that is not a list" };
  const wanted = denyOf(want.permissions);
  const dropped = new Set(denyOf(was.permissions).filter((r) => !wanted.includes(r)));
  const kept = denyOf(permissions).filter((r) => !dropped.has(r));
  const deny = [...kept, ...wanted.filter((r) => !kept.includes(r))];
  if (deny.length > 0 || permissions.deny !== undefined) out.permissions = { ...permissions, deny };

  if (data.hooks !== undefined && !isRecord(data.hooks))
    return { conflict: "has a 'hooks' value that is not an object" };
  const hooks = record(data.hooks);
  const wantHooks = record(want.hooks);
  const outHooks: Record<string, unknown> = {};
  for (const event of new Set([...Object.keys(hooks), ...Object.keys(wantHooks)])) {
    const current = hooks[event] ?? [];
    if (!Array.isArray(current)) return { conflict: `has a '${event}' hook entry that is not a list` };
    const groups = [
      ...current.filter((g) => !isSpecfoldGroup(g)),
      ...((wantHooks[event] as unknown[]) ?? []),
    ];
    if (groups.length > 0) outHooks[event] = groups;
  }
  if (Object.keys(outHooks).length > 0 || data.hooks !== undefined) out.hooks = outHooks;

  if (data.env !== undefined && !isRecord(data.env))
    return { conflict: "has an 'env' value that is not an object" };
  const env = { ...record(data.env) };
  const wantEnv = record(want.env);
  const wasEnv = record(was.env);
  for (const [name, value] of Object.entries(wantEnv))
    if (!(name in env) || (name in wasEnv && env[name] === wasEnv[name])) env[name] = value;
  for (const name of Object.keys(wasEnv))
    if (!(name in wantEnv) && env[name] === wasEnv[name]) delete env[name];
  if (Object.keys(env).length > 0 || data.env !== undefined) out.env = env;

  for (const key of Object.keys(want))
    if (!["hooks", "permissions", "env"].includes(key) && !(key in out)) out[key] = want[key];
  if (isDeepStrictEqual(out, data)) return { text: local, changed: false, notes: [] };
  return { text: `${JSON.stringify(out, null, 2)}\n`, changed: true, notes: [] };
}

const withoutStack = (context: string) => context.replace(/^Stack:.*$/m, "").trimEnd();

function literal(text: string): Scalar {
  const node = new Scalar(text);
  node.type = Scalar.BLOCK_LITERAL;
  return node;
}

/**
 * `openspec/config.yaml` from `local`, `base` and `next`: `schema` is `specfold`; each key of `rules` and
 * `operations` still equal to the base takes the new value, new keys are added and dropped ones removed;
 * `context` is replaced when only its `Stack:` line differs from the base, keeping that line.
 */
export function upgradeOpenspecConfig(local: string, base: string | undefined, next: string): ConfigMerge {
  const doc = parseDocument(local);
  if (doc.errors[0]) return { conflict: `is not valid YAML: ${doc.errors[0].message.split("\n")[0]}` };
  if (!isMap(doc.contents)) return { conflict: "is not a YAML mapping" };
  const want = (parse(next) ?? {}) as Record<string, unknown>;
  const was = ((base ? parse(base) : undefined) ?? {}) as Record<string, unknown>;
  const notes: string[] = [];
  // re-serializing reformats the file, so it is written only after a real edit
  let touched = false;
  const edit = (apply: () => void) => {
    apply();
    touched = true;
  };
  if (doc.get("schema") !== "specfold") edit(() => doc.set("schema", "specfold"));

  const context = doc.get("context");
  const wantContext = want.context;
  if (
    typeof context === "string" &&
    typeof wantContext === "string" &&
    withoutStack(context) !== withoutStack(wantContext)
  ) {
    if (
      base !== undefined &&
      typeof was.context === "string" &&
      withoutStack(context) === withoutStack(was.context)
    ) {
      const stack = /^Stack:.*$/m.exec(context)?.[0];
      const text = stack ? wantContext.replace(/^Stack:.*$/m, stack) : wantContext;
      edit(() => doc.set("context", literal(text)));
    } else {
      notes.push("context was changed here; the new release's context was not applied");
    }
  }

  for (const section of ["rules", "operations"]) {
    const wantSection = isRecord(want[section]) ? want[section] : {};
    const wasSection = isRecord(was[section]) ? was[section] : {};
    if (!doc.has(section)) {
      if (Object.keys(wantSection).length > 0) edit(() => doc.set(section, doc.createNode(wantSection)));
      continue;
    }
    if (!isMap(doc.get(section))) {
      notes.push(`${section} is not a mapping; left as it is`);
      continue;
    }
    const current = (doc.toJS() as Record<string, Record<string, unknown>>)[section] ?? {};
    for (const [key, value] of Object.entries(wantSection)) {
      if (!(key in current)) edit(() => doc.setIn([section, key], doc.createNode(value)));
      else if (
        key in wasSection &&
        isDeepStrictEqual(current[key], wasSection[key]) &&
        !isDeepStrictEqual(current[key], value)
      )
        edit(() => doc.setIn([section, key], doc.createNode(value)));
    }
    for (const key of Object.keys(wasSection))
      if (!(key in wantSection) && key in current && isDeepStrictEqual(current[key], wasSection[key]))
        edit(() => doc.deleteIn([section, key]));
  }
  if (!touched) return { text: local, changed: false, notes };
  const text = yamlText(doc);
  return { text, changed: text !== local, notes };
}
