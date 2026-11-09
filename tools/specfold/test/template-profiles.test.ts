import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TEMPLATE } from "./migrate-helpers.ts";

const read = (p: string) => readFileSync(`${TEMPLATE}/${p}`, "utf8");
const VARIANTS = ["AGENTS.md", "CLAUDE.md", ".github/pull_request_template.md"];

/** The body of the level-2 section whose title, without its number, is `title`. */
function section(text: string, title: string): string {
  const parts = text.split(/^## (?:\d+\. )?/m);
  const hit = parts.find((p) => p.startsWith(`${title}\n`));
  if (hit === undefined) throw new Error(`no section ${title}`);
  return hit.slice(title.length).trim();
}

describe("knowledge profile variants", () => {
  it.each(VARIANTS)("%s names no OpenSpec", (p) => {
    expect(read(`.specfold/profiles/knowledge/${p}`)).not.toMatch(/openspec|\/opsx:/i);
  });

  it("keeps the full AGENTS.md knowledge rules", () => {
    const full = read("AGENTS.md");
    const knowledge = read(".specfold/profiles/knowledge/AGENTS.md");
    expect(section(knowledge, "Knowledge rules")).toBe(section(full, "Knowledge rules"));
  });

  it("keeps every map row of the full AGENTS.md that is not about OpenSpec", () => {
    const rows = (t: string) => section(t, "Map").split("\n").filter((l) => l.startsWith("| `"));
    const full = rows(read("AGENTS.md")).filter((r) => !/openspec/i.test(r));
    expect(rows(read(".specfold/profiles/knowledge/AGENTS.md"))).toEqual(full);
  });

  it("asks for a No-knowledge reason in the pull request template", () => {
    const text = read(".specfold/profiles/knowledge/.github/pull_request_template.md");
    expect(text).toMatch(/^No-knowledge reason:/m);
    expect(text).not.toMatch(/^Change:/m);
  });
});
