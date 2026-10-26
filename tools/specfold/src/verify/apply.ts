import { parseText } from "../bundle.ts";
import { editFrontmatter } from "../sync/frontmatter.ts";
import { isRecord } from "../validate/okf.ts";

// actors and timestamps stay plain inside a flow mapping; anything else is quoted
const flowValue = (v: unknown) =>
  typeof v === "string" && /^[A-Za-z0-9][\w:.+/@-]*$/.test(v) ? v : JSON.stringify(v);

const flowEntry = (entry: unknown) =>
  isRecord(entry)
    ? `{ ${Object.entries(entry)
        .map(([k, v]) => `${k}: ${flowValue(v)}`)
        .join(", ")} }`
    : flowValue(entry);

const sameLogin = (entry: unknown, by: string) =>
  isRecord(entry) && typeof entry.by === "string" && entry.by.toLowerCase() === by.toLowerCase();

/**
 * Sets `status: stable` (unless `keepStatus`) and records `login`'s verification at `at`, replacing that
 * login's earlier entry.
 */
export function verifyText(text: string, login: string, at: string, keepStatus = false): string {
  const data = parseText("concept.md", text).frontmatter?.data;
  const current = isRecord(data) ? data.verified : undefined;
  const entries: unknown[] = Array.isArray(current) ? [...current] : current === undefined ? [] : [current];
  const by = `human:${login}`;
  const entry = { by, at };
  const index = entries.findIndex((e) => sameLogin(e, by));
  if (index === -1) entries.push(entry);
  else entries[index] = entry;
  const block =
    entries.length === 1
      ? [`verified: ${flowEntry(entries[0])}`]
      : ["verified:", ...entries.map((e) => `  - ${flowEntry(e)}`)];
  return editFrontmatter(text, {
    ...(keepStatus ? {} : { set: { status: "stable" } }),
    setBlock: { verified: block },
  }).text;
}
