import { RESERVED } from "../bundle.ts";
import type { Finding } from "../findings.ts";
import type { Rule } from "./index.ts";

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const baseName = (rel: string) => rel.slice(rel.lastIndexOf("/") + 1);

/** Concept files are all Markdown files except index.md and log.md. */
export const isConcept = (rel: string) => !RESERVED.has(baseName(rel));

export const okf1: Rule = (file) => {
  if (!isConcept(file.rel)) return [];
  const finding = (message: string, line: number): Finding[] => [
    {
      rule: "OKF-1",
      severity: "error",
      path: file.rel,
      line,
      message,
      fix: "start the file with a YAML frontmatter block between --- lines",
    },
  ];
  if (!file.hasFrontmatter) return finding("missing YAML frontmatter", 1);
  if (file.frontmatterError) {
    return finding(
      `frontmatter is not valid YAML: ${file.frontmatterError.message}`,
      file.frontmatterError.line,
    );
  }
  if (!isRecord(file.frontmatter?.data)) return finding("frontmatter is not a mapping", 1);
  return [];
};

export const okf2: Rule = (file) => {
  const data = file.frontmatter?.data;
  if (!isConcept(file.rel) || !isRecord(data)) return [];
  if (typeof data.type === "string" && data.type.trim() !== "") return [];
  return [
    {
      rule: "OKF-2",
      severity: "error",
      path: file.rel,
      line: file.frontmatter?.lineOf("type") ?? 1,
      message: "frontmatter has no non-empty 'type'",
      fix: "add a 'type', for example 'type: Decision'",
    },
  ];
};
