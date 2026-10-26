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

const okf3 = (file: { rel: string }, line: number, message: string, fix: string): Finding => ({
  rule: "OKF-3",
  severity: "error",
  path: file.rel,
  line,
  message,
  fix,
});

function isCalendarDate(text: string): boolean {
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

export const okf3Index: Rule = (file) => {
  if (baseName(file.rel) !== "index.md" || !file.hasFrontmatter) return [];
  if (file.rel !== "index.md") {
    return [
      okf3(
        file,
        1,
        "folder index has frontmatter",
        "remove the frontmatter; only the bundle-root index may carry okf_version",
      ),
    ];
  }
  const data = file.frontmatter?.data;
  if (!isRecord(data)) {
    return [
      okf3(
        file,
        1,
        "root index frontmatter is not a mapping",
        "keep only 'okf_version: \"0.2\"' in the frontmatter",
      ),
    ];
  }
  return Object.keys(data)
    .filter((key) => key !== "okf_version")
    .map((key) =>
      okf3(
        file,
        file.frontmatter?.lineOf(key) ?? 1,
        `root index frontmatter has '${key}'`,
        `remove '${key}'; only okf_version is allowed`,
      ),
    );
};

export const okf3Log: Rule = (file) => {
  if (baseName(file.rel) !== "log.md") return [];
  if (file.hasFrontmatter) {
    return [
      okf3(file, 1, "log.md has frontmatter", "remove the frontmatter; log.md starts with an H1 title"),
    ];
  }
  const findings: Finding[] = [];
  let previous: string | undefined;
  file.body.split("\n").forEach((text, i) => {
    const heading = /^## (.*)$/.exec(text);
    if (!heading) return;
    const line = file.bodyStartLine + i;
    const date = heading[1]?.trim() ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isCalendarDate(date)) {
      findings.push(
        okf3(file, line, `log heading '${date}' is not a YYYY-MM-DD date`, "use '## YYYY-MM-DD' headings"),
      );
      return;
    }
    if (previous !== undefined && date >= previous) {
      findings.push(
        okf3(
          file,
          line,
          `log date ${date} is not older than ${previous}`,
          "order log dates newest first, one heading per date",
        ),
      );
    }
    previous = date;
  });
  return findings;
};
