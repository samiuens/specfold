import { parse, stringify } from "yaml";
import { scalar } from "../new/command.ts";

export interface Source {
  id: string;
  resource: string;
}

export interface FrontmatterEdit {
  /** Keys to set; a key is only rewritten when its value differs. New keys go before `generated`. */
  set?: Record<string, string>;
  /** Sources to append unless one with the same `resource` exists. */
  addSources?: Source[];
  /** Keys mapped to their complete lines (`key: ...` plus continuation lines); new keys go right after `generated`. */
  setBlock?: Record<string, string[]>;
}

export interface EditResult {
  text: string;
  setKeys: string[];
  addedSources: string[];
}

/** Paths and ids stay plain (`../../x.md`, `2026-10-26-add-x`); anything else goes through `scalar`. */
const yamlValue = (value: string) =>
  /^[A-Za-z0-9._/][A-Za-z0-9._/-]*$/.test(value) &&
  /[A-Za-z]/.test(value) &&
  !/^(?:true|false|null|yes|no|on|off)$/i.test(value)
    ? value
    : scalar(value);

const TOP_KEY = /^([A-Za-z_][\w-]*):(?:\s|$)/;

/** Line range [start, end) of a top-level key, including its indented continuation lines. */
function keyRange(lines: string[], key: string): [number, number] | undefined {
  const start = lines.findIndex((l) => TOP_KEY.exec(l)?.[1] === key);
  if (start === -1) return undefined;
  let end = start + 1;
  while (end < lines.length && /^(?:\s|-|$)/.test(lines[end] as string)) end++;
  while (end > start + 1 && (lines[end - 1] as string).trim() === "") end--;
  return [start, end];
}

/**
 * Applies `edit` to a concept's frontmatter by editing lines, so the body and every untouched key,
 * comment and flow collection keep their exact text.
 */
export function editFrontmatter(text: string, edit: FrontmatterEdit): EditResult {
  const unchanged = { text, setKeys: [], addedSources: [] };
  const all = text.split("\n");
  if (all[0] !== "---") return unchanged;
  const close = all.findIndex((l, i) => i > 0 && (l === "---" || l === "..."));
  if (close === -1) return unchanged;
  const lines = all.slice(1, close);
  let data: Record<string, unknown>;
  try {
    data = (parse(lines.join("\n"), { schema: "core" }) ?? {}) as Record<string, unknown>;
  } catch {
    return unchanged;
  }

  const setKeys: string[] = [];
  for (const [key, value] of Object.entries(edit.set ?? {})) {
    if (data[key] === value) continue;
    const line = `${key}: ${yamlValue(value)}`;
    const range = keyRange(lines, key);
    if (range) lines.splice(range[0], range[1] - range[0], line);
    else {
      const generated = keyRange(lines, "generated");
      lines.splice(generated ? generated[0] : lines.length, 0, line);
    }
    setKeys.push(key);
  }

  for (const [key, block] of Object.entries(edit.setBlock ?? {})) {
    const range = keyRange(lines, key);
    if (range) {
      if (lines.slice(range[0], range[1]).join("\n") === block.join("\n")) continue;
      lines.splice(range[0], range[1] - range[0], ...block);
    } else {
      const generated = keyRange(lines, "generated");
      lines.splice(generated ? generated[1] : lines.length, 0, ...block);
    }
    setKeys.push(key);
  }

  const addedSources: string[] = [];
  const linked = new Set(
    (Array.isArray(data.sources) ? data.sources : []).map((s) => (s as { resource?: unknown })?.resource),
  );
  for (const source of edit.addSources ?? []) {
    if (linked.has(source.resource)) continue;
    linked.add(source.resource);
    const entry = [`  - id: ${yamlValue(source.id)}`, `    resource: ${yamlValue(source.resource)}`];
    const range = keyRange(lines, "sources");
    if (!range) lines.push("sources:", ...entry);
    else if (range[1] - range[0] > 1) lines.splice(range[1], 0, ...entry);
    else {
      // A one-line `sources: [...]`: rewrite it as a block list holding the old entries first.
      const old = Array.isArray(data.sources) ? data.sources : [];
      const block =
        old.length > 0
          ? stringify(old, { lineWidth: 0 })
              .trimEnd()
              .split("\n")
              .map((l) => `  ${l}`)
          : [];
      lines.splice(range[0], 1, "sources:", ...block, ...entry);
    }
    addedSources.push(source.id);
  }

  if (setKeys.length === 0 && addedSources.length === 0) return unchanged;
  return { text: ["---", ...lines, ...all.slice(close)].join("\n"), setKeys, addedSources };
}
