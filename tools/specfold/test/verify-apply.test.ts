import { describe, expect, it } from "vitest";
import { verifyText } from "../src/verify/apply.ts";

const concept = (extra = "") =>
  `---\ntype: Decision\ntitle: Retries\nstatus: draft\ngenerated: { by: claude-code/x, at: 2026-10-26T10:00:00+01:00 }${extra}\n---\n\nBody.\n`;

describe("verify: apply", () => {
  it("sets status stable and adds the entry after generated", () => {
    expect(verifyText(concept(), "ana", "2026-10-26T15:00:00+01:00")).toBe(
      "---\ntype: Decision\ntitle: Retries\nstatus: stable\ngenerated: { by: claude-code/x, at: 2026-10-26T10:00:00+01:00 }\nverified: { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\n---\n\nBody.\n",
    );
  });

  it("leaves status alone when asked to", () => {
    expect(verifyText(concept(), "ana", "2026-10-26T15:00:00+01:00", true)).toContain(
      "status: draft\ngenerated: { by: claude-code/x, at: 2026-10-26T10:00:00+01:00 }\nverified: { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\n",
    );
  });

  // spec: specfold-verify#second-reviewer
  it("keeps other reviewers as a list", () => {
    const once = verifyText(concept(), "ana", "2026-10-26T15:00:00+01:00");
    expect(verifyText(once, "ben", "2026-10-26T16:00:00+01:00")).toContain(
      "verified:\n  - { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\n  - { by: human:ben, at: 2026-10-26T16:00:00+01:00 }\n---",
    );
  });

  it("replaces the same login's entry and keeps extra keys of others", () => {
    const text = concept(
      '\nverified:\n  - { by: human:Ana, at: 2026-10-01T10:00:00+01:00 }\n  - { by: human:ben, at: 2026-10-02T10:00:00+01:00, note: "read twice" }',
    );
    expect(verifyText(text, "ana", "2026-10-26T15:00:00+01:00")).toContain(
      'verified:\n  - { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\n  - { by: human:ben, at: 2026-10-02T10:00:00+01:00, note: "read twice" }\n---',
    );
  });
});
