import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { readLimit, TOOL_DEFAULT } from "../parallel/limit.ts";
import { requireConfig } from "../repo.ts";
import { planBatches } from "./plan.ts";
import { cleanWorktrees, newWorktree, type Outcome, setupWorktree } from "./worktrees.ts";

const SUBCOMMANDS = ["plan", "new", "setup", "clean"];

register({
  name: "wt",
  summary: "plan, create, set up and clean worktrees for parallel changes and task groups",
  usage: "specfold wt plan | new <change> | setup | clean [--base <ref>] [--json]",
  options: { base: { type: "string" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...args] = positionals;
    if (sub === undefined || !SUBCOMMANDS.includes(sub))
      throw new UsageError(
        `${sub ? `unknown wt subcommand '${sub}'` : "missing subcommand"}: plan, new, setup or clean`,
      );
    const wanted = sub === "new" ? 1 : 0;
    if (args.length !== wanted)
      throw new UsageError(
        sub === "new" ? "wt new takes one change name" : `unexpected argument '${args[0]}'`,
      );
    if (values.base !== undefined && sub !== "clean") throw new UsageError("--base works only with wt clean");
    const root = requireConfig(io.cwd).root;
    const print = (lines: string[], json: Record<string, unknown>) =>
      io.stdout(values.json ? `${JSON.stringify(json, null, 2)}\n` : `${lines.join("\n")}\n`);
    const log = (text: string) => {
      if (text) io.stderr(text.endsWith("\n") ? text : `${text}\n`);
    };

    if (sub === "plan") {
      const limit = readLimit(root);
      const value = limit.value ?? TOOL_DEFAULT;
      const { conflicts, batches } = planBatches(root, value);
      const changes = batches.reduce((n, b) => n + b.length, 0);
      print(
        [
          ...conflicts.map((c) => `conflict: ${c.first} and ${c.second}: ${c.reason}`),
          ...batches.map((b, i) => `batch ${i + 1}: ${b.join(", ")}`),
          `wt plan: ${plural(changes, "active change")} in ${batches.length} ${batches.length === 1 ? "batch" : "batches"}, limit ${value} (${limit.value === undefined ? `Claude Code's default; set yours with specfold parallel set` : `from ${limit.source}`})`,
        ],
        { ok: true, limit: value, conflicts, batches },
      );
      return 0;
    }

    const outcome: Outcome =
      sub === "new"
        ? newWorktree(root, args[0] as string, log)
        : sub === "setup"
          ? setupWorktree(io.cwd, log)
          : cleanWorktrees(root, values.base as string | undefined);
    if (sub === "new" && !outcome.ok) {
      if (values.json) print([], { ok: false, error: outcome.lines.join("; ") });
      else io.stderr(`specfold: ${outcome.lines.join("; ")}; nothing was created\n`);
      return 1;
    }
    print(outcome.lines, { ok: outcome.ok, lines: outcome.lines });
    return outcome.ok ? 0 : 1;
  },
});
