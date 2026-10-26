import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { computeDiff } from "../src/gate/diff.ts";
import { type GateContext, type GateRule, g1, g2, g3, g4, g5, g6, g10, g13, g18 } from "../src/gate/rules.ts";
import { requireConfig } from "../src/repo.ts";
import { commit, concept, gateRepo, write } from "./gate-helpers.ts";

const KIT_OPENSPEC = fileURLToPath(new URL("../../../node_modules/.bin/openspec", import.meta.url));

interface Options {
  local?: boolean;
  labels?: string[];
  prBody?: string;
  openspec?: string;
}

function ctx(root: string, o: Options = {}): GateContext {
  return {
    config: requireConfig(root),
    bundleRoot: join(root, "knowledge"),
    diff: computeDiff(root, "main", o.local ?? false),
    local: o.local ?? false,
    labels: o.labels ?? [],
    prBody: o.prBody,
    openspec: { command: o.openspec ?? KIT_OPENSPEC, source: "node_modules/.bin" },
    now: new Date(),
  };
}

const rules = (rule: GateRule, root: string, o?: Options) =>
  rule(ctx(root, o)).map((f) => [f.rule, f.effect, f.path]);

const FIXTURE = new URL("./fixtures/change/", import.meta.url);
const fixture = (rel: string) => readFileSync(new URL(rel, FIXTURE), "utf8");

/** The valid `demo` change of the change check fixture, with the concept its brief cites. */
const demoChange = (): Record<string, string> => ({
  "knowledge/decisions/receipts.md": concept("Decision", "Receipts go by mail."),
  ...Object.fromEntries(
    ["brief.md", "knowledge.md", "tasks.md", ".openspec.yaml", "specs/guest-checkout/spec.md"].map((f) => [
      `openspec/changes/demo/${f}`,
      fixture(`openspec/changes/demo/${f}`),
    ]),
  ),
});

describe("gate: rules", () => {
  it("reports nothing but G3 setup for an unchanged clean repository", () => {
    const root = gateRepo();
    for (const rule of [g1, g2, g4, g5, g6, g10, g13, g18]) expect(rule(ctx(root))).toEqual([]);
  });

  // spec: specfold-gate#missing-frontmatter-key
  it("G1: blocks a concept without type", () => {
    const root = gateRepo();
    commit(root, {
      "knowledge/domain/a.md": concept("Term", "See [b](/domain/b.md).").replace("type: Term\n", ""),
    });
    const findings = g1(ctx(root));
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toMatchObject({ rule: "G1", effect: "block", path: "knowledge/domain/a.md" });
    expect(findings.map((f) => f.message).join("\n")).toContain("type");
  });

  // spec: specfold-gate#stale-index
  it("G2: blocks an outdated index", () => {
    const root = gateRepo();
    commit(root, { "knowledge/domain/c.md": concept("Term", "See [a](/domain/a.md).") });
    expect(rules(g2, root)).toEqual([["G2", "block", "knowledge/domain/index.md"]]);
  });

  // spec: specfold-gate#broken-link
  it("G10: blocks a broken link, or warns when configured", () => {
    const root = gateRepo();
    commit(root, {
      "knowledge/domain/a.md": concept("Term", "See [b](/domain/b.md) and [m](/decisions/missing.md)."),
    });
    expect(rules(g10, root)).toEqual([["G10", "block", "knowledge/domain/a.md"]]);
    expect(rules(g1, root)).toEqual([]);
    write(
      root,
      "specfold.yaml",
      "types: [Term]\nsource_globs: ['src/**']\ngate:\n  block_on_broken_links: false\n",
    );
    expect(rules(g10, root)).toEqual([["G10", "warn", "knowledge/domain/a.md"]]);
  });

  // spec: specfold-gate#invalid-delta-spec
  it("G3: blocks an invalid delta spec", () => {
    const root = gateRepo({ "openspec/config.yaml": "schema: spec-driven\n" });
    commit(root, {
      "openspec/changes/demo/proposal.md":
        "## Why\n\nA reason that is long enough for OpenSpec to accept it here.\n\n## What Changes\n\n- thing\n",
      "openspec/changes/demo/specs/cap/spec.md":
        "## ADDED Requirements\n\n### Requirement: Thing\nThe system SHALL do it.\n",
    });
    const findings = g3(ctx(root));
    expect(findings).toEqual([
      expect.objectContaining({ rule: "G3", effect: "block", path: "openspec/changes/demo" }),
    ]);
    expect(findings[0]?.message).toContain("must include at least one scenario");
  }, 30_000);

  it("G3: without OpenSpec, fails in CI and warns locally", () => {
    const root = gateRepo();
    expect(() => g3(ctx(root, { openspec: join(root, "no-openspec") }))).toThrow(EnvError);
    expect(rules(g3, root, { openspec: join(root, "no-openspec"), local: true })).toEqual([
      ["G3", "warn", null],
    ]);
  });

  // spec: specfold-gate#code-without-change
  it("G4: blocks source changes without a change, and warns locally", () => {
    const root = gateRepo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    expect(rules(g4, root)).toEqual([["G4", "block", "src/app.ts"]]);
    expect(rules(g4, root, { local: true })).toEqual([["G4", "warn", "src/app.ts"]]);
  });

  // spec: specfold-gate#escape-with-reason
  it("G4: accepts the escape label with a reason, not the label alone", () => {
    const root = gateRepo();
    commit(root, { "src/app.ts": "export const app = 2;\n" });
    expect(
      g4(ctx(root, { labels: ["no-spec"], prBody: "Bump.\n\nNo-spec reason: dependency bump\n" })),
    ).toEqual([]);
    const [finding] = g4(ctx(root, { labels: ["no-spec"], prBody: "No-spec reason:\n" }));
    expect(finding?.message).toContain("no 'No-spec reason:' line");
  });

  it("G4: is satisfied by a touched change and off when configured", () => {
    const root = gateRepo();
    commit(root, { "src/app.ts": "export const app = 2;\n", "openspec/changes/demo/brief.md": "x\n" });
    expect(g4(ctx(root))).toEqual([]);
    const other = gateRepo();
    commit(other, {
      "src/app.ts": "export const app = 2;\n",
      "specfold.yaml":
        "types: [Term]\nsource_globs: ['src/**']\ngate:\n  require_change_for_source_changes: false\n",
    });
    expect(g4(ctx(other))).toEqual([]);
  });

  // spec: specfold-gate#missing-knowledge-delta
  it("G5: blocks a touched change without knowledge.md", () => {
    const root = gateRepo();
    commit(root, demoChange());
    expect(g5(ctx(root))).toEqual([]);
    rmSync(join(root, "openspec/changes/demo/knowledge.md"));
    commit(root, {});
    expect(g5(ctx(root))).toEqual([
      expect.objectContaining({ rule: "G5", effect: "block", path: "openspec/changes/demo/knowledge.md" }),
    ]);
  });

  // spec: specfold-gate#unconfirmed-brief
  it("G13: blocks a touched change with an unconfirmed brief", () => {
    const root = gateRepo();
    const files = demoChange();
    files["openspec/changes/demo/brief.md"] = (files["openspec/changes/demo/brief.md"] as string).replace(
      "confirmed_by: human:samiuens",
      "confirmed_by:",
    );
    commit(root, files);
    const findings = g13(ctx(root));
    expect(findings).toEqual([expect.objectContaining({ rule: "G13", effect: "block" })]);
    expect(findings[0]?.message).toMatch(/^B2 /);
  });

  // spec: specfold-gate#overlapping-parallel-groups
  it("G18: blocks independent groups that own the same files", () => {
    const root = gateRepo();
    const files = demoChange();
    files["openspec/changes/demo/tasks.md"] = (files["openspec/changes/demo/tasks.md"] as string)
      .replace("files: [src/checkout/**]", "files: [src/**]")
      .replace("files: [src/mail/**]", "files: [src/**]");
    commit(root, files);
    const findings = g18(ctx(root)).filter((f) => f.effect === "block");
    expect(findings).toEqual([
      expect.objectContaining({ rule: "G18", path: "openspec/changes/demo/tasks.md" }),
    ]);
    expect(findings[0]?.message).toMatch(/^T5 /);
  });

  // spec: specfold-gate#archived-without-sync
  it("G6: blocks an archived change whose delta was not applied", () => {
    const id = "2026-10-26-add-guest-checkout";
    const root = gateRepo({ "knowledge/log.md": "# Log\n\n## 2026-10-01\n\n* **Update**: started\n" });
    commit(root, {
      [`openspec/changes/archive/${id}/knowledge.md`]:
        '## Delta\n\n```yaml\nops:\n  - op: create\n    path: capabilities/guest-checkout.md\n    type: Capability\n    summary: Why guest checkout exists.\nempty_reason: ""\n```\n',
      [`openspec/changes/archive/${id}/specs/guest-checkout/spec.md`]: "## ADDED Requirements\n",
      "openspec/specs/guest-checkout/spec.md": "# guest-checkout\n",
      "knowledge/capabilities/guest-checkout.md": concept("Capability", "Guests pay without an account."),
    });
    const findings = g6(ctx(root));
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.rule === "G6" && f.effect === "block" && f.message.includes(id))).toBe(
      true,
    );
    expect(findings.map((f) => f.message)).toContain(`archived change ${id} is not synced: set spec`);
  });
});
