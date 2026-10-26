import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addedClaims } from "../src/gate/claims.ts";
import { computeDiff } from "../src/gate/diff.ts";
import { commit, concept, gateRepo, git } from "./gate-helpers.ts";

const claims = (root: string) =>
  addedClaims(root, join(root, "knowledge"), computeDiff(root, "main", false)).map((c) => [
    c.key,
    c.login,
    c.file,
    c.line,
  ]);

const BRIEF = (by: string) =>
  `## Confirmation\n\nconfirmed_by: ${by}\nconfirmed_at: 2026-10-26T10:00:00+01:00\n`;

describe("gate: claims", () => {
  it("finds a verified entry added to a concept", () => {
    const root = gateRepo();
    commit(root, {
      "knowledge/domain/a.md": concept(
        "Term",
        "See [b](/domain/b.md).",
        "\nverified: { by: human:ben, at: 2026-10-26T10:00:00+01:00 }",
      ),
    });
    expect(claims(root)).toEqual([["verified", "ben", "knowledge/domain/a.md", 7]]);
  });

  it("ignores claims the merge base already has, and non-human actors", () => {
    const at = "at: 2026-10-26T10:00:00+01:00";
    const root = gateRepo({
      "knowledge/domain/a.md": concept(
        "Term",
        "See [b](/domain/b.md).",
        `\nverified: { by: human:ben, ${at} }`,
      ),
    });
    commit(root, {
      "knowledge/domain/a.md": concept(
        "Term",
        "Edited. See [b](/domain/b.md).",
        `\nverified:\n  - { by: human:Ben, ${at} }\n  - { by: human:carl, ${at} }\n  - { by: process:bot, ${at} }`,
      ),
    });
    expect(claims(root)).toEqual([["verified", "carl", "knowledge/domain/a.md", 7]]);
  });

  // spec: specfold-gate#commitment-claimed-for-someone-else
  it("finds a committed_by added to a commitment", () => {
    const root = gateRepo();
    commit(root, {
      "knowledge/commitments/eu.md": concept("Term", "Promise.").replace(
        "type: Term",
        "type: Deferred Commitment\nstate: open\ntrigger: before 1.0\ncommitted_by: human:carl",
      ),
    });
    expect(claims(root)).toEqual([["committed_by", "carl", "knowledge/commitments/eu.md", 5]]);
  });

  it("finds confirmed_by in active and archived briefs", () => {
    const root = gateRepo({ "openspec/changes/old/brief.md": BRIEF("human:ana") });
    commit(root, {
      "openspec/changes/demo/brief.md": BRIEF("human:carl"),
      "openspec/changes/archive/2026-10-26-done/brief.md": BRIEF("human:dora"),
      "openspec/changes/old/brief.md": `${BRIEF("human:ana")}\nEdited.\n`,
      "openspec/changes/other/proposal.md": BRIEF("human:eve"),
    });
    expect(claims(root)).toEqual([
      ["confirmed_by", "dora", "openspec/changes/archive/2026-10-26-done/brief.md", 3],
      ["confirmed_by", "carl", "openspec/changes/demo/brief.md", 3],
    ]);
  });

  it("does not count a confirmed brief that the branch archives", () => {
    const root = gateRepo({ "openspec/changes/demo/brief.md": BRIEF("human:ana") });
    git(root, "rm", "-rq", "openspec/changes/demo");
    commit(root, { "openspec/changes/archive/2026-10-26-demo/brief.md": BRIEF("human:ana") });
    expect(claims(root)).toEqual([]);
  });

  it("ignores an empty confirmed_by", () => {
    const root = gateRepo();
    commit(root, { "openspec/changes/demo/brief.md": BRIEF("") });
    expect(claims(root)).toEqual([]);
  });
});
