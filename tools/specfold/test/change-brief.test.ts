import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkBrief } from "../src/change/brief.ts";
import { tempDir } from "./helpers.ts";

const BRIEF = `## Wish

Guests can pay without an account.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Account needed? | No | user |
| Q2 | Token lifetime? | 24 hours | delegated |
| Q3 | Receipts? | By mail | knowledge:/decisions/receipts.md |

## Out of scope

- Refunds

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T10:00:00+01:00
`;

function setup(brief: string | undefined) {
  const root = tempDir();
  const bundle = join(root, "knowledge");
  mkdirSync(join(bundle, "decisions"), { recursive: true });
  writeFileSync(join(bundle, "decisions", "receipts.md"), "---\ntype: Decision\n---\n");
  const dir = join(root, "openspec", "changes", "demo");
  mkdirSync(dir, { recursive: true });
  if (brief !== undefined) writeFileSync(join(dir, "brief.md"), brief);
  return { bundle, dir };
}

const check = (brief: string | undefined, skipSpecs = false) => {
  const { bundle, dir } = setup(brief);
  return checkBrief(bundle, dir, "demo", skipSpecs);
};

const replace = (from: string, to: string) => {
  if (!BRIEF.includes(from)) throw new Error(`brief does not contain ${from}`);
  return BRIEF.replace(from, to);
};

describe("checkBrief", () => {
  it("accepts a complete brief", () => {
    expect(check(BRIEF)).toEqual([]);
  });

  // spec: specfold-change-check#missing-brief
  it("B0: reports a missing brief", () => {
    expect(check(undefined)).toEqual([
      expect.objectContaining({
        rule: "B0",
        severity: "error",
        file: "openspec/changes/demo/brief.md",
        line: null,
      }),
    ]);
  });

  // spec: specfold-change-check#empty-wish
  it("B1: reports an empty wish", () => {
    expect(check(replace("Guests can pay without an account.\n", ""))).toEqual([
      expect.objectContaining({ rule: "B1", line: 1, message: "'Wish' is empty" }),
    ]);
  });

  it("B1: reports a missing section and treats template comments as empty", () => {
    expect(check(replace("## Out of scope\n\n- Refunds\n\n", "")).map((f) => f.message)).toEqual([
      "brief.md has no '## Out of scope' section",
    ]);
    expect(
      check(replace("Guests can pay without an account.", "<!-- One paragraph. -->")).map((f) => f.rule),
    ).toEqual(["B1"]);
  });

  // spec: specfold-change-check#short-brief-for-tooling
  it("accepts a short brief for a skip_specs change", () => {
    const short =
      "## Wish\n\nRename the build script.\n\n## Confirmation\n\nconfirmed_by: human:samiuens\nconfirmed_at: 2026-10-26T10:00:00Z\n";
    expect(check(short, true)).toEqual([]);
    expect(check(short).map((f) => f.rule)).toEqual(["B1", "B1", "B1"]);
  });

  // spec: specfold-change-check#agent-confirmation
  it("B2: reports a confirmation by an agent", () => {
    expect(check(replace("human:samiuens", "claude-code/claude-opus-5-5"))).toEqual([
      expect.objectContaining({
        rule: "B2",
        line: 23,
        message: "confirmed_by 'claude-code/claude-opus-5-5' is not a human:<login> actor",
      }),
    ]);
  });

  // spec: specfold-change-check#timestamp-without-offset
  it("B2: reports a timestamp without offset", () => {
    expect(check(replace("2026-10-26T10:00:00+01:00", "2026-10-26T10:00:00"))).toEqual([
      expect.objectContaining({ rule: "B2", line: 24 }),
    ]);
  });

  it("B2: reports an empty confirmation", () => {
    const empty = replace(
      "confirmed_by: human:samiuens\nconfirmed_at: 2026-10-26T10:00:00+01:00",
      "confirmed_by:\nconfirmed_at:",
    );
    expect(check(empty).map((f) => f.message)).toEqual(["confirmed_by is empty", "confirmed_at is empty"]);
  });

  // spec: specfold-change-check#unowned-question
  it("B3: reports an open question without owner", () => {
    expect(check(replace("none\n", "- Which retention period?\n"))).toEqual([
      expect.objectContaining({
        rule: "B3",
        line: 19,
        message: "open question without owner and reason: Which retention period?",
      }),
    ]);
    expect(
      check(replace("none\n", "- Which retention period? (owner: human:samiuens)\n")).map((f) => f.rule),
    ).toEqual(["B3"]);
  });

  // spec: specfold-change-check#owned-question
  it("B3: accepts an owned question with a reason", () => {
    expect(
      check(
        replace(
          "none\n",
          "- Which retention period? (owner: human:samiuens) No requirement depends on it.\n",
        ),
      ),
    ).toEqual([]);
    expect(check(replace("none\n", "- none\n"))).toEqual([]);
  });

  // spec: specfold-change-check#unknown-knowledge-source
  it("B4: reports a knowledge source naming a missing concept", () => {
    expect(check(replace("knowledge:/decisions/receipts.md", "knowledge:/decisions/missing.md"))).toEqual([
      expect.objectContaining({
        rule: "B4",
        line: 11,
        message: "decision Q3 cites missing concept /decisions/missing.md",
      }),
    ]);
  });

  it("B4: reports empty answers and unknown sources", () => {
    const text = replace("| Q1 | Account needed? | No | user |", "| Q1 | Account needed? |  | me |");
    expect(check(text).map((f) => f.message)).toEqual([
      "decision Q1 has an empty question or answer",
      "decision Q1 has source 'me'",
    ]);
  });
});
