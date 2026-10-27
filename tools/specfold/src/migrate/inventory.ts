import { readFileSync } from "node:fs";
import { join } from "node:path";
import { git } from "../git.ts";
import { matchesAny } from "../glob.ts";

export type SourceKind = "readme" | "docs" | "adr" | "contributing" | "wiki" | "agent-rules" | "spec-tool";

export interface Source {
  path: string;
  kind: SourceKind;
  tokens: number;
}

const AGENT_RULES = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".cursorrules",
  ".windsurfrules",
  ".clinerules",
  ".cursor/rules/**",
  ".github/copilot-instructions.md",
];
const SPEC_TOOLS = ["openspec/**", ".specify/**", ".kiro/specs/**"];
const MARKDOWN = /\.(md|mdx|markdown)$/i;
const DOC_TEXT = /\.(md|mdx|markdown|rst|adoc|txt)$/i;
const ADR_FOLDERS = new Set(["adr", "adrs", "decisions", "decision-records"]);

/** The kind of a knowledge source, first match wins; undefined for every other file. */
export function classify(path: string): SourceKind | undefined {
  const parts = path.split("/");
  const name = parts.at(-1) as string;
  const folders = parts.slice(0, -1);
  if (matchesAny(path, AGENT_RULES)) return "agent-rules";
  if (matchesAny(path, SPEC_TOOLS)) return "spec-tool";
  if (MARKDOWN.test(name) && folders.some((f) => ADR_FOLDERS.has(f.toLowerCase()))) return "adr";
  if (MARKDOWN.test(name) && folders.some((f) => f.toLowerCase() === "wiki")) return "wiki";
  if (/^readme(\.|$)/i.test(name)) return "readme";
  if (/^contributing(\.|$)/i.test(name)) return "contributing";
  if (DOC_TEXT.test(name) && (folders[0] === "docs" || folders[0] === "doc")) return "docs";
  return undefined;
}

/** A rough token count: characters divided by 4, rounded up. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/** Every tracked file that is a knowledge source, sorted by path. */
export function inventory(root: string): Source[] {
  const tracked = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean).sort();
  const out: Source[] = [];
  for (const path of tracked) {
    const kind = classify(path);
    if (!kind) continue;
    let text = "";
    try {
      text = readFileSync(join(root, path), "utf8");
    } catch {
      // tracked but deleted in the working tree: counts as empty
    }
    out.push({ path, kind, tokens: estimateTokens(text) });
  }
  return out;
}
