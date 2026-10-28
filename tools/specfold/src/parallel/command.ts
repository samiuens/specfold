import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { requireConfig } from "../repo.ts";
import { LIMIT_VARIABLE, readLimit, TOOL_DEFAULT, writeLimit } from "./limit.ts";

register({
  name: "parallel",
  summary: "set or show your personal limit on subagents running at the same time",
  usage: "specfold parallel set <n> | show [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...args] = positionals;
    if (sub !== "set" && sub !== "show") throw new UsageError("missing or unknown subcommand: set or show");
    const root = requireConfig(io.cwd).root;
    const print = (line: string, json: Record<string, unknown>) =>
      io.stdout(values.json ? `${JSON.stringify(json, null, 2)}\n` : `${line}\n`);
    if (sub === "show") {
      if (args.length > 0) throw new UsageError(`unexpected argument '${args[0]}'`);
      const limit = readLimit(root);
      print(
        limit.value === undefined
          ? `subagent limit: not set, so the tool's default applies (Claude Code: ${TOOL_DEFAULT})`
          : `subagent limit: ${limit.value} (from ${limit.source})`,
        { ok: true, value: limit.value ?? null, source: limit.source },
      );
      return 0;
    }
    if (args.length !== 1 || !/^[1-9]\d*$/.test(args[0] as string))
      throw new UsageError(`parallel set takes one positive whole number, got '${args.join(" ")}'`);
    const n = Number(args[0]);
    const changed = writeLimit(root, n);
    print(
      `subagent limit: ${n}${n === 1 ? " (task groups run one after another)" : ""}${changed.length === 0 ? ", already set" : `, written to ${changed.join(" and ")}`}`,
      { ok: true, value: n, changed, variable: LIMIT_VARIABLE },
    );
    return 0;
  },
});
