import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { parseText } from "../bundle.ts";
import { git } from "../git.ts";
import { matchesAny } from "../glob.ts";
import { SPECFOLD_TYPES, suggestType } from "./types.ts";

export type SourceKind =
  | "readme"
  | "docs"
  | "adr"
  | "contributing"
  | "wiki"
  | "agent-rules"
  | "spec-tool"
  | "okf-concept"
  | "okf-index";

export interface Source {
  path: string;
  kind: SourceKind;
  tokens: number;
  /** `okf-concept` only: the concept's `type`. */
  type?: string;
  /** `okf-concept` only: the Specfold type a migration suggests; absent when none is clear. */
  suggested?: string;
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

/** A Markdown file of an existing bundle: an index or log, or a concept with its type; undefined otherwise. */
export function classifyBundleFile(
  path: string,
  text: string,
): { kind: SourceKind; type?: string } | undefined {
  if (!path.startsWith("knowledge/") || !MARKDOWN.test(path)) return undefined;
  const name = path.split("/").at(-1) as string;
  if (name === "index.md" || name === "log.md") return { kind: "okf-index" };
  const data = parseText(path, text).frontmatter?.data as { type?: unknown } | undefined;
  const type = data?.type;
  return typeof type === "string" && type.trim() !== "" ? { kind: "okf-concept", type } : undefined;
}

/** The types a suggestion may keep: those of the repository's specfold.yaml, else the template's. */
function knownTypes(root: string): readonly string[] {
  try {
    const data = parse(readFileSync(join(root, "specfold.yaml"), "utf8")) as { types?: unknown } | null;
    if (Array.isArray(data?.types)) return data.types.map(String);
  } catch {
    // no or unreadable settings: the template's types
  }
  return SPECFOLD_TYPES;
}

/** Every tracked file that is a knowledge source, sorted by path; bundle files are classified first. */
export function inventory(root: string): Source[] {
  const tracked = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean).sort();
  const known = existsSync(join(root, "specfold.yaml")) ? knownTypes(root) : SPECFOLD_TYPES;
  const out: Source[] = [];
  for (const path of tracked) {
    let text = "";
    try {
      text = readFileSync(join(root, path), "utf8");
    } catch {
      // tracked but deleted in the working tree: counts as empty
    }
    const bundle = classifyBundleFile(path, text);
    const kind = bundle?.kind ?? classify(path);
    if (!kind) continue;
    const tokens = estimateTokens(text);
    if (bundle?.type === undefined) out.push({ path, kind, tokens });
    else {
      const suggested = suggestType(bundle.type, known);
      out.push({ path, kind, tokens, type: bundle.type, ...(suggested ? { suggested } : {}) });
    }
  }
  return out;
}
