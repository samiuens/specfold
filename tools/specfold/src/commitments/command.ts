import { readFileSync, writeFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { dueDate, findItem, type Item, listItems, setKeys } from "../future/items.ts";
import { localDate } from "../log/command.ts";
import { isoWithOffset } from "../new/command.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import { verifyText } from "../verify/apply.ts";
import { agentReason, resolveLogin } from "../verify/login.ts";

const STATES = ["open", "fulfilled", "withdrawn"];
const CHANGE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const str = (v: unknown) => (typeof v === "string" ? v : "");

register({
  name: "commitments",
  summary: "list, fulfill and withdraw deferred commitments (withdraw: humans only)",
  usage:
    "specfold commitments list [--state <state>] | fulfill <commitment> --change <name> | withdraw <commitment> --reason <text>  [--json]",
  options: {
    state: { type: "string" },
    change: { type: "string" },
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
      if (args.length !== 1) throw new UsageError(`expected one commitment: ${what}`);
      return findItem(config.root, bundleRoot, "commitments", args[0] as string);
    };
    const required = (key: "change" | "reason", hint: string) => {
      const value = ((values[key] as string | undefined) ?? "").trim();
      if (!value) throw new UsageError(`missing --${key}: ${hint}`);
      return value;
    };

    switch (sub) {
      case "list": {
        if (args.length > 0) throw new UsageError(`unexpected argument '${args[0]}'`);
        const state = (values.state as string | undefined) ?? "open";
        if (state !== "all" && !STATES.includes(state))
          throw new UsageError(`state must be one of ${[...STATES, "all"].join(", ")}, got '${state}'`);
        const rows = listItems(bundleRoot, "commitments")
          .filter((i) => state === "all" || i.data.state === state)
          .map((i) => ({ i, due: dueDate(i.data.trigger) }))
          .sort(
            (a, b) =>
              (a.due ? 0 : 1) - (b.due ? 0 : 1) ||
              (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0) ||
              (a.i.rel < b.i.rel ? -1 : 1),
          );
        const cells = rows.map(({ i, due }) => [
          str(i.data.state),
          due ? localDate(due) : "-",
          shown(i.abs),
          `${i.title} (trigger: ${str(i.data.trigger)})`,
        ]);
        const widths = [0, 1, 2].map((c) => Math.max(0, ...cells.map((r) => (r[c] as string).length)));
        print(
          cells.length === 0
            ? [`no ${state === "all" ? "" : `${state} `}commitments`]
            : cells.map((r) =>
                r.map((cell, c) => (c < 3 ? cell.padEnd(widths[c] as number) : cell)).join("  "),
              ),
          {
            commitments: rows.map(({ i, due }) => ({
              path: shown(i.abs),
              title: i.title,
              state: i.data.state ?? null,
              trigger: i.data.trigger ?? null,
              due: due ? localDate(due) : null,
              committed_by: i.data.committed_by ?? null,
              vision: i.data.vision ?? null,
              change: i.data.change ?? null,
            })),
          },
        );
        return 0;
      }
      case "fulfill": {
        const change = required("change", "name the change that kept the commitment");
        if (!CHANGE_NAME.test(change)) throw new UsageError(`'${change}' is not a change name (kebab-case)`);
        const item = one("specfold commitments fulfill <commitment> --change <name>");
        if (item.data.state !== "open")
          return refuse(item, `state is '${str(item.data.state)}'; only open commitments are fulfilled`);
        setKeys(item.abs, { state: "fulfilled", change });
        print([`${shown(item.abs)}: state fulfilled, change ${change}`], {
          ok: true,
          item: shown(item.abs),
          change,
        });
        return 0;
      }
      case "withdraw": {
        const reason = required("reason", "say why the commitment is withdrawn");
        const item = one("specfold commitments withdraw <commitment> --reason <text>");
        const agent = agentReason();
        if (agent)
          throw new EnvError(
            `only humans withdraw commitments (${agent}); run specfold commitments withdraw yourself in a terminal`,
          );
        const login = resolveLogin(config.root);
        if (item.data.state !== "open")
          return refuse(item, `state is '${str(item.data.state)}'; only open commitments are withdrawn`);
        setKeys(item.abs, { state: "withdrawn", reason });
        writeFileSync(
          item.abs,
          verifyText(readFileSync(item.abs, "utf8"), login, isoWithOffset(new Date()), true),
        );
        print([`${shown(item.abs)}: state withdrawn, verified by human:${login}`], {
          ok: true,
          item: shown(item.abs),
          login,
          reason,
        });
        return 0;
      }
      default:
        throw new UsageError(
          sub ? `unknown commitments subcommand '${sub}'` : "missing subcommand: list, fulfill or withdraw",
        );
    }
  },
});
