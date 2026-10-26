import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { checkPlannedChange } from "../change/command.ts";
import { findingLine } from "../findings.ts";
import { dueDate, listItems } from "../future/items.ts";
import { localGate, renderGate } from "../gate/command.ts";
import { resolveBundleRoot } from "../repo.ts";
import { taskFindingLine } from "../tasks/command.ts";
import { validate } from "../validate/index.ts";
import { isConcept } from "../validate/okf.ts";
import { localBase } from "./base.ts";
import type { HookContext } from "./run.ts";

const MAX_LINES = 40;
const DUE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const EDIT_TOOLS = new Set(["Edit", "Write"]);

const activeChanges = (root: string): string[] => {
  const dir = join(root, "openspec", "changes");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => d !== "archive" && !d.startsWith(".") && statSync(join(dir, d)).isDirectory())
    .sort();
};

/** Open commitments whose trigger date is at most 30 days away, overdue ones included. */
const dueSoon = (bundleRoot: string, now = Date.now()) =>
  listItems(bundleRoot, "commitments").filter((c) => {
    const due = dueDate(c.data.trigger);
    return c.data.state === "open" && due !== undefined && due.getTime() <= now + DUE_WINDOW_MS;
  }).length;

/** The root index's section list, the active changes and the commitments due soon, at most 40 lines. */
export function sessionStart({ config, io }: HookContext): number {
  const bundleRoot = resolveBundleRoot(config.root, undefined, config);
  const index = join(bundleRoot, "index.md");
  const sections = existsSync(index)
    ? readFileSync(index, "utf8")
        .split("\n")
        .filter((l) => /^\* \[/.test(l))
    : [];
  const changes = activeChanges(config.root);
  const due = dueSoon(bundleRoot);
  const out = [
    "Knowledge sections (look up with: node scripts/specfold.mjs lookup <words>):",
    ...sections,
    `Active changes: ${changes.length === 0 ? "none" : changes.join(", ")}`,
    ...(due > 0 ? [`Commitments due within 30 days: ${due} (specfold commitments list)`] : []),
  ];
  const shown =
    out.length > MAX_LINES
      ? [...out.slice(0, MAX_LINES - 1), `... ${out.length - MAX_LINES + 1} more lines`]
      : out;
  io.stdout(`${shown.join("\n")}\n`);
  return 0;
}

interface ToolEvent {
  tool_name?: unknown;
  tool_input?: { file_path?: unknown };
  cwd?: unknown;
}

/** Checks the concept or change an Edit or Write touched; errors go to stderr with exit 2, otherwise silence. */
export async function postToolUse({ config, io }: HookContext): Promise<number> {
  let event: ToolEvent;
  try {
    event = JSON.parse((await io.readStdin?.()) ?? "") as ToolEvent;
  } catch {
    return 0; // an unreadable event must never stop the agent
  }
  const file = event.tool_input?.file_path;
  if (typeof event.tool_name !== "string" || !EDIT_TOOLS.has(event.tool_name) || typeof file !== "string")
    return 0;
  const base = typeof event.cwd === "string" ? event.cwd : config.root;
  const rel = relative(config.root, isAbsolute(file) ? file : resolve(base, file))
    .split(sep)
    .join("/");
  const bundleRoot = resolveBundleRoot(config.root, undefined, config);
  const prefix = relative(config.root, bundleRoot).split(sep).join("/");

  let errors: string[] = [];
  if (rel.startsWith(`${prefix}/`) && rel.endsWith(".md") && isConcept(rel.slice(prefix.length + 1))) {
    if (!existsSync(join(config.root, rel))) return 0;
    errors = validate({ bundleRoot, paths: [join(config.root, rel)], okfOnly: false, config })
      .findings.filter((f) => f.severity === "error")
      .map((f) => findingLine({ ...f, path: `${prefix}/${f.path}` }));
  } else {
    const change = /^openspec\/changes\/([^/]+)\//.exec(rel)?.[1];
    if (!change || change === "archive" || !existsSync(join(config.root, "openspec", "changes", change)))
      return 0;
    errors = checkPlannedChange(config, bundleRoot, change)
      .filter((f) => f.severity === "error")
      .map(taskFindingLine);
  }
  if (errors.length === 0) return 0;
  io.stderr(`${errors.join("\n")}\n`);
  return 2;
}

/** The local gate before Claude stops: blocking findings go to stderr with exit 2. */
export function stop({ config, io }: HookContext): number {
  const base = localBase(config.root);
  if (!base) return 0;
  const findings = localGate(config, config.root, base).filter((f) => f.effect === "block");
  if (findings.length === 0) return 0;
  io.stderr(renderGate(findings));
  return 2;
}
