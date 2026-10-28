import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { applyBlock, blockStyle } from "../src/migrate/blocks.ts";
import { fillStack, mergeOpenspecConfig, mergeSettings } from "../src/migrate/merge.ts";
import { TEMPLATE } from "./migrate-helpers.ts";

const text = (r: ReturnType<typeof applyBlock>) => {
  if ("conflict" in r) throw new Error(r.conflict);
  return r.text;
};

describe("managed blocks", () => {
  it("creates a missing file with the block inside markers", () => {
    expect(text(applyBlock(undefined, "# Rules\n", "markdown"))).toBe(
      "<!-- specfold:start -->\n# Rules\n<!-- specfold:end -->\n",
    );
    expect(blockStyle(".gitignore")).toBe("hash");
    expect(blockStyle(".github/pull_request_template.md")).toBe("markdown");
  });

  it("adds the block at the top of Markdown and at the end of other files", () => {
    expect(text(applyBlock("# Team\n", "kit", "markdown"))).toBe(
      "<!-- specfold:start -->\nkit\n<!-- specfold:end -->\n\n# Team\n",
    );
    expect(text(applyBlock("node_modules/", "kit", "hash"))).toBe(
      "node_modules/\n\n# specfold:start\nkit\n# specfold:end\n",
    );
  });

  it("replaces only the block on a rerun and reports no change when it is current", () => {
    const once = text(applyBlock("# Team\n", "v1", "markdown"));
    const twice = applyBlock(once, "v1", "markdown");
    expect(twice).toEqual({ text: once, changed: false });
    expect(text(applyBlock(once, "v2", "markdown"))).toBe(once.replace("v1", "v2"));
  });

  it("refuses a start marker without an end, and a stray end marker", () => {
    expect(applyBlock("<!-- specfold:start -->\nold\n", "kit", "markdown")).toEqual({
      conflict: "has a specfold:start marker without an end",
    });
    expect(applyBlock("# specfold:end\n", "kit", "hash")).toEqual({
      conflict: "has a stray specfold:end marker",
    });
  });
});

describe("settings merge", () => {
  const template = readFileSync(join(TEMPLATE, ".claude/settings.json"), "utf8");

  it("adds Specfold's hooks and keeps other keys and hooks", () => {
    const existing = JSON.stringify({
      permissions: { deny: ["Read(./.env)"] },
      hooks: { Stop: [{ hooks: [{ type: "command", command: "say done" }] }] },
    });
    const merged = mergeSettings(existing, template);
    if ("conflict" in merged) throw new Error(merged.conflict);
    const data = JSON.parse(merged.text);
    expect(data.permissions.deny).toEqual(["Read(./.env)", ...JSON.parse(template).permissions.deny]);
    expect(Object.keys(data.hooks).sort()).toEqual(["PostToolUse", "SessionStart", "Stop"]);
    expect(data.hooks.Stop).toHaveLength(2);
    expect(mergeSettings(merged.text, template)).toEqual({ text: merged.text, changed: false });
  });

  // spec: specfold-migrate#deny-rules-merged
  it("appends the template's missing deny rules after the existing ones, once", () => {
    const withDeny = JSON.stringify({
      permissions: { deny: ["Read(**/yarn.lock)", "Read(**/node_modules/**)"] },
    });
    const existing = JSON.stringify({
      permissions: { deny: ["Read(./.env)", "Read(**/yarn.lock)"], allow: ["Bash(ls)"] },
    });
    const merged = mergeSettings(existing, withDeny);
    if ("conflict" in merged) throw new Error(merged.conflict);
    expect(JSON.parse(merged.text).permissions).toEqual({
      deny: ["Read(./.env)", "Read(**/yarn.lock)", "Read(**/node_modules/**)"],
      allow: ["Bash(ls)"],
    });
    expect(mergeSettings(merged.text, withDeny)).toEqual({ text: merged.text, changed: false });
  });

  // spec: specfold-migrate#existing-permissions
  it("reports permissions it cannot merge into", () => {
    const withDeny = JSON.stringify({ permissions: { deny: ["Read(**/yarn.lock)"] } });
    expect(mergeSettings(JSON.stringify({ permissions: [] }), withDeny)).toEqual({
      conflict: "has a 'permissions' value that is not an object",
    });
    expect(mergeSettings(JSON.stringify({ permissions: { deny: "all" } }), withDeny)).toEqual({
      conflict: "has a 'permissions.deny' value that is not a list",
    });
  });

  it("copies the template into a missing file and reports invalid JSON", () => {
    expect(mergeSettings(undefined, template)).toEqual({ text: template, changed: true });
    expect(mergeSettings("{ nope", template)).toEqual({ conflict: "is not valid JSON" });
  });
});

describe("OpenSpec config merge", () => {
  const template = readFileSync(join(TEMPLATE, "openspec/config.yaml"), "utf8");

  it("switches the schema and keeps context, rules and comments", () => {
    const existing =
      "schema: spec-driven\n\n# Our own context.\ncontext: |\n  Accounts service.\n\nrules:\n  proposal:\n    - Name the endpoint.\n";
    const merged = mergeOpenspecConfig(existing, template, "Node.js");
    if ("conflict" in merged) throw new Error(merged.conflict);
    expect(merged.text).toContain("# Our own context.");
    const data = parse(merged.text);
    expect(data.schema).toBe("specfold");
    expect(data.context).toBe("Accounts service.\nStack: Node.js\n");
    expect(data.rules.proposal).toEqual(["Name the endpoint."]);
    expect(Object.keys(data.rules)).toEqual(["proposal", "specs", "design", "knowledge", "tasks"]);
    expect(mergeOpenspecConfig(merged.text, template, "Node.js")).toEqual({
      text: merged.text,
      changed: false,
    });
  });

  it("copies context and rules when they are missing, and fills the stack", () => {
    const merged = mergeOpenspecConfig("schema: spec-driven\n", template, "Go");
    if ("conflict" in merged) throw new Error(merged.conflict);
    const data = parse(merged.text);
    expect(data.context).toContain("Stack: Go\n");
    expect(data.rules.tasks).toHaveLength(2);
    expect(fillStack(template, undefined)).toBe(template);
    expect(mergeOpenspecConfig(": : :", template, undefined)).toHaveProperty("conflict");
  });
});
