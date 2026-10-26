import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { checkKnowledge } from "../change/knowledge.ts";
import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { syncIndexes } from "../indexes/command.ts";
import { generateIndexes } from "../indexes/generate.ts";
import { locationsByConcept, scanReferences } from "../indexes/refs.ts";
import { localDate } from "../log/command.ts";
import { insertEntry } from "../log/insert.ts";
import { type Config, requireConfig, resolveBundleRoot } from "../repo.ts";
import { taskFindingLine } from "../tasks/command.ts";
import { type Action, applyWrites, planOps } from "./apply.ts";

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ARCHIVED = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** The archived change id for a change name or id; the newest date wins for a name. */
export function resolveArchived(config: Config, arg: string | undefined): string {
  if (!arg) throw new UsageError("missing change name");
  const archive = join(config.root, "openspec", "changes", "archive");
  if (ARCHIVED.test(arg) && existsSync(join(archive, arg))) return arg;
  if (!NAME.test(arg)) throw new UsageError(`'${arg}' is not a change name or archived change id`);
  const ids = existsSync(archive)
    ? readdirSync(archive)
        .filter((d) => ARCHIVED.exec(d)?.[2] === arg)
        .sort()
    : [];
  const newest = ids.at(-1);
  if (newest) return newest;
  if (existsSync(join(config.root, "openspec", "changes", arg)))
    throw new EnvError(`change '${arg}' is not archived yet: run 'openspec archive ${arg}' first`);
  throw new EnvError(`unknown change '${arg}': no archived folder openspec/changes/archive/<date>-${arg}/`);
}

register({
  name: "sync",
  summary: "apply an archived change's knowledge delta: stubs, keys, indexes, log",
  usage: "specfold sync <change> [--dry-run] [--json]",
  options: { "dry-run": { type: "boolean" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    if (positionals.length > 1) throw new UsageError(`unexpected argument '${positionals[1]}'`);
    const config = requireConfig(io.cwd);
    const id = resolveArchived(config, positionals[0]);
    const bundleRoot = resolveBundleRoot(io.cwd, undefined, config);
    const relDir = `openspec/changes/archive/${id}`;
    const dryRun = values["dry-run"] === true;
    const print = (ok: boolean, actions: Action[], findings: unknown[], text: string[]) =>
      io.stdout(
        values.json
          ? `${JSON.stringify({ ok, change: id, dryRun, actions, findings }, null, 2)}\n`
          : `${text.join("\n")}\n`,
      );

    const { findings, ops } = checkKnowledge(config, bundleRoot, join(config.root, relDir), {
      relDir,
      archived: true,
    });
    if (findings.length > 0) {
      print(false, [], findings, [
        ...findings.map(taskFindingLine),
        `sync ${id}: ${plural(findings.length, "error")}, nothing written`,
      ]);
      return 1;
    }

    const model = process.env.SPECFOLD_MODEL;
    const by = model ? `${config.agentPrefix}${model}` : "process:specfold-sync";
    const plan = planOps(ops, { repoRoot: config.root, bundleRoot, archivedId: id, by, now: new Date() });
    const actions = [...plan.actions];

    const logPath = join(bundleRoot, "log.md");
    const logRel = relative(config.root, logPath).split(sep).join("/");
    const logText = existsSync(logPath) ? readFileSync(logPath, "utf8") : undefined;
    const needsLog = !logText?.includes(id);

    if (!dryRun) {
      applyWrites(plan);
      const refs = scanReferences(config.root, config.sourceGlobs);
      const { indexes } = generateIndexes(bundleRoot, config, locationsByConcept(refs));
      for (const path of syncIndexes(config.root, bundleRoot, indexes, false))
        actions.push({ path, action: "write index" });
      if (needsLog) {
        const count = (kind: string) => ops.filter((o) => o.op === kind).length;
        const entry = `* **Change**: ${id}: created ${count("create")}, updated ${count("update")}, deprecated ${count("deprecate")}`;
        writeFileSync(logPath, insertEntry(logText, localDate(), entry));
      }
    }
    if (needsLog) actions.push({ path: logRel, action: "add log entry" });

    const verb = dryRun ? "would sync" : "synced";
    print(
      true,
      actions,
      [],
      [
        ...actions.map((a) => `${a.path}: ${a.action}`),
        actions.length === 0
          ? `${verb} ${id}: nothing to change`
          : `${verb} ${id}: ${plural(actions.length, "change")}`,
      ],
    );
    return 0;
  },
});
