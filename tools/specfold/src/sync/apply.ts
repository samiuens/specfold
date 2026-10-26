import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import type { DeltaOp } from "../change/knowledge.ts";
import { renderConcept, titleFromPath } from "../new/command.ts";
import { editFrontmatter, type FrontmatterEdit } from "./frontmatter.ts";

export interface SyncContext {
  repoRoot: string;
  bundleRoot: string;
  /** Archived change id, e.g. `2026-10-26-add-guest-checkout`. */
  archivedId: string;
  /** Actor for stubs; never a `human:` actor. */
  by: string;
  now: Date;
}

export interface Action {
  /** Repository-relative path with forward slashes. */
  path: string;
  action: string;
}

export interface SyncPlan {
  actions: Action[];
  /** Absolute path → new file content, only for files whose text changes. */
  writes: Map<string, string>;
}

const posix = (p: string) => p.split(sep).join("/");
const CAPABILITY = /^capabilities\/(.+)\.md$/;

/** The frontmatter edits one op calls for. */
function editsFor(op: DeltaOp, abs: string, ctx: SyncContext): FrontmatterEdit {
  const set: Record<string, string> = {};
  const addSources: FrontmatterEdit["addSources"] = [];
  if (op.op === "deprecate") set.status = "deprecated";
  const cap = op.type === "Capability" ? CAPABILITY.exec(op.path)?.[1] : undefined;
  const archive = join(ctx.repoRoot, "openspec", "changes", "archive", ctx.archivedId);
  const fromCard = (target: string) => posix(relative(dirname(abs), target));
  if (cap) {
    const spec = join(ctx.repoRoot, "openspec", "specs", cap, "spec.md");
    set.spec = posix(relative(ctx.repoRoot, spec));
    set.resource = fromCard(spec);
    set.change = ctx.archivedId;
    for (const artifact of ["proposal", "design"]) {
      const file = join(archive, `${artifact}.md`);
      if (existsSync(file))
        addSources.push({ id: `${artifact}-${ctx.archivedId}`, resource: fromCard(file) });
    }
  }
  if (op.type === "Decision" && op.op === "create") set.change = ctx.archivedId;
  return { set, addSources };
}

/** Plans the file changes for the ops of an archived change's delta, without writing. */
export function planOps(ops: DeltaOp[], ctx: SyncContext): SyncPlan {
  const plan: SyncPlan = { actions: [], writes: new Map() };
  for (const op of ops) {
    const abs = join(ctx.bundleRoot, op.path);
    const shown = posix(relative(ctx.repoRoot, abs));
    let original: string | undefined;
    let text: string;
    if (existsSync(abs)) {
      original = readFileSync(abs, "utf8");
      text = original;
    } else if (op.op === "create") {
      text = renderConcept(ctx.repoRoot, {
        type: op.type,
        title: titleFromPath(op.path),
        description: op.summary,
        by: ctx.by,
        now: ctx.now,
      });
      plan.actions.push({ path: shown, action: "create stub" });
    } else continue; // change check reports update/deprecate of missing concepts (K4)

    const result = editFrontmatter(text, editsFor(op, abs, ctx));
    for (const key of result.setKeys) {
      plan.actions.push({ path: shown, action: key === "status" ? "set status: deprecated" : `set ${key}` });
    }
    for (const id of result.addedSources) plan.actions.push({ path: shown, action: `add source ${id}` });
    if (result.text !== original) plan.writes.set(abs, result.text);
  }
  return plan;
}

export function applyWrites(plan: SyncPlan): void {
  for (const [abs, content] of plan.writes) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}
