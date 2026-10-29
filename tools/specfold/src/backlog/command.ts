import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { findItem, type Item, listItems, setKeys } from "../future/items.ts";
import { syncIndexes } from "../indexes/command.ts";
import { generateIndexes } from "../indexes/generate.ts";
import { locationsByConcept, scanReferences } from "../indexes/refs.ts";
import { checkDescription, renderConcept } from "../new/command.ts";
import { openspecBinary } from "../openspec.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";

const STATES = ["open", "promoted", "dropped"];
const PRIORITIES = ["low", "medium", "high"];
const CHANGE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `Dark mode for the app!` → `dark-mode-for-the-app`. */
const kebab = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Regenerates every index.md, as `specfold index` does; returns the changed ones. */
function writeIndexes(config: Config, bundleRoot: string): string[] {
  const refs = scanReferences(config.root, config.sourceGlobs);
  const { indexes } = generateIndexes(bundleRoot, config, locationsByConcept(refs));
  return syncIndexes(config.root, bundleRoot, indexes, false);
}

/** Runs `openspec new change <name>`; a missing binary or a failure is an environment error. */
function newChange(root: string, name: string): void {
  const bin = openspecBinary(root);
  try {
    execFileSync(bin.command, ["new", "change", name], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });
  } catch (error) {
    const e = error as { code?: string; stderr?: unknown };
    if (e.code === "ENOENT") throw new EnvError(`openspec is not installed (looked for ${bin.command})`);
    const reason = String(e.stderr ?? "")
      .trim()
      .split("\n")
      .at(-1);
    throw new EnvError(`openspec new change ${name} failed${reason ? `: ${reason}` : ""}`);
  }
}

register({
  name: "backlog",
  summary: "add, list, promote and drop backlog items",
  usage:
    "specfold backlog add <title> [--priority <p>] [--origin <text>] [--description <text>] | list [--state <state>] | promote <item> [--name <change>] | drop <item> --reason <text>  [--json]",
  options: {
    priority: { type: "string" },
    origin: { type: "string" },
    description: { type: "string" },
    state: { type: "string" },
    name: { type: "string" },
    reason: { type: "string" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    const [sub, ...args] = positionals;
    const config = requireConfig(io.cwd);
    const bundleRoot = resolveBundleRoot(io.cwd, undefined, config);
    const shown = (abs: string) => relative(config.root, abs).split(sep).join("/");
    const print = (lines: string[], json: Record<string, unknown>) =>
      io.stdout(values.json ? `${JSON.stringify(json, null, 2)}\n` : `${lines.join("\n")}\n`);
    const refuse = (item: Item, message: string) => {
      if (values.json)
        io.stdout(`${JSON.stringify({ ok: false, item: shown(item.abs), error: message }, null, 2)}\n`);
      else io.stderr(`specfold: ${shown(item.abs)}: ${message}\n`);
      return 1;
    };
    const one = (what: string) => {
      if (args.length !== 1) throw new UsageError(`expected one ${what}`);
      return findItem(config.root, bundleRoot, "backlog", args[0] as string);
    };

    switch (sub) {
      case "add": {
        const title = args.join(" ").trim();
        const slug = kebab(title);
        if (!slug) throw new UsageError("missing title: specfold backlog add <title>");
        const priority = (values.priority as string | undefined) ?? "medium";
        if (!PRIORITIES.includes(priority))
          throw new UsageError(`priority must be one of ${PRIORITIES.join(", ")}, got '${priority}'`);
        // a concept needs a description; the title is a valid start
        const description = values.description as string | undefined;
        if (description === undefined)
          checkDescription(title, "the title, used as the description,", "pass a shorter --description");
        else checkDescription(description);
        const abs = join(bundleRoot, "backlog", `${slug}.md`);
        if (existsSync(abs)) {
          io.stderr(`specfold: ${shown(abs)} already exists\n`);
          return 1;
        }
        const model = process.env.SPECFOLD_MODEL;
        const by = model ? `${config.agentPrefix}${model}` : "process:specfold-backlog";
        const origin = values.origin as string | undefined;
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(
          abs,
          renderConcept(config.root, {
            type: "Backlog Item",
            title,
            description: description ?? title,
            by,
            now: new Date(),
            ...(origin ? { origin } : {}),
          }),
        );
        if (priority !== "medium") setKeys(abs, { priority });
        const indexes = writeIndexes(config, bundleRoot);
        print([`created ${shown(abs)}`, ...indexes.map((p) => `updated ${p}`)], {
          ok: true,
          created: shown(abs),
          indexes,
        });
        return 0;
      }
      case "list": {
        if (args.length > 0) throw new UsageError(`unexpected argument '${args[0]}'`);
        const state = (values.state as string | undefined) ?? "open";
        if (state !== "all" && !STATES.includes(state))
          throw new UsageError(`state must be one of ${[...STATES, "all"].join(", ")}, got '${state}'`);
        const rank = (i: Item) => {
          const at = PRIORITIES.indexOf(str(i.data.priority));
          return at === -1 ? PRIORITIES.length : PRIORITIES.length - 1 - at;
        };
        const items = listItems(bundleRoot, "backlog")
          .filter((i) => state === "all" || i.data.state === state)
          .sort((a, b) => rank(a) - rank(b) || (a.rel < b.rel ? -1 : 1));
        const rows = items.map((i) => [str(i.data.state), str(i.data.priority), shown(i.abs), i.title]);
        const widths = [0, 1, 2].map((c) => Math.max(0, ...rows.map((r) => (r[c] as string).length)));
        print(
          rows.length === 0
            ? [`no ${state === "all" ? "" : `${state} `}backlog items`]
            : rows.map((r) =>
                r.map((cell, c) => (c < 3 ? cell.padEnd(widths[c] as number) : cell)).join("  "),
              ),
          {
            items: items.map((i) => ({
              path: shown(i.abs),
              title: i.title,
              state: i.data.state ?? null,
              priority: i.data.priority ?? null,
              origin: i.data.origin ?? null,
              change: i.data.change ?? null,
            })),
          },
        );
        return 0;
      }
      case "promote": {
        const item = one("item: specfold backlog promote <item> [--name <change>]");
        const name = (values.name as string | undefined) ?? item.rel.slice(item.rel.lastIndexOf("/") + 1, -3);
        if (!CHANGE_NAME.test(name) || name === "archive")
          throw new UsageError(`'${name}' is not a change name (kebab-case)`);
        if (item.data.state !== "open")
          return refuse(item, `state is '${str(item.data.state)}'; only open items are promoted`);
        const changeDir = join(config.root, "openspec", "changes", name);
        if (existsSync(changeDir)) return refuse(item, `change '${name}' already exists`);
        newChange(config.root, name);
        setKeys(item.abs, { state: "promoted", change: name });
        const next = `run the planning interview (sf-interview) for ${name}, seeded with ${shown(item.abs)}`;
        print(
          [
            `created ${shown(changeDir)}/`,
            `${shown(item.abs)}: state promoted, change ${name}`,
            `next: ${next}`,
          ],
          {
            ok: true,
            item: shown(item.abs),
            change: name,
            next,
          },
        );
        return 0;
      }
      case "drop": {
        const item = one("item: specfold backlog drop <item> --reason <text>");
        const reason = ((values.reason as string | undefined) ?? "").trim();
        if (!reason) throw new UsageError("missing --reason: say why the item is dropped");
        if (item.data.state !== "open")
          return refuse(item, `state is '${str(item.data.state)}'; only open items are dropped`);
        setKeys(item.abs, { state: "dropped", reason });
        print([`${shown(item.abs)}: state dropped`], { ok: true, item: shown(item.abs), reason });
        return 0;
      }
      default:
        throw new UsageError(
          sub ? `unknown backlog subcommand '${sub}'` : "missing subcommand: add, list, promote or drop",
        );
    }
  },
});
