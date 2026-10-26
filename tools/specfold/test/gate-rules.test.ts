import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { computeDiff } from "../src/gate/diff.ts";
import { type GateContext, type GateRule, g1, g2, g3, g10 } from "../src/gate/rules.ts";
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

describe("gate: rules", () => {
  it("reports nothing but G3 setup for an unchanged clean repository", () => {
    const root = gateRepo();
    for (const rule of [g1, g2, g10]) expect(rule(ctx(root))).toEqual([]);
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
});
