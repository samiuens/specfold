import { resolve } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { git } from "../git.ts";
import { parseProfile } from "../repo.ts";
import { detect } from "./detect.ts";
import { installKit, parseTools } from "./install.ts";
import { inventory } from "./inventory.ts";
import { branchExists, currentBranch, defaultBranch, dirtyPaths, gitRoot, MIGRATION_BRANCH } from "./repo.ts";
import { MARKABLE, markStep, nextStep, readState, STEPS, type Step, writeState } from "./state.ts";

const NEXT: Record<Step, string> = {
  start: "specfold migrate start",
  inventory: "specfold migrate inventory",
  plan: "write .specfold/migration/plan.md, get it approved, then specfold migrate mark plan",
  install: "specfold migrate install --from <template folder>",
  convert: "convert the plan rows into concepts, then specfold migrate mark convert",
  seed: "seed concepts from the code, then specfold migrate mark seed",
  report: "validate and write .specfold/migration/report.md, then specfold migrate mark report",
};

const head = (root: string) => {
  try {
    return git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]).trim();
  } catch {
    return null; // a repository without commits yet
  }
};

register({
  name: "migrate",
  summary: "bring an existing repository into Specfold: own branch, state, inventory, kit install",
  usage:
    "specfold migrate start [--default-branch <name>] | inventory | install --from <dir> [--profile <full|knowledge>] [--tools <list>] [--stack <text>] [--source-glob <glob>]... [--ref <ref>] [--upgrade-workflow] | mark <step> | status  [--json]",
  options: {
    "default-branch": { type: "string" },
    from: { type: "string" },
    profile: { type: "string" },
    tools: { type: "string" },
    stack: { type: "string" },
    "source-glob": { type: "string", multiple: true },
    ref: { type: "string" },
    "upgrade-workflow": { type: "boolean" },
    json: { type: "boolean" },
  },
  run: ({ io, values, positionals }) => {
    const [sub, ...args] = positionals;
    const allowed = sub === "mark" ? 1 : 0;
    if (args.length > allowed) throw new UsageError(`unexpected argument '${args[allowed]}'`);
    if (sub === undefined)
      throw new UsageError("missing subcommand: start, inventory, install, mark or status");
    if (!["start", "inventory", "install", "mark", "status"].includes(sub))
      throw new UsageError(`unknown migrate subcommand '${sub}'`);
    const profile = values.profile === undefined ? undefined : parseProfile(values.profile, "--profile");
    const root = gitRoot(io.cwd);
    const print = (lines: string[], json: Record<string, unknown>) =>
      io.stdout(values.json ? `${JSON.stringify(json, null, 2)}\n` : `${lines.join("\n")}\n`);
    const refuse = (message: string) => {
      if (values.json) io.stdout(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
      else io.stderr(`specfold: ${message}\n`);
      return 1;
    };
    const now = new Date();
    let state = readState(root);
    const next = () => {
      const step = nextStep(state);
      return step === null ? "all migration steps are done" : `next: ${NEXT[step]}`;
    };

    if (sub === "status") {
      const rows = STEPS.map((s) =>
        `${state.steps[s] ? "done" : "open"}  ${s.padEnd(9)}${state.steps[s] ?? ""}`.trimEnd(),
      );
      print([...rows, next()], {
        steps: state.steps,
        next: nextStep(state),
        default_branch: state.default_branch,
      });
      return 0;
    }

    if (sub === "start") {
      const dirty = dirtyPaths(root);
      if (dirty.length > 0)
        return refuse(
          `the working tree has uncommitted changes (${dirty.slice(0, 3).join(", ")}${dirty.length > 3 ? ", ..." : ""}): commit or stash them first`,
        );
      const current = currentBranch(root);
      if (current === undefined) return refuse("HEAD is detached: check out the default branch first");
      let message: string;
      if (current === MIGRATION_BRANCH) {
        message = `resuming on ${MIGRATION_BRANCH}`;
        state = {
          ...state,
          default_branch:
            state.default_branch ?? defaultBranch(root, values["default-branch"] as string | undefined),
        };
      } else {
        const base = defaultBranch(root, values["default-branch"] as string | undefined);
        if (current !== base)
          return refuse(
            `on branch '${current}': the migration only starts from the default branch '${base}' and runs on ${MIGRATION_BRANCH}`,
          );
        if (branchExists(root, MIGRATION_BRANCH)) {
          git(root, ["checkout", "--quiet", MIGRATION_BRANCH]);
          message = `switched to ${MIGRATION_BRANCH}`;
        } else {
          const commit = head(root);
          git(root, ["checkout", "--quiet", "-b", MIGRATION_BRANCH]);
          message = `created ${MIGRATION_BRANCH} from ${base}`;
          state = { ...state, base: state.base ?? commit };
        }
        state = { ...state, default_branch: base };
      }
      state = markStep(state, "start", now);
      writeState(root, state);
      print([message, next()], { ok: true, branch: MIGRATION_BRANCH, message, next: nextStep(state) });
      return 0;
    }

    if (currentBranch(root) !== MIGRATION_BRANCH)
      return refuse(`not on ${MIGRATION_BRANCH}: run specfold migrate start first; nothing was written`);

    if (sub === "inventory") {
      const sources = inventory(root);
      const found = detect(root);
      state = markStep({ ...state, inventory: { sources, ...found } }, "inventory", now);
      writeState(root, state);
      const width = Math.max(4, ...sources.map((s) => s.kind.length));
      const tokens = sources.reduce((sum, s) => sum + s.tokens, 0);
      print(
        [
          ...sources.map(
            (s) =>
              `${s.kind.padEnd(width)}  ${String(s.tokens).padStart(6)}  ${s.path}${s.type ? `  (${s.type} -> ${s.suggested ?? "?"})` : ""}`,
          ),
          `stack: ${found.stack.join(", ") || "unknown"}`,
          `layout: ${found.layout}`,
          `ci: ${found.ci.join(", ") || "none"}`,
          `source globs: ${found.sourceGlobs.join(", ")}${found.globsFallback ? " (fallback: no code folder found)" : ""}`,
          `inventory: ${plural(sources.length, "source")}, about ${tokens} tokens`,
          next(),
        ],
        { ok: true, sources, ...found, next: nextStep(state) },
      );
      return 0;
    }

    if (sub === "mark") {
      const step = args[0] as Step | undefined;
      if (!step || !MARKABLE.includes(step))
        throw new UsageError(`mark takes one of ${MARKABLE.join(", ")}${step ? `, got '${step}'` : ""}`);
      state = markStep(state, step, now);
      writeState(root, state);
      print([`${step}: done`, next()], { ok: true, step, next: nextStep(state) });
      return 0;
    }

    const from = values.from as string | undefined;
    if (!from) throw new UsageError("missing --from <dir>: the unpacked template folder to install from");
    const globs = values["source-glob"] as unknown as string[] | undefined;
    const result = installKit({
      root,
      from: resolve(io.cwd, from),
      tools: parseTools(values.tools as string | undefined),
      profile,
      stack: values.stack as string | undefined,
      sourceGlobs: globs,
      ref: values.ref as string | undefined,
      upgradeWorkflow: values["upgrade-workflow"] === true,
    });
    const ok = result.conflicts.length === 0;
    if (ok) state = markStep(state, "install", now);
    writeState(root, state);
    const summary =
      result.actions.length === 0 && ok
        ? "migrate install: everything is up to date"
        : `migrate install: ${plural(result.actions.length, "change")}, ${plural(result.conflicts.length, "conflict")}`;
    print(
      [
        ...result.actions.map((a) => `${a.path}: ${a.action}`),
        ...result.conflicts.map((c) => `${c.path}: conflict: ${c.reason}`),
        summary,
        ...result.notes.map((n) => `then: ${n}`),
        ...(ok ? [next()] : ["resolve the conflicts, then run install again"]),
      ],
      { ok, ...result, next: ok ? nextStep(state) : "install" },
    );
    return ok ? 0 : 1;
  },
});
