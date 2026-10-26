import type { ParsedFile } from "../bundle.ts";
import type { Finding } from "../findings.ts";
import type { BundleRule, Rule } from "./index.ts";
import { isConcept, isRecord } from "./okf.ts";

/** Frontmatter of a concept that passed OKF-1 and OKF-2, or undefined. */
function conceptData(file: ParsedFile): Record<string, unknown> | undefined {
  const data = file.frontmatter?.data;
  if (!isConcept(file.rel) || !isRecord(data)) return undefined;
  return typeof data.type === "string" && data.type.trim() !== "" ? data : undefined;
}

function finding(rule: string, file: ParsedFile, key: string | null, message: string, fix: string): Finding {
  return {
    rule,
    severity: "error",
    path: file.rel,
    line: key === null ? 1 : (file.frontmatter?.lineOf(key) ?? 1),
    message,
    fix,
  };
}

const nonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export const p1: Rule = (file, ctx) => {
  const data = conceptData(file);
  const types = ctx.config?.types ?? [];
  if (!data || types.includes(data.type as string)) return [];
  return [
    finding(
      "P1",
      file,
      "type",
      `type '${data.type}' is not in specfold.yaml types`,
      `use one of: ${types.join(", ")}`,
    ),
  ];
};

export const p2: Rule = (file) => {
  const data = conceptData(file);
  if (!data) return [];
  const findings: Finding[] = [];
  if (!nonEmptyString(data.title)) {
    findings.push(finding("P2", file, "title", "missing or empty 'title'", "add a short 'title'"));
  }
  const description = data.description;
  if (!nonEmptyString(description)) {
    findings.push(
      finding("P2", file, "description", "missing or empty 'description'", "add a one-line 'description'"),
    );
  } else if (/[\r\n]/.test(description.trim())) {
    findings.push(
      finding(
        "P2",
        file,
        "description",
        "'description' spans several lines",
        "write the description as one line",
      ),
    );
  } else if ([...description].length > 160) {
    findings.push(
      finding(
        "P2",
        file,
        "description",
        `'description' has ${[...description].length} characters (max 160)`,
        "shorten the description to 160 characters",
      ),
    );
  }
  return findings;
};

const STATUSES = ["draft", "stable", "deprecated"];

export const p3: Rule = (file) => {
  const data = conceptData(file);
  if (!data || STATUSES.includes(data.status as string)) return [];
  const message =
    data.status === undefined ? "missing 'status'" : `status '${String(data.status)}' is not allowed`;
  return [
    finding(
      "P3",
      file,
      data.status === undefined ? null : "status",
      message,
      `set 'status' to ${STATUSES.join(", ")}`,
    ),
  ];
};

const ACTOR = /^(?:human:\S+|process:\S+|[^\s/:]+\/\S+)$/;

export const p4: Rule = (file) => {
  const data = conceptData(file);
  if (!data) return [];
  if (data.generated === undefined && data.verified === undefined) {
    return [
      finding(
        "P4",
        file,
        null,
        "neither 'generated' nor 'verified' is set",
        "add 'generated: { by: <actor>, at: <timestamp> }'",
      ),
    ];
  }
  const findings: Finding[] = [];
  const checkStamp = (key: string, value: unknown) => {
    if (!isRecord(value) || value.by === undefined || value.at === undefined) {
      findings.push(
        finding(
          "P4",
          file,
          key,
          `'${key}' entries need 'by' and 'at'`,
          "write '{ by: <actor>, at: <timestamp> }'",
        ),
      );
      return;
    }
    if (typeof value.by !== "string" || !ACTOR.test(value.by)) {
      findings.push(
        finding(
          "P4",
          file,
          key,
          `actor '${String(value.by)}' in '${key}' is malformed`,
          "use '<producer>/<version>', 'human:<id>' or 'process:<id>'",
        ),
      );
    }
  };
  if (data.generated !== undefined) checkStamp("generated", data.generated);
  if (data.verified !== undefined) {
    const entries = Array.isArray(data.verified) ? data.verified : [data.verified];
    for (const entry of entries) checkStamp("verified", entry);
  }
  return findings;
};

const TIMESTAMP = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function isTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const match = TIMESTAMP.exec(value);
  return (
    match !== null &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${match[1]}T00:00:00Z`).toISOString().startsWith(match[1] ?? "")
  );
}

export const p5: Rule = (file) => {
  const data = conceptData(file);
  if (!data) return [];
  const checks: { key: string; label: string; value: unknown }[] = [];
  if (isRecord(data.generated))
    checks.push({ key: "generated", label: "generated.at", value: data.generated.at });
  const verified = Array.isArray(data.verified)
    ? data.verified
    : data.verified === undefined
      ? []
      : [data.verified];
  for (const v of verified)
    if (isRecord(v)) checks.push({ key: "verified", label: "verified.at", value: v.at });
  if (data.stale_after !== undefined)
    checks.push({ key: "stale_after", label: "stale_after", value: data.stale_after });
  if (Array.isArray(data.sources)) {
    for (const s of data.sources) {
      if (isRecord(s) && s.last_modified !== undefined) {
        checks.push({ key: "sources", label: "sources.last_modified", value: s.last_modified });
      }
    }
  }
  return checks
    .filter((c) => c.value !== undefined && !isTimestamp(c.value))
    .map((c) =>
      finding(
        "P5",
        file,
        c.key,
        `${c.label} '${String(c.value)}' is not an ISO 8601 date-time with offset`,
        "write it like 2026-10-26T10:00:00Z or 2026-10-26T10:00:00+01:00",
      ),
    );
};

export const p6: Rule = (file) => {
  const data = conceptData(file);
  if (!data) return [];
  if (data.sources === undefined) {
    return data.type === "Decision"
      ? [
          finding(
            "P6",
            file,
            null,
            "a Decision needs 'sources'",
            "add 'sources' with at least one { id, resource } entry",
          ),
        ]
      : [];
  }
  if (!Array.isArray(data.sources) || (data.type === "Decision" && data.sources.length === 0)) {
    return [
      finding(
        "P6",
        file,
        "sources",
        "'sources' must be a non-empty list",
        "list sources as '- { id, resource }' entries",
      ),
    ];
  }
  return data.sources
    .filter((s) => !isRecord(s) || !nonEmptyString(s.resource))
    .map(() =>
      finding(
        "P6",
        file,
        "sources",
        "a 'sources' entry has no 'resource'",
        "give every source a 'resource' path or URL",
      ),
    );
};

const NEEDS_STALE_AFTER = ["Runbook", "Interface"];

export const p7: Rule = (file) => {
  const data = conceptData(file);
  if (!data || !NEEDS_STALE_AFTER.includes(data.type as string) || data.stale_after !== undefined) return [];
  return [
    finding(
      "P7",
      file,
      null,
      `a ${data.type} needs 'stale_after'`,
      "add 'stale_after: <timestamp>' for the next review",
    ),
  ];
};

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const p8: BundleRule = (ctx, inSelection) =>
  ctx.entries
    .filter((e) => inSelection(e.rel))
    .filter((e) => {
      const name = e.rel.slice(e.rel.lastIndexOf("/") + 1);
      return e.isDir ? !KEBAB.test(name) : !(name.endsWith(".md") && KEBAB.test(name.slice(0, -3)));
    })
    .map((e) => ({
      rule: "P8",
      severity: "error" as const,
      path: e.rel,
      line: null,
      message: `${e.isDir ? "folder" : "file"} name is not kebab-case${e.isDir ? "" : " Markdown"}`,
      fix: "rename it with lowercase letters, digits and single hyphens (files end in .md)",
    }));
