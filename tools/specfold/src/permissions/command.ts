import { register } from "../cli.ts";
import { EnvError, UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { SETTINGS_FILE } from "./render.ts";
import { planLines, syncPermissions } from "./sync.ts";

register({
  name: "permissions",
  summary: "render the permissions in specfold.yaml into agent tool settings",
  usage: "specfold permissions sync [--check] [--json]",
  options: { check: { type: "boolean" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...extra] = positionals;
    if (sub !== "sync")
      throw new UsageError(
        sub ? `unknown permissions subcommand '${sub}'` : "missing subcommand: specfold permissions sync",
      );
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const config = requireConfig(io.cwd);
    const check = values.check === true;
    const plan = syncPermissions(config, check);
    if (plan.conflict) throw new EnvError(`${SETTINGS_FILE} ${plan.conflict}; nothing was written`);
    const ok = plan.problems.length === 0 && (!check || plan.changes.length === 0);

    if (values.json) {
      const { target, changes, problems } = plan;
      io.stdout(`${JSON.stringify({ ok, check, target, changes, problems }, null, 2)}\n`);
    } else {
      const lines = planLines(plan);
      const name = `permissions sync${check ? " --check" : ""}`;
      if (plan.problems.length > 0)
        lines.push(
          `${name}: ${plural(plan.problems.length, "problem")} in 'permissions', nothing was written`,
        );
      else if (plan.target === null)
        lines.push(`${name}: no tool needs rendered rules (agents.targets has no .claude/skills)`);
      else
        lines.push(
          `${name}: ${plan.changes.length === 0 ? "rules are up to date" : plural(plan.changes.length, "change")}`,
        );
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
