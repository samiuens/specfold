import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isMap, isSeq, LineCounter, parseDocument } from "yaml";
import { parseFile } from "../bundle.ts";
import { walkFiles } from "../glob.ts";
import type { Config } from "../repo.ts";
import type { TaskFinding } from "../tasks/rules.ts";

export type OpKind = "create" | "update" | "deprecate";

export interface DeltaOp {
  op: OpKind;
  path: string;
  type: string;
  summary: string;
  line: number;
}

export interface KnowledgeOptions {
  /** Repository-relative change folder, used in findings (`openspec/changes/<name>` or its archive path). */
  relDir: string;
  /** For an archived change: capabilities whose main spec now exists may be covered by `create` or `update`. */
  archived?: boolean;
}

export interface KnowledgeResult {
  findings: TaskFinding[];
  /** The well-formed ops (K2 passed); empty when the delta cannot be read. */
  ops: DeltaOp[];
}

const OPS = new Set(["create", "update", "deprecate"]);
const BUNDLE_PATH = /^(?!\/)(?!(?:.*\/)?\.\.(?:\/|$))\S+\.md$/;
const MAX_SUMMARY = 160;

/** Capability paths with a delta spec under `<dir>/specs/<cap>/spec.md`. */
export function deltaCapabilities(dir: string): string[] {
  const specs = join(dir, "specs");
  if (!existsSync(specs)) return [];
  return walkFiles(specs)
    .filter((rel) => rel.endsWith("/spec.md"))
    .map((rel) => rel.slice(0, -"/spec.md".length));
}

function conceptType(bundleRoot: string, path: string): string | undefined {
  const parsed = parseFile(bundleRoot, path);
  const data = parsed.frontmatter?.data as Record<string, unknown> | undefined;
  return typeof data?.type === "string" ? data.type : undefined;
}

/** Rules K0-K6 for a change folder's knowledge.md. */
export function checkKnowledge(
  config: Config,
  bundleRoot: string,
  dir: string,
  options: KnowledgeOptions,
): KnowledgeResult {
  const file = `${options.relDir}/knowledge.md`;
  const findings: TaskFinding[] = [];
  const add = (rule: string, line: number | null, message: string, fix: string) =>
    findings.push({ rule, severity: "error", file, group: null, task: null, line, message, fix });

  const path = join(dir, "knowledge.md");
  if (!existsSync(path)) {
    add("K0", null, "the change has no knowledge.md", "write knowledge.md from the schema template");
    return { findings, ops: [] };
  }

  // The Delta section and its fenced yaml blocks.
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => /^## Delta\s*$/.test(l));
  if (start === -1) {
    add(
      "K1",
      null,
      "knowledge.md has no '## Delta' section",
      "add '## Delta' with one yaml block listing ops",
    );
    return { findings, ops: [] };
  }
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  const blocks: { fence: number; source: string }[] = [];
  for (let i = start + 1; i < (end === -1 ? lines.length : end); i++) {
    if (!/^```ya?ml\s*$/.test(lines[i] as string)) continue;
    const close = lines.findIndex((l, k) => k > i && l.trim() === "```");
    const stop = close === -1 ? lines.length : close;
    blocks.push({ fence: i + 1, source: lines.slice(i + 1, stop).join("\n") });
    i = stop;
  }
  if (blocks.length !== 1) {
    add(
      "K1",
      start + 1,
      `'## Delta' holds ${blocks.length} yaml blocks, expected exactly one`,
      "keep a single yaml block with ops and empty_reason",
    );
    return { findings, ops: [] };
  }
  const block = blocks[0] as { fence: number; source: string };
  const counter = new LineCounter();
  const doc = parseDocument(block.source, { lineCounter: counter });
  const lineAt = (offset: number | undefined) =>
    offset === undefined ? block.fence : block.fence + counter.linePos(offset).line;
  if (doc.errors.length > 0) {
    const error = doc.errors[0];
    add(
      "K1",
      block.fence + (error?.linePos?.[0]?.line ?? 0),
      `delta block is not valid YAML: ${error?.message.split("\n")[0]}`,
      "fix the YAML syntax",
    );
    return { findings, ops: [] };
  }
  const root = doc.contents;
  const opsNode = isMap(root) ? root.get("ops", true) : undefined;
  if (!isSeq(opsNode)) {
    add(
      "K1",
      block.fence,
      "'ops' is missing or not a list",
      "write 'ops:' as a list, or 'ops: []' with an empty_reason",
    );
    return { findings, ops: [] };
  }

  // K2: well-formed ops.
  const ops: DeltaOp[] = [];
  for (const item of opsNode.items) {
    const line = lineAt((item as { range?: [number, number, number] }).range?.[0]);
    const value = (item as { toJSON?: () => unknown }).toJSON?.() as Record<string, unknown> | undefined;
    if (!isMap(item) || !value) {
      add("K2", line, "op is not a mapping", "write op, path, type and summary keys");
      continue;
    }
    const problems: string[] = [];
    if (typeof value.op !== "string" || !OPS.has(value.op))
      problems.push(`op '${String(value.op)}' is not create, update or deprecate`);
    if (typeof value.path !== "string" || !BUNDLE_PATH.test(value.path))
      problems.push(`path '${String(value.path)}' is not a bundle-relative .md path`);
    if (typeof value.type !== "string" || (config.types.length > 0 && !config.types.includes(value.type)))
      problems.push(`type '${String(value.type)}' is not a configured type`);
    if (typeof value.summary !== "string" || value.summary.trim() === "")
      problems.push("summary is missing or empty");
    else if (value.summary.length > MAX_SUMMARY)
      problems.push(`summary is longer than ${MAX_SUMMARY} characters`);
    for (const p of problems)
      add(
        "K2",
        line,
        p,
        "fix the op: op create|update|deprecate, path like decisions/x.md, a type from specfold.yaml, a one-line summary",
      );
    if (problems.length === 0)
      ops.push({
        op: value.op as OpKind,
        path: value.path as string,
        type: value.type as string,
        summary: value.summary as string,
        line,
      });
  }

  // K3: empty delta needs a reason.
  const reason: unknown = isMap(root) ? root.get("empty_reason") : undefined;
  if (opsNode.items.length === 0 && (typeof reason !== "string" || reason.trim() === "")) {
    add(
      "K3",
      block.fence,
      "ops is empty and empty_reason is missing",
      "list the concepts this change touches, or give a one-line empty_reason",
    );
  }

  // K6: unique paths.
  const seen = new Set<string>();
  for (const op of ops) {
    if (seen.has(op.path))
      add("K6", op.line, `path ${op.path} appears in more than one op`, "merge the ops for this path");
    seen.add(op.path);
  }

  // K4: targets match the bundle.
  for (const op of ops) {
    const exists = existsSync(join(bundleRoot, op.path));
    if (!exists) {
      if (op.op !== "create")
        add("K4", op.line, `${op.op} names missing concept ${op.path}`, "fix the path or use op: create");
      continue;
    }
    const actual = conceptType(bundleRoot, op.path);
    if (actual !== op.type)
      add(
        "K4",
        op.line,
        `${op.path} has type '${actual ?? "(none)"}', the op says '${op.type}'`,
        "use the concept's type, or pick another path",
      );
  }

  // K5: every capability with a delta spec has its card.
  for (const cap of deltaCapabilities(dir)) {
    const card = `capabilities/${cap}.md`;
    const exists = existsSync(join(config.root, "openspec", "specs", cap, "spec.md"));
    const expected: OpKind[] =
      options.archived && exists ? ["create", "update"] : [exists ? "update" : "create"];
    const op = ops.find((o) => o.path === card && o.type === "Capability");
    if (!op || !expected.includes(op.op)) {
      add(
        "K5",
        null,
        `capability '${cap}' has no op ${expected.join(" or ")} for ${card}`,
        `add '- op: ${expected[0]}' with path ${card} and type Capability`,
      );
    }
  }
  return { findings, ops };
}
