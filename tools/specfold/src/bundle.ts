import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Document, LineCounter, parseDocument } from "yaml";

export const RESERVED = new Set(["index.md", "log.md"]);

export interface Entry {
  /** Path relative to the bundle root, forward slashes. */
  rel: string;
  isDir: boolean;
}

/** Every file and folder below the bundle root, sorted, skipping names that start with a dot. */
export function walk(bundleRoot: string): Entry[] {
  const out: Entry[] = [];
  const visit = (relDir: string) => {
    const dirents = readdirSync(join(bundleRoot, relDir), { withFileTypes: true })
      .filter((d) => !d.name.startsWith("."))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const d of dirents) {
      const rel = relDir ? `${relDir}/${d.name}` : d.name;
      out.push({ rel, isDir: d.isDirectory() });
      if (d.isDirectory()) visit(rel);
    }
  };
  visit("");
  return out;
}

export interface Frontmatter {
  data: unknown;
  /** 1-based line of a top-level key, or the line of the opening `---`. */
  lineOf: (key: string) => number;
}

export interface ParsedFile {
  rel: string;
  /** The file starts with a `---` line. */
  hasFrontmatter: boolean;
  frontmatter?: Frontmatter;
  frontmatterError?: { message: string; line: number };
  body: string;
  /** 1-based line number of the first body line. */
  bodyStartLine: number;
}

function keyLines(doc: Document, counter: LineCounter): Map<string, number> {
  const lines = new Map<string, number>();
  const contents = doc.contents as {
    items?: { key?: { value?: unknown; range?: [number, number, number] } }[];
  };
  for (const item of contents?.items ?? []) {
    const offset = item.key?.range?.[0];
    if (typeof item.key?.value === "string" && offset !== undefined) {
      lines.set(item.key.value, counter.linePos(offset).line + 1); // +1: the opening --- line
    }
  }
  return lines;
}

/** Splits a Markdown file into YAML frontmatter and body, keeping line numbers. */
export function parseFile(bundleRoot: string, rel: string): ParsedFile {
  return parseText(rel, readFileSync(join(bundleRoot, rel), "utf8"));
}

/** Like `parseFile`, for content that is already read, such as an older version from git. */
export function parseText(rel: string, raw: string): ParsedFile {
  const text = raw.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  if (lines[0] !== "---") return { rel, hasFrontmatter: false, body: text, bodyStartLine: 1 };

  const end = lines.findIndex((line, i) => i > 0 && (line === "---" || line === "..."));
  if (end === -1) {
    return {
      rel,
      hasFrontmatter: true,
      frontmatterError: { message: "frontmatter block is not closed with ---", line: 1 },
      body: "",
      bodyStartLine: lines.length + 1,
    };
  }
  const body = lines.slice(end + 1).join("\n");
  const bodyStartLine = end + 2;
  const counter = new LineCounter();
  // core schema: timestamps stay strings, so offset checks see the original text
  const doc = parseDocument(lines.slice(1, end).join("\n"), { lineCounter: counter, schema: "core" });
  const error = doc.errors[0];
  if (error) {
    const line = (error.linePos?.[0]?.line ?? 0) + 1;
    return {
      rel,
      hasFrontmatter: true,
      frontmatterError: { message: error.message.split("\n")[0] ?? "invalid YAML", line },
      body,
      bodyStartLine,
    };
  }
  const keys = keyLines(doc, counter);
  return {
    rel,
    hasFrontmatter: true,
    frontmatter: { data: doc.toJS(), lineOf: (key) => keys.get(key) ?? 1 },
    body,
    bodyStartLine,
  };
}
