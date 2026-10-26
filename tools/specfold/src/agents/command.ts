import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { applyLinks, listSkills, planLinks } from "./sync.ts";

register({
  name: "agents",
  summary: "link .agents/skills into the skill folders of agent tools",
  usage: "specfold agents sync [--check] [--json]",
  options: { check: { type: "boolean" }, json: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...extra] = positionals;
    if (sub !== "sync")
      throw new UsageError(
        sub ? `unknown agents subcommand '${sub}'` : "missing subcommand: specfold agents sync",
      );
    if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
    const config = requireConfig(io.cwd);
    const check = values.check === true;
    const skills = listSkills(config.root);
    const actions = skills ? planLinks(config.root, skills, config.agentTargets) : [];
    const changes = actions.filter((a) => a.action !== "kept");
    if (!check) applyLinks(config.root, actions);
    const ok = !check || changes.length === 0;

    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, check, actions }, null, 2)}\n`);
    } else if (!skills) {
      io.stdout("no skills to link: .agents/skills/ does not exist\n");
    } else {
      const lines = actions.map(
        (a) => `${a.path}: ${a.action}${a.target && a.action !== "kept" ? ` -> ${a.target}` : ""}`,
      );
      const counts = changes.length === 0 ? "links are up to date" : plural(changes.length, "change");
      lines.push(`agents sync${check ? " --check" : ""}: ${counts}, ${actions.length - changes.length} kept`);
      io.stdout(`${lines.join("\n")}\n`);
    }
    return ok ? 0 : 1;
  },
});
