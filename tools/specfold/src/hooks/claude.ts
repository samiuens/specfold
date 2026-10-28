import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { checkPlannedChange } from "../change/command.ts";
import { findingLine } from "../findings.ts";
import { dueDate, listItems } from "../future/items.ts";
import { localGate, renderGate } from "../gate/command.ts";
import { resolveBundleRoot } from "../repo.ts";
import { taskFindingLine } from "../tasks/command.ts";
import { upgradeReminder } from "../upgrade/reminder.ts";
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

/** The session-start output plus, once a day at most, a line about a newer kit release. */
export async function sessionStartWithReminder(ctx: HookContext): Promise<number> {
  const code = sessionStart(ctx);
  const line = await upgradeReminder(ctx.config);
  if (line) ctx.io.stdout(`${line}\n`);
  return code;
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

const PUSH_REASON = "pushing and pull requests are the orchestrator's job; return your branch name instead";

/** Whether one shell segment runs `git push` or `gh pr`, after `env`, assignments or `git -C <dir>`. */
function pushes(segment: string): boolean {
  const words = segment.trim().split(/\s+/);
  while (words[0] === "env" || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] ?? "")) words.shift();
  if (words[0] === "gh") return words[1] === "pr";
  if (words[0] !== "git") return false;
  let i = 1;
  while (words[i]?.startsWith("-")) i += words[i] === "-C" || words[i] === "-c" ? 2 : 1;
  return words[i] === "push";
}

/** The implementer's PreToolUse guard: no `git push` and no `gh pr` in a Bash command. */
export async function noPush({ io }: HookContext): Promise<number> {
  let event: { tool_input?: { command?: unknown } };
  try {
    event = JSON.parse((await io.readStdin?.()) ?? "");
  } catch {
    return 0;
  }
  const command = event.tool_input?.command;
  if (typeof command !== "string" || !command.split(/&&|\|\||;|\||\n/).some(pushes)) return 0;
  io.stderr(`${PUSH_REASON}\n`);
  return 2;
}
