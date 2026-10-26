import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkKnowledge } from "../src/change/knowledge.ts";
import type { Config } from "../src/repo.ts";
import { tempDir } from "./helpers.ts";

const DELTA = `## Delta

\`\`\`yaml
ops:
  - op: create
    path: capabilities/guest-checkout.md
    type: Capability
    summary: Why guest checkout exists.
  - op: update
    path: decisions/receipts.md
    type: Decision
    summary: Receipts also go to guests.
empty_reason: ""
\`\`\`

## Notes

Nothing else.
`;

const write = (root: string, rel: string, content: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

function setup(knowledge: string | undefined) {
  const root = tempDir();
  write(root, "knowledge/decisions/receipts.md", "---\ntype: Decision\n---\n");
  write(root, "openspec/specs/mail/spec.md", "# mail\n");
  const dir = join(root, "openspec", "changes", "demo");
  write(dir, "specs/guest-checkout/spec.md", "## ADDED Requirements\n");
  if (knowledge !== undefined) write(dir, "knowledge.md", knowledge);
  const config: Config = {
    root,
    types: ["Capability", "Decision"],
    sourceGlobs: [],
    blockOnBrokenLinks: true,
    folders: {},
    agentPrefix: "",
    requires: {},
    tasks: { maxFilesPerTask: 5, maxTasksPerGroup: 8 },
    agentTargets: [".claude/skills"],
  };
  return { root, dir, config };
}

const check = (knowledge: string | undefined, archived = false) => {
  const { root, dir, config } = setup(knowledge);
  return checkKnowledge(config, join(root, "knowledge"), dir, { relDir: "openspec/changes/demo", archived });
};

const replace = (from: string, to: string) => {
  if (!DELTA.includes(from)) throw new Error(`delta does not contain ${from}`);
  return DELTA.replace(from, to);
};

describe("checkKnowledge", () => {
  it("accepts a valid delta and returns its ops", () => {
    const { findings, ops } = check(DELTA);
    expect(findings).toEqual([]);
    expect(ops).toEqual([
      {
        op: "create",
        path: "capabilities/guest-checkout.md",
        type: "Capability",
        summary: "Why guest checkout exists.",
        line: 5,
      },
      {
        op: "update",
        path: "decisions/receipts.md",
        type: "Decision",
        summary: "Receipts also go to guests.",
        line: 9,
      },
    ]);
  });

  // spec: specfold-change-check#missing-knowledge-delta
  it("K0: reports a missing knowledge.md", () => {
    expect(check(undefined).findings).toEqual([
      expect.objectContaining({ rule: "K0", file: "openspec/changes/demo/knowledge.md" }),
    ]);
  });

  // spec: specfold-change-check#broken-yaml
  it("K1: reports broken YAML with the block's line", () => {
    const { findings } = check("## Delta\n\n```yaml\nops: [\n```\n");
    expect(findings).toEqual([expect.objectContaining({ rule: "K1" })]);
    expect(findings[0]?.line).toBeGreaterThanOrEqual(3);
  });

  it("K1: reports a missing section, block count and ops list", () => {
    expect(check("## Notes\n").findings.map((f) => f.message)).toEqual([
      "knowledge.md has no '## Delta' section",
    ]);
    expect(check("## Delta\n\nno block\n").findings.map((f) => f.rule)).toEqual(["K1"]);
    expect(check("## Delta\n\n```yaml\nops: x\n```\n").findings.map((f) => f.message)).toEqual([
      "'ops' is missing or not a list",
    ]);
  });

  // spec: specfold-change-check#unknown-op
  it("K2: reports an unknown op", () => {
    const { findings } = check(replace("op: update", "op: rename"));
    expect(findings).toEqual([
      expect.objectContaining({
        rule: "K2",
        line: 9,
        message: "op 'rename' is not create, update or deprecate",
      }),
    ]);
  });

  it("K2: reports bad paths, types and summaries", () => {
    const text = replace("path: decisions/receipts.md", "path: /decisions/receipts.md")
      .replace("type: Decision", "type: Memo")
      .replace("summary: Receipts also go to guests.", `summary: ${"x".repeat(161)}`);
    expect(check(text).findings.map((f) => f.message)).toEqual([
      "path '/decisions/receipts.md' is not a bundle-relative .md path",
      "type 'Memo' is not a configured type",
      "summary is longer than 160 characters",
    ]);
    expect(
      check(replace("path: decisions/receipts.md", "path: ../x.md")).findings.map((f) => f.rule),
    ).toEqual(["K2"]);
  });

  // spec: specfold-change-check#empty-delta-without-reason
  it("K3: reports an empty delta without reason", () => {
    expect(
      check('## Delta\n\n```yaml\nops: []\nempty_reason: ""\n```\n').findings.map((f) => f.rule),
    ).toEqual(["K3", "K5"]);
    expect(
      check("## Delta\n\n```yaml\nops: []\nempty_reason: Tooling only.\n```\n").findings.map((f) => f.rule),
    ).toEqual(["K5"]);
  });

  // spec: specfold-change-check#update-of-a-missing-concept
  it("K4: reports an update of a missing concept", () => {
    expect(check(replace("decisions/receipts.md", "decisions/missing.md")).findings).toEqual([
      expect.objectContaining({ rule: "K4", message: "update names missing concept decisions/missing.md" }),
    ]);
  });

  // spec: specfold-change-check#concept-written-before-archive
  it("K4: accepts create on an existing file of the same type, rejects another type", () => {
    const { root, dir, config } = setup(DELTA);
    write(root, "knowledge/capabilities/guest-checkout.md", "---\ntype: Capability\n---\n");
    const run = () => checkKnowledge(config, join(root, "knowledge"), dir, { relDir: "x" }).findings;
    expect(run()).toEqual([]);
    write(root, "knowledge/capabilities/guest-checkout.md", "---\ntype: Decision\n---\n");
    expect(run().map((f) => f.message)).toEqual([
      "capabilities/guest-checkout.md has type 'Decision', the op says 'Capability'",
    ]);
  });

  // spec: specfold-change-check#new-capability-without-card
  it("K5: reports a new capability without a card", () => {
    const text = replace("path: capabilities/guest-checkout.md", "path: capabilities/other.md");
    expect(check(text).findings).toEqual([
      expect.objectContaining({
        rule: "K5",
        message: "capability 'guest-checkout' has no op create for capabilities/guest-checkout.md",
      }),
    ]);
  });

  it("K5: wants update for a modified capability, and accepts both once archived", () => {
    const { root, dir, config } = setup(DELTA);
    write(root, "openspec/specs/guest-checkout/spec.md", "# x\n");
    const opts = (archived: boolean) => ({ relDir: "x", archived });
    expect(
      checkKnowledge(config, join(root, "knowledge"), dir, opts(false)).findings.map((f) => f.message),
    ).toEqual(["capability 'guest-checkout' has no op update for capabilities/guest-checkout.md"]);
    expect(checkKnowledge(config, join(root, "knowledge"), dir, opts(true)).findings).toEqual([]);
  });

  // spec: specfold-change-check#duplicate-path
  it("K6: reports a duplicate path on the second op", () => {
    const text = replace("path: decisions/receipts.md", "path: capabilities/guest-checkout.md")
      .replace("type: Decision", "type: Capability")
      .replace("op: update", "op: create");
    expect(check(text).findings).toEqual([expect.objectContaining({ rule: "K6", line: 9 })]);
  });
});
