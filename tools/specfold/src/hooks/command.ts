import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { installHooks } from "./install.ts";

register({
  name: "hooks",
  summary: "install Specfold's git hooks, or add them to the repository's hook manager",
  usage: "specfold hooks install [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...extra] = positionals;
    if (sub !== "install")
      throw new UsageError(
        sub ? `unknown hooks subcommand '${sub}'` : "missing subcommand: specfold hooks install",
      );
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const result = installHooks(requireConfig(io.cwd));
    if (values.json) {
      io.stdout(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`);
      return 0;
    }
    const target = result.manager ?? "built-in hooks";
    const lines = [
      ...result.actions.map((a) => `${a.path}: ${a.action}`),
      result.actions.length === 0
        ? `hooks install: ${target} are up to date`
        : `hooks install: ${plural(result.actions.length, "change")} (${target})`,
      ...(result.next ? [`next: ${result.next}`] : []),
    ];
    io.stdout(`${lines.join("\n")}\n`);
    return 0;
  },
});
