import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import type { DeltaOp } from "../src/change/knowledge.ts";
import { applyWrites, planOps, type SyncContext } from "../src/sync/apply.ts";
import { tempDir } from "./helpers.ts";

const ID = "2026-10-26-add-guest-checkout";
const NOW = new Date(2026, 9, 26, 15, 0, 0);

const write = (root: string, rel: string, content: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

function setup(archivedId = ID) {
  const root = tempDir();
  write(root, `openspec/changes/archive/${archivedId}/proposal.md`, "# Proposal\n");
  const ctx: SyncContext = {
    repoRoot: root,
    bundleRoot: join(root, "knowledge"),
    archivedId,
    by: "process:specfold-sync",
    now: NOW,
  };
  return { root, ctx };
}

const op = (o: Partial<DeltaOp> & Pick<DeltaOp, "op" | "path" | "type">): DeltaOp => ({
  summary: "Why it exists.",
  line: 1,
  ...o,
});

const sync = (ctx: SyncContext, ops: DeltaOp[]) => {
  const plan = planOps(ops, ctx);
  applyWrites(plan);
  return plan;
};

describe("planOps", () => {
  // spec: specfold-sync#missing-concept-gets-a-stub
  it("writes a stub for a missing concept of a create op", () => {
    const { root, ctx } = setup();
    const plan = sync(ctx, [
      op({
        op: "create",
        path: "decisions/guest-orders.md",
        type: "Decision",
        summary: "Guest orders get no account.",
      }),
    ]);
    const text = readFileSync(join(root, "knowledge/decisions/guest-orders.md"), "utf8");
    expect(text).toContain(
      "type: Decision\ntitle: Guest orders\ndescription: Guest orders get no account.\nstatus: draft\n",
    );
    expect(plan.actions[0]).toEqual({ path: "knowledge/decisions/guest-orders.md", action: "create stub" });
  });

  // spec: specfold-sync#actor-without-model-variable
  it("names the given actor in the stub's generated key", () => {
    const { root, ctx } = setup();
    sync(ctx, [op({ op: "create", path: "domain/guest.md", type: "Term" })]);
    expect(readFileSync(join(root, "knowledge/domain/guest.md"), "utf8")).toContain(
      'generated: { by: "process:specfold-sync", at: 2026-10-26T15:00:00',
    );
  });

  it("keeps the body of an existing concept", () => {
    const { root, ctx } = setup();
    write(
      root,
      "knowledge/domain/guest.md",
      "---\ntype: Term\ntitle: Guest\nstatus: draft\n---\n\n# Meaning\n\nWritten before archive.\n",
    );
    const plan = sync(ctx, [op({ op: "create", path: "domain/guest.md", type: "Term" })]);
    expect(plan.actions).toEqual([]);
    expect(plan.writes.size).toBe(0);
  });

  // spec: specfold-sync#concept-deprecated
  it("sets status deprecated and keeps the body", () => {
    const { root, ctx } = setup();
    const before = "---\ntype: Decision\ntitle: Old checkout\nstatus: stable\n---\n\n# Decision\n\nOld.\n";
    write(root, "knowledge/decisions/old-checkout.md", before);
    const plan = sync(ctx, [op({ op: "deprecate", path: "decisions/old-checkout.md", type: "Decision" })]);
    expect(readFileSync(join(root, "knowledge/decisions/old-checkout.md"), "utf8")).toBe(
      before.replace("status: stable", "status: deprecated"),
    );
    expect(plan.actions).toEqual([
      { path: "knowledge/decisions/old-checkout.md", action: "set status: deprecated" },
    ]);
  });

  // spec: specfold-sync#card-linked-to-the-archived-change
  it("links a capability card to the archived spec, change and proposal", () => {
    const { root, ctx } = setup();
    sync(ctx, [op({ op: "create", path: "capabilities/guest-checkout.md", type: "Capability" })]);
    const card = readFileSync(join(root, "knowledge/capabilities/guest-checkout.md"), "utf8");
    expect(card).toContain(
      [
        "spec: openspec/specs/guest-checkout/spec.md",
        "resource: ../../openspec/specs/guest-checkout/spec.md",
        `change: ${ID}`,
      ].join("\n"),
    );
    expect(card).toContain(
      `sources:\n  - id: proposal-${ID}\n    resource: ../../openspec/changes/archive/${ID}/proposal.md\n`,
    );
  });

  // spec: specfold-sync#modified-capability-keeps-its-history
  it("points a modified card at the newer change and keeps both proposal sources", () => {
    const first = setup();
    sync(first.ctx, [op({ op: "create", path: "capabilities/guest-checkout.md", type: "Capability" })]);
    const later = "2026-11-02-update-guest-checkout";
    write(first.root, `openspec/changes/archive/${later}/proposal.md`, "# Proposal\n");
    write(first.root, `openspec/changes/archive/${later}/design.md`, "# Design\n");
    const plan = sync({ ...first.ctx, archivedId: later }, [
      op({ op: "update", path: "capabilities/guest-checkout.md", type: "Capability" }),
    ]);
    const card = readFileSync(join(first.root, "knowledge/capabilities/guest-checkout.md"), "utf8");
    expect(card).toContain(`change: ${later}\n`);
    expect(card).toContain(`id: proposal-${ID}`);
    expect(card).toContain(`id: proposal-${later}`);
    expect(card).toContain(`id: design-${later}`);
    expect(plan.actions.map((a) => a.action)).toEqual([
      "set change",
      `add source proposal-${later}`,
      `add source design-${later}`,
    ]);
  });

  // spec: specfold-sync#decision-linked-to-its-change
  it("sets change on a created decision", () => {
    const { root, ctx } = setup();
    write(
      root,
      "knowledge/decisions/guest-orders.md",
      "---\ntype: Decision\ntitle: Guest orders\nstatus: draft\n---\n",
    );
    sync(ctx, [op({ op: "create", path: "decisions/guest-orders.md", type: "Decision" })]);
    expect(readFileSync(join(root, "knowledge/decisions/guest-orders.md"), "utf8")).toContain(
      `change: ${ID}\n`,
    );
  });

  it("changes nothing on a second run", () => {
    const { ctx } = setup();
    const ops = [
      op({ op: "create", path: "capabilities/guest-checkout.md", type: "Capability" }),
      op({ op: "create", path: "decisions/guest-orders.md", type: "Decision" }),
    ];
    sync(ctx, ops);
    expect(planOps(ops, ctx)).toEqual({ actions: [], writes: new Map() });
  });
});
