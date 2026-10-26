import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HEADINGS: Record<string, string[]> = {
  Term: ["Meaning", "Not to be confused with", "Related"],
  "Business Rule": ["Rule", "Why", "Related"],
  Component: ["Responsibility", "Interfaces", "Related"],
  "Data Flow": ["Flow", "Related"],
  Interface: ["Contract summary", "Consumers", "Related"],
  Decision: ["Decision", "Why", "Rejected alternatives", "Related"],
  Capability: ["Why", "Related"],
  Convention: ["Convention", "Why", "Related"],
  Runbook: ["When to use", "Steps", "Verify", "Related"],
  Reference: ["Summary", "Related"],
  Vision: ["Goals", "Non-goals", "Principles"],
  "Deferred Commitment": ["Commitment", "Trigger", "Related"],
  "Backlog Item": ["Idea", "Related"],
};
const GENERIC = ["Summary", "Related"];

export const TEMPLATE_DIR = ".agents/skills/sf-capture/templates";

/** `Business Rule` → `business-rule`. */
export const typeSlug = (type: string) => type.trim().toLowerCase().replace(/\s+/g, "-");

/** The built-in body for a type: its headings, separated by blank lines. */
export function builtInBody(type: string): string {
  return `${(HEADINGS[type] ?? GENERIC).map((h) => `# ${h}`).join("\n\n")}\n`;
}

export type Placeholders = Record<"type" | "title" | "description" | "by" | "now", string>;

/** The override template file for a type, with placeholders replaced, or undefined when there is none. */
export function overrideTemplate(repoRoot: string, type: string, values: Placeholders): string | undefined {
  const path = join(repoRoot, TEMPLATE_DIR, `${typeSlug(type)}.md`);
  if (!existsSync(path)) return undefined;
  return readFileSync(path, "utf8").replace(
    /\{\{(type|title|description|by|now)\}\}/g,
    (_, key: keyof Placeholders) => values[key],
  );
}
