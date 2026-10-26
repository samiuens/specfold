import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { walkFiles } from "../src/glob.ts";
import { editFrontmatter } from "../src/sync/frontmatter.ts";

const CARD = `---
type: Capability
title: Guest checkout
description: "Why guests: pay without an account."
tags: [checkout, guests]
owner_team: payments # custom key
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:04:00+01:00 }
sources:
  - id: proposal-2026-10-26-add-guest-checkout
    resource: ../../openspec/changes/archive/2026-10-26-add-guest-checkout/proposal.md
---

# Why

Body stays.
`;

describe("editFrontmatter", () => {
  // spec: specfold-sync#unrelated-keys-kept
  it("keeps unrelated keys, their order, comments and the body", () => {
    const { text, setKeys } = editFrontmatter(CARD, {
      set: { spec: "openspec/specs/guest-checkout/spec.md", status: "draft" },
    });
    expect(setKeys).toEqual(["spec"]);
    expect(text).toBe(
      CARD.replace("generated: {", "spec: openspec/specs/guest-checkout/spec.md\ngenerated: {"),
    );
  });

  it("inserts a block after generated and replaces it in place", () => {
    const one = editFrontmatter(CARD, {
      setBlock: { verified: ["verified: { by: human:ana, at: 2026-10-26T15:00:00+01:00 }"] },
    });
    expect(one.setKeys).toEqual(["verified"]);
    expect(one.text).toContain(
      "generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:04:00+01:00 }\nverified: { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\nsources:",
    );
    const two = editFrontmatter(one.text, {
      setBlock: {
        verified: [
          "verified:",
          "  - { by: human:ana, at: 2026-10-26T15:00:00+01:00 }",
          "  - { by: human:ben, at: 2026-10-26T16:00:00+01:00 }",
        ],
      },
    });
    expect(two.text).toContain(
      "verified:\n  - { by: human:ana, at: 2026-10-26T15:00:00+01:00 }\n  - { by: human:ben, at: 2026-10-26T16:00:00+01:00 }\nsources:",
    );
    expect(
      editFrontmatter(two.text, { setBlock: { verified: two.text.split("\n").slice(8, 11) } }).setKeys,
    ).toEqual([]);
  });

  it("rewrites a differing key in place", () => {
    const { text } = editFrontmatter(CARD, { set: { status: "deprecated" } });
    expect(text).toBe(CARD.replace("status: draft", "status: deprecated"));
  });

  it("appends a source unless its resource is linked", () => {
    const same = "../../openspec/changes/archive/2026-10-26-add-guest-checkout/proposal.md";
    expect(editFrontmatter(CARD, { addSources: [{ id: "other-id", resource: same }] }).text).toBe(CARD);
    const { text, addedSources } = editFrontmatter(CARD, {
      addSources: [{ id: "proposal-2026-11-02-update", resource: "../../x/proposal.md" }],
    });
    expect(addedSources).toEqual(["proposal-2026-11-02-update"]);
    expect(text).toBe(
      CARD.replace(
        "proposal.md\n---",
        "proposal.md\n  - id: proposal-2026-11-02-update\n    resource: ../../x/proposal.md\n---",
      ),
    );
  });

  it("replaces an empty flow list of sources with a block list", () => {
    const decision = "---\ntype: Decision\nsources: []\n---\n\n# Decision\n";
    expect(editFrontmatter(decision, { addSources: [{ id: "a", resource: "b.md" }] }).text).toBe(
      "---\ntype: Decision\nsources:\n  - id: a\n    resource: b.md\n---\n\n# Decision\n",
    );
  });

  it("keeps the entries of a one-line flow list of sources", () => {
    const decision = "---\ntype: Decision\nsources: [{ id: a, resource: a.md }]\n---\n";
    expect(editFrontmatter(decision, { addSources: [{ id: "b", resource: "b.md" }] }).text).toBe(
      "---\ntype: Decision\nsources:\n  - id: a\n    resource: a.md\n  - id: b\n    resource: b.md\n---\n",
    );
  });

  it("leaves text without frontmatter untouched", () => {
    expect(editFrontmatter("# Title\n", { set: { a: "b" } })).toEqual({
      text: "# Title\n",
      setKeys: [],
      addedSources: [],
    });
  });

  it("round-trips every concept of the kit's own bundle when a key is set and reset", () => {
    const bundle = fileURLToPath(new URL("../../../knowledge/", import.meta.url));
    for (const rel of walkFiles(bundle).filter(
      (f) => f.endsWith(".md") && !f.endsWith("index.md") && f !== "log.md",
    )) {
      const original = readFileSync(join(bundle, rel), "utf8");
      const status = /^status: (\S+)$/m.exec(original)?.[1];
      if (!status) continue;
      const changed = editFrontmatter(original, { set: { status: "x-probe" } }).text;
      expect(editFrontmatter(changed, { set: { status } }).text, rel).toBe(original);
    }
  });
});
