import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { setupGraphify } from "./setup.ts";

register({
  name: "graphify",
  summary: "set up graphify code-only: its skill, .graphifyignore, the Claude Code guard and the first graph",
  usage: "specfold graphify setup [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...rest] = positionals;
    if (sub === undefined) throw new UsageError("missing subcommand: setup");
    if (sub !== "setup") throw new UsageError(`unknown graphify subcommand '${sub}'`);
    if (rest.length > 0) throw new UsageError(`unexpected argument '${rest[0]}'`);
    const result = setupGraphify(requireConfig(io.cwd));
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`);
      return 0;
    }
    io.stdout(
      `${[
        ...result.actions.map((a) => `${a.path}: ${a.action}`),
        result.actions.length === 0
          ? "graphify setup: everything is up to date"
          : `graphify setup: ${plural(result.actions.length, "change")}`,
      ].join("\n")}\n`,
    );
    return 0;
  },
});
