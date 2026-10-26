import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { builtInBody, overrideTemplate, TEMPLATE_DIR, typeSlug } from "../src/new/templates.ts";
import { tempDir } from "./helpers.ts";

const values = {
  type: "Decision",
  title: "Guest orders",
  description: "Why.",
  by: "process:x",
  now: "2026-10-26T10:00:00Z",
};

describe("new: templates", () => {
  // spec: specfold-new#built-in-body
  it("gives a Decision the decision headings", () => {
    expect(builtInBody("Decision")).toBe("# Decision\n\n# Why\n\n# Rejected alternatives\n\n# Related\n");
  });

  it("falls back to a generic body for other types", () => {
    expect(builtInBody("Metric")).toBe("# Summary\n\n# Related\n");
  });

  it("maps types to template file names", () => {
    expect(typeSlug("Business Rule")).toBe("business-rule");
    expect(typeSlug("Deferred Commitment")).toBe("deferred-commitment");
  });

  // spec: specfold-new#override-wins
  it("uses an override template with placeholders replaced", () => {
    const repo = tempDir();
    mkdirSync(join(repo, TEMPLATE_DIR), { recursive: true });
    writeFileSync(
      join(repo, TEMPLATE_DIR, "decision.md"),
      "---\ntype: {{type}}\ntitle: {{title}}\n---\n\n# {{title}} by {{by}} at {{now}}: {{description}} {{other}}\n",
    );
    expect(overrideTemplate(repo, "Decision", values)).toBe(
      "---\ntype: Decision\ntitle: Guest orders\n---\n\n# Guest orders by process:x at 2026-10-26T10:00:00Z: Why. {{other}}\n",
    );
  });

  it("returns undefined without an override", () => {
    expect(overrideTemplate(tempDir(), "Decision", values)).toBeUndefined();
  });
});
