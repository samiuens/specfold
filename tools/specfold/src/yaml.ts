import { writeFileSync } from "node:fs";
import { Document, parseDocument } from "yaml";
import { EnvError } from "./errors.ts";

/** A YAML document as text without folding long lines; the library folds at 80 characters by default. */
export const yamlText = (doc: Document) => doc.toString({ lineWidth: 0 });

/** One change to a YAML source text: the characters from `start` to `end` become `text`. */
export interface Edit {
  start: number;
  end: number;
  text: string;
}

/** Applies edits that do not overlap; edits at the same offset keep their order. */
export function applyEdits(source: string, edits: Edit[]): string {
  const ordered = edits
    .map((edit, i) => ({ edit, i }))
    .sort((a, b) => b.edit.start - a.edit.start || b.i - a.i);
  let out = source;
  for (const { edit } of ordered) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  return out;
}

/** Offset of the end of the line on which the node's content ends. */
export function contentLineEnd(source: string, node: { range?: [number, number, number] | null }): number {
  let i = node.range?.[1] ?? source.length;
  while (i > 0 && /\s/.test(source[i - 1] ?? "")) i--;
  const newline = source.indexOf("\n", i);
  if (newline === -1) return source.length;
  return source[newline - 1] === "\r" ? newline - 1 : newline;
}

/** Number of leading spaces of the line that holds `offset`. */
export function indentAt(source: string, offset: number): number {
  const start = source.lastIndexOf("\n", offset - 1) + 1;
  return /^ */.exec(source.slice(start))?.[0].length ?? 0;
}

/** `value` as YAML text without folding long lines, every line indented by `indent` spaces, no trailing newline. */
export function yamlBlock(value: unknown, indent: number, step = 2): string {
  const text = new Document(value).toString({ lineWidth: 0, indent: step }).trimEnd();
  const pad = " ".repeat(indent);
  return text
    .split("\n")
    .map((line) => (line === "" ? line : pad + line))
    .join("\n");
}

/** A node with a source range. */
export type Ranged = { range?: [number, number, number] | null };

/** Offset where the node starts in the source, 0 when unknown. */
export const startOf = (node: unknown): number => (node as Ranged).range?.[0] ?? 0;

/**
 * Text edits against one YAML file; the file is written only when the edited text parses and holds what
 * was added. see knowledge: /decisions/splice-hook-manager-yaml.md
 */
export class Splice {
  private edits: Edit[] = [];
  private appended: string[] = [];
  /** The file's line ending; inserted text uses it. */
  private readonly eol: string;
  constructor(
    private readonly name: string,
    private readonly path: string,
    private readonly source: string,
  ) {
    this.eol = source.includes("\r\n") ? "\r\n" : "\n";
  }

  private lines(text: string): string {
    return this.eol === "\n" ? text : text.replace(/\n/g, this.eol);
  }

  /** A new line after the line on which `node` ends. */
  after(node: unknown, block: string): void {
    const at = contentLineEnd(this.source, node as Ranged);
    this.edits.push({ start: at, end: at, text: this.lines(`\n${block}`) });
  }

  /** The node's own text becomes `text`. */
  replace(node: unknown, text: string): void {
    const range = (node as Ranged).range;
    if (range)
      this.edits.push({
        start: range[0],
        end: range[1],
        text: this.lines(text),
      });
  }

  /** The node's own text becomes a block on the next lines; the space before the node goes with it. */
  fill(node: unknown, block: string): void {
    const range = (node as Ranged).range;
    if (!range) return;
    let start = range[0];
    while (start > 0 && /[ \t]/.test(this.source[start - 1] ?? "")) start--;
    this.edits.push({ start, end: range[1], text: this.lines(`\n${block}`) });
  }

  /** A top-level block at the end of the file. */
  append(block: string): void {
    this.appended.push(block);
  }

  /** Writes the file when the edited text parses and `holds` finds every entry; otherwise writes nothing. */
  commit(holds: (doc: Document) => boolean): void {
    const edits = [...this.edits];
    if (this.appended.length > 0) {
      const lead = this.source === "" || this.source.endsWith("\n") ? "" : this.eol;
      const end = this.source.length;
      edits.push({
        start: end,
        end,
        text: lead + this.lines(`${this.appended.join("\n")}\n`),
      });
    }
    const text = applyEdits(this.source, edits);
    const check = parseDocument(text);
    if (check.errors.length > 0 || !holds(check))
      throw new EnvError(
        `${this.name}: the Specfold entries could not be added safely; nothing was written, add them by hand`,
      );
    writeFileSync(this.path, text);
  }
}
