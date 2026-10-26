import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { agentReason, resolveLogin } from "../verify/login.ts";
import { builtInBody, overrideTemplate } from "./templates.ts";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTOR = /^(?:process:\S+|[^\s/:]+\/\S+)$/;
const RESERVED_WORDS = /^(?:true|false|null|yes|no|on|off|~)$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A YAML scalar: plain when that is unambiguous, double-quoted otherwise. */
export function scalar(value: string): string {
  const plain =
    /^[A-Za-z0-9][A-Za-z0-9 _.,;()'/-]*$/.test(value) && !RESERVED_WORDS.test(value) && !value.endsWith(" ");
  return plain ? value : JSON.stringify(value);
}

/** Local time as ISO 8601 with its UTC offset and without milliseconds. */
export function isoWithOffset(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset < 0 ? "-" : "+";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
  );
}

/** `decisions/guest-orders.md` → `Guest orders`. */
export function titleFromPath(rel: string): string {
  const name = rel.slice(rel.lastIndexOf("/") + 1, -3).replace(/-/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export interface ConceptFields {
  type: string;
  title: string;
  description: string;
  by: string;
  now: Date;
  /** `origin` of a Backlog Item; defaults to `by`. */
  origin?: string;
  /** GitHub login written as `committed_by` of a Deferred Commitment; left out when absent. */
  committedBy?: string;
}

/** A new concept's text from the type's override template, or from the built-in frontmatter and body. */
export function renderConcept(repoRoot: string, fields: ConceptFields): string {
  const { type, title, description, by, now, origin, committedBy } = fields;
  const placeholders = { type, title, description, by, now: isoWithOffset(now) };
  return (
    overrideTemplate(repoRoot, type, placeholders) ??
    [
      "---",
      `type: ${scalar(type)}`,
      `title: ${scalar(title)}`,
      `description: ${scalar(description)}`,
      "status: draft",
      ...(type === "Decision" ? ["decision: accepted"] : []),
      ...(type === "Runbook" || type === "Interface"
        ? [`stale_after: ${isoWithOffset(new Date(now.getTime() + 90 * DAY_MS))}`]
        : []),
      ...(type === "Backlog Item"
        ? ["state: open", "priority: medium", `origin: ${scalar(origin ?? by)}`]
        : []),
      ...(type === "Deferred Commitment"
        ? ["state: open", 'trigger: ""', ...(committedBy ? [`committed_by: human:${committedBy}`] : [])]
        : []),
      `generated: { by: ${scalar(by)}, at: ${placeholders.now} }`,
      ...(type === "Decision" ? ["sources: []"] : []),
      "---",
      "",
      builtInBody(type),
    ].join("\n")
  );
}

/** The login of the person at the keyboard, or undefined for an agent or when no login resolves. */
function humanLogin(root: string): string | undefined {
  if (agentReason()) return undefined;
  try {
    return resolveLogin(root);
  } catch {
    return undefined;
  }
}

function bundlePath(arg: string): string {
  const rel = arg.replace(/^\/+/, "");
  const segments = rel.split("/");
  const file = segments.at(-1) ?? "";
  const valid =
    file.endsWith(".md") &&
    file !== "index.md" &&
    file !== "log.md" &&
    segments.slice(0, -1).every((s) => KEBAB.test(s)) &&
    KEBAB.test(file.slice(0, -3));
  if (!valid)
    throw new UsageError(
      `path '${arg}' must be a kebab-case .md file inside the bundle, e.g. decisions/use-yaml.md`,
    );
  return rel;
}

register({
  name: "new",
  summary: "create a concept from its type's template",
  usage: "specfold new <type> <path> [--title <text>] [--description <text>] [--by <actor>] [--json]",
  options: {
    title: { type: "string" },
    description: { type: "string" },
    by: { type: "string" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    if (positionals.length !== 2) throw new UsageError("expected <type> and <path>");
    const [type = "", pathArg = ""] = positionals;
    const config = requireConfig(io.cwd);
    if (!config.types.includes(type)) {
      throw new UsageError(`type '${type}' is not in specfold.yaml types: ${config.types.join(", ")}`);
    }
    const rel = bundlePath(pathArg);
    const model = process.env.SPECFOLD_MODEL;
    const by =
      (values.by as string | undefined) ?? (model ? `${config.agentPrefix}${model}` : "process:specfold-new");
    if (by.startsWith("human:"))
      throw new UsageError("human actors are added by 'specfold verify', never by 'new'");
    if (!ACTOR.test(by))
      throw new UsageError(`actor '${by}' must look like '<producer>/<version>' or 'process:<id>'`);

    const bundleRoot = resolveBundleRoot(io.cwd, undefined, config);
    const abs = join(bundleRoot, rel);
    const shown = relative(config.root, abs).split(sep).join("/");
    if (existsSync(abs)) {
      if (values.json) io.stdout(`${JSON.stringify({ created: null, error: `${shown} already exists` })}\n`);
      else io.stderr(`specfold: ${shown} already exists\n`);
      return 1;
    }

    const title = (values.title as string | undefined) ?? titleFromPath(rel);
    const description = (values.description as string | undefined) ?? "";
    const committedBy = type === "Deferred Commitment" ? humanLogin(config.root) : undefined;
    const content = renderConcept(config.root, {
      type,
      title,
      description,
      by,
      now: new Date(),
      ...(committedBy ? { committedBy } : {}),
    });
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    io.stdout(values.json ? `${JSON.stringify({ created: shown })}\n` : `${shown}\n`);
    return 0;
  },
});
