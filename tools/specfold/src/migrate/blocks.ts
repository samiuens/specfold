// see knowledge: /decisions/managed-blocks.md

export type BlockStyle = "markdown" | "hash";

export type Merged = { text: string; changed: boolean } | { conflict: string };

const MARKERS: Record<BlockStyle, [string, string]> = {
  markdown: ["<!-- specfold:start -->", "<!-- specfold:end -->"],
  hash: ["# specfold:start", "# specfold:end"],
};

/** `.gitignore` and `CODEOWNERS` take hash comments; everything else here is Markdown. */
export const blockStyle = (path: string): BlockStyle => (path.endsWith(".md") ? "markdown" : "hash");

/**
 * Puts `content` between Specfold's markers in `existing`: replaces the block when the markers exist,
 * otherwise adds it at the top (Markdown) or the end (hash comments). Text outside the markers is kept.
 */
export function applyBlock(existing: string | undefined, content: string, style: BlockStyle): Merged {
  const [start, end] = MARKERS[style];
  const block = [start, ...content.replace(/\s+$/, "").split("\n"), end];
  if (existing === undefined || existing === "") return { text: `${block.join("\n")}\n`, changed: true };
  const lines = existing.split("\n");
  const from = lines.findIndex((l) => l.trim() === start);
  const to = lines.findIndex((l, i) => i > from && l.trim() === end);
  const strayEnd = lines.some((l) => l.trim() === end);
  let text: string;
  if (from !== -1 && to !== -1) {
    text = [...lines.slice(0, from), ...block, ...lines.slice(to + 1)].join("\n");
  } else if (from !== -1 || strayEnd) {
    return {
      conflict: `has a ${from !== -1 ? "specfold:start marker without an end" : "stray specfold:end marker"}`,
    };
  } else if (style === "markdown") {
    text = `${block.join("\n")}\n\n${existing}`;
  } else {
    text = `${existing}${existing.endsWith("\n") ? "" : "\n"}\n${block.join("\n")}\n`;
  }
  return { text, changed: text !== existing };
}
