import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ParsedFile } from "../bundle.ts";
import type { Rule } from "./index.ts";
import { isConcept, isRecord } from "./okf.ts";
import { resolveInBundle } from "./profile.ts";

export const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

export interface BodyLink {
  /** The link target as written. */
  target: string;
  /** Absolute path the target resolves to inside the bundle, or undefined when it leaves the bundle. */
  abs: string | undefined;
  line: number;
}

/** Bundle-internal Markdown links in a concept body, skipping URLs, anchors, fenced code and inline code. */
export function bodyLinks(file: ParsedFile, bundleRoot: string): BodyLink[] {
  const links: BodyLink[] = [];
  let fence: string | undefined;
  file.body.split("\n").forEach((text, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(text)?.[1];
    if (marker) {
      if (fence === undefined) fence = marker[0];
      else if (marker[0] === fence) fence = undefined;
      return;
    }
    if (fence !== undefined) return;
    for (const match of text.replace(/`[^`]*`/g, "").matchAll(LINK)) {
      const target = match[1] ?? "";
      if (SCHEME.test(target) || target.startsWith("#")) continue;
      let decoded = target;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        // keep the raw target
      }
      links.push({
        target,
        abs: resolveInBundle(bundleRoot, file.rel, decoded),
        line: file.bodyStartLine + i,
      });
    }
  });
  return links;
}

/** L1: bundle-absolute and relative Markdown links in a concept body resolve inside the bundle. */
export const l1: Rule = (file, ctx) => {
  if (!isConcept(file.rel) || !isRecord(file.frontmatter?.data)) return [];
  const severity = ctx.config?.blockOnBrokenLinks === false ? "warning" : "error";
  return bodyLinks(file, ctx.bundleRoot)
    .filter((link) => !(link.abs && existsSync(link.abs)))
    .map((link) => ({
      rule: "L1",
      severity,
      path: file.rel,
      line: link.line,
      message: `broken link '${link.target}'`,
      fix: "point the link at an existing concept, bundle-absolute like /decisions/x.md",
    }));
};

/** L2: non-URL `resource` values resolve to existing files, bundle-absolute or relative to the concept. */
export const l2: Rule = (file, ctx) => {
  const data = file.frontmatter?.data;
  if (!isConcept(file.rel) || !isRecord(data)) return [];
  const checks: { key: string; value: string }[] = [];
  if (typeof data.resource === "string") checks.push({ key: "resource", value: data.resource });
  if (Array.isArray(data.sources)) {
    for (const s of data.sources) {
      if (isRecord(s) && typeof s.resource === "string") checks.push({ key: "sources", value: s.resource });
    }
  }
  return checks
    .filter(({ value }) => {
      if (SCHEME.test(value) || value.trim() === "") return false;
      const path = value.split("#")[0] ?? "";
      const abs = path.startsWith("/")
        ? join(ctx.bundleRoot, path)
        : join(ctx.bundleRoot, dirname(file.rel), path);
      return !existsSync(abs);
    })
    .map(({ key, value }) => ({
      rule: "L2",
      severity: "error" as const,
      path: file.rel,
      line: file.frontmatter?.lineOf(key) ?? 1,
      message: `resource '${value}' does not exist`,
      fix: "use a URL, a bundle-absolute path or a path relative to this concept",
    }));
};
