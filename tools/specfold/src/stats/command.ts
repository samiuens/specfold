import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { register } from "../cli.ts";
import { EnvError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig, resolveBundleRoot } from "../repo.ts";
import {
  alwaysLoaded,
  estimateFiles,
  knowledgeFolders,
  type Overrun,
  overBudget,
  type SetItem,
  total,
} from "./stats.ts";

const label = (item: SetItem) =>
  item.kind === "skill"
    ? `skill ${item.name}`
    : item.kind === "hook"
      ? "SessionStart hook output"
      : item.kind === "context"
        ? `${item.path} context`
        : item.path;

const overLine = (o: Overrun) =>
  `over budget: ${o.item ? label(o.item) : "always-loaded set"} ${o.tokens} > ${o.limit} (stats.budget.${o.budget})`;

/** Rows of `label  tokens`, the numbers right-aligned in one column. */
function table(rows: [string, number, (string | undefined)?][]): string[] {
  const width = Math.max(...rows.map(([l]) => l.length));
  const digits = Math.max(...rows.map(([, n]) => String(n).length));
  return rows.map(
    ([l, n, note]) => `  ${l.padEnd(width)}  ${String(n).padStart(digits)}${note ? ` ${note}` : ""}`,
  );
}

register({
  name: "stats",
  summary: "estimate the tokens an agent always loads, against the budgets in specfold.yaml",
  usage: "specfold stats [<path>...] [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const config = requireConfig(io.cwd);
    const print = (lines: string[], json: Record<string, unknown>) =>
      io.stdout(values.json ? `${JSON.stringify(json, null, 2)}\n` : `${lines.join("\n")}\n`);

    if (positionals.length > 0) {
      const paths = positionals.map((p) => resolve(io.cwd, p));
      const missing = positionals.filter((_, i) => !existsSync(paths[i] as string));
      if (missing.length > 0) throw new EnvError(`no such file or folder: ${missing.join(", ")}`);
      const files = estimateFiles(config.root, paths);
      const sum = files.reduce((s, f) => s + f.tokens, 0);
      print(
        [
          "estimated tokens (characters / 4):",
          ...(files.length > 0 ? table(files.map((f) => [f.path, f.tokens])) : []),
          `stats: ${sum} tokens in ${plural(files.length, "file")}`,
        ],
        { ok: true, files, total: sum },
      );
      return 0;
    }

    const set = alwaysLoaded(config);
    const sum = total(set);
    const over = overBudget(set, config.statsBudget);
    const folders = knowledgeFolders(resolveBundleRoot(config.root, undefined, config));
    const budgets = {
      agents_md: config.statsBudget.agentsMd,
      total: config.statsBudget.total,
      skill_description: config.statsBudget.skillDescription,
    };
    print(
      [
        "always-loaded set, estimated tokens (characters / 4):",
        ...table([
          ...set.map((i): [string, number, (string | undefined)?] => [
            label(i),
            i.tokens,
            "missing" in i && i.missing ? "(missing)" : undefined,
          ]),
          ["total", sum, `(budget ${budgets.total})`],
        ]),
        "knowledge, estimated tokens:",
        ...table([
          ...folders.map((f): [string, number] => [f.folder, f.tokens]),
          ["total", folders.reduce((s, f) => s + f.tokens, 0)],
        ]),
        ...over.map(overLine),
        `stats: ${sum} tokens always loaded, ${plural(over.length, "budget")} exceeded`,
      ],
      {
        ok: over.length === 0,
        set,
        total: sum,
        budgets,
        over: over.map((o) => ({
          budget: o.budget,
          item: o.item ? label(o.item) : null,
          tokens: o.tokens,
          limit: o.limit,
        })),
        knowledge: folders,
      },
    );
    return over.length === 0 ? 0 : 1;
  },
});
