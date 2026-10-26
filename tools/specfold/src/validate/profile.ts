import type { ParsedFile } from "../bundle.ts";
import type { Finding } from "../findings.ts";
import type { Rule } from "./index.ts";
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
