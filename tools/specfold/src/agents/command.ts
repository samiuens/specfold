import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { plural } from "../findings.ts";
import { requireConfig } from "../repo.ts";
import { applyLinks, applyOmp, listSkills, planLinks, planOmp } from "./sync.ts";

/** How an action's target reads in the text report; kept entries show none. */
function targetText(action: string, target: string | null): string {
  if (!target || action === "kept") return "";
  if (action === "write" || action === "rewrite") return ` from ${target}`;
  return action === "set" ? ` ${target}` : ` -> ${target}`;
}

register({
  name: "agents",
  summary: "link .agents/skills into the skill folders of agent tools and generate omp roles",
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
    const listed = config.tools.includes("omp");
    const skills = listSkills(config.root);
    const links = skills ? planLinks(config.root, skills, config.agentTargets) : [];
    const omp = planOmp(config);
    const actions = [
      ...links,
      ...omp.roles.map(({ path, action, target }) => ({ path, action, target })),
      ...omp.settings,
    ];
    const changes = actions.filter((a) => a.action !== "kept");
    if (!check) {
      applyLinks(config.root, links);
      applyOmp(config.root, omp);
    }
    const ok = !check || changes.length === 0;

    if (values.json) {
      io.stdout(`${JSON.stringify({ ok, check, actions }, null, 2)}\n`);
      return ok ? 0 : 1;
    }
    const lines = actions.map((a) => `${a.path}: ${a.action}${targetText(a.action, a.target)}`);
    if (!skills) lines.unshift("no skills to link: .agents/skills/ does not exist");
    if (skills || listed || actions.length > 0) {
      const current = listed ? "links and roles are up to date" : "links are up to date";
      const counts = changes.length === 0 ? current : plural(changes.length, "change");
      lines.push(`agents sync${check ? " --check" : ""}: ${counts}, ${actions.length - changes.length} kept`);
    }
    io.stdout(`${lines.join("\n")}\n`);
    return ok ? 0 : 1;
  },
});
