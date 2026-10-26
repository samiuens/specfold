import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Severity } from "../findings.ts";
import type { TaskFinding } from "../tasks/rules.ts";
import { isTimestamp } from "../validate/profile.ts";

export const BRIEF_SECTIONS = ["Wish", "Decisions", "Out of scope", "Open questions", "Confirmation"];
const SHORT_SECTIONS = ["Wish", "Confirmation"];
const HUMAN = /^human:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const OWNED = /\(owner:\s*[^)\s][^)]*\)\s*\S/;
const SOURCE = /^(?:user|delegated|knowledge:\/([a-z0-9][a-z0-9/-]*\.md))$/;

export interface Line {
  text: string;
  line: number;
}

export interface Section {
  line: number;
  lines: Line[];
}

/** Level-2 sections by heading, after removing HTML comments (template placeholders count as empty). */
export function splitSections(text: string): Map<string, Section> {
  const clean = text.replace(/<!--[\s\S]*?-->/g, (c) => "\n".repeat(c.split("\n").length - 1));
  const sections = new Map<string, Section>();
  let current: Section | undefined;
  clean.split(/\r?\n/).forEach((text, i) => {
    const heading = /^## (.+?)\s*$/.exec(text);
    if (heading) {
      current = { line: i + 1, lines: [] };
      if (!sections.has(heading[1] as string)) sections.set(heading[1] as string, current);
    } else current?.lines.push({ text, line: i + 1 });
  });
  return sections;
}

const filled = (s: Section) => s.lines.filter((l) => l.text.trim() !== "");

/** Rules B0-B4 for an active change's brief.md. */
export function checkBrief(
  bundleRoot: string,
  dir: string,
  change: string,
  skipSpecs: boolean,
): TaskFinding[] {
  const file = `openspec/changes/${change}/brief.md`;
  const out: TaskFinding[] = [];
  const add = (
    rule: string,
    line: number | null,
    message: string,
    fix: string,
    severity: Severity = "error",
  ) => out.push({ rule, severity, file, group: null, task: null, line, message, fix });

  const path = join(dir, "brief.md");
  if (!existsSync(path)) {
    add(
      "B0",
      null,
      `change '${change}' has no brief.md`,
      "ask the user, then write brief.md from the schema template",
    );
    return out;
  }
  const sections = splitSections(readFileSync(path, "utf8"));

  for (const name of skipSpecs ? SHORT_SECTIONS : BRIEF_SECTIONS) {
    if (!sections.has(name))
      add(
        "B1",
        null,
        `brief.md has no '## ${name}' section`,
        `add the '## ${name}' section from the template`,
      );
  }
  const wish = sections.get("Wish");
  if (wish && filled(wish).length === 0)
    add("B1", wish.line, "'Wish' is empty", "write the user's wish in their own words");

  const confirmation = sections.get("Confirmation");
  if (confirmation) {
    const value = (key: string) => {
      const hit = confirmation.lines.find((l) => l.text.trim().startsWith(`${key}:`));
      return {
        text:
          hit?.text
            .trim()
            .slice(key.length + 1)
            .trim() ?? "",
        line: hit?.line ?? confirmation.line,
      };
    };
    const by = value("confirmed_by");
    if (!HUMAN.test(by.text))
      add(
        "B2",
        by.line,
        by.text ? `confirmed_by '${by.text}' is not a human:<login> actor` : "confirmed_by is empty",
        "only the user confirms: after their explicit approval, write confirmed_by: human:<login>",
      );
    const at = value("confirmed_at");
    if (!isTimestamp(at.text))
      add(
        "B2",
        at.line,
        at.text
          ? `confirmed_at '${at.text}' is not an ISO 8601 date-time with offset`
          : "confirmed_at is empty",
        "write the approval time like 2026-10-26T10:00:00+01:00",
      );
  }

  const questions = sections.get("Open questions");
  for (const item of questions ? filled(questions) : []) {
    const text = item.text.trim();
    if (!/^[-*] /.test(text) || /^[-*] none$/i.test(text)) continue;
    if (!OWNED.test(text))
      add(
        "B3",
        item.line,
        `open question without owner and reason: ${text.slice(2)}`,
        "append '(owner: <actor>) <why it does not block the spec>' or resolve it now",
      );
  }

  const decisions = sections.get("Decisions");
  const rows = decisions ? decisions.lines.filter((l) => l.text.trim().startsWith("|")) : [];
  for (const row of rows.slice(1)) {
    const cells = row.text
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const [, question = "", answer = "", source = ""] = cells;
    const label = cells[0] || `line ${row.line}`;
    if (!question || !answer)
      add(
        "B4",
        row.line,
        `decision ${label} has an empty question or answer`,
        "fill in both, or remove the row",
      );
    const m = SOURCE.exec(source);
    if (!m)
      add(
        "B4",
        row.line,
        `decision ${label} has source '${source}'`,
        "use user, delegated or knowledge:/<path>.md",
      );
    else if (m[1] && !existsSync(join(bundleRoot, m[1])))
      add("B4", row.line, `decision ${label} cites missing concept /${m[1]}`, "point at an existing concept");
  }
  return out;
}
