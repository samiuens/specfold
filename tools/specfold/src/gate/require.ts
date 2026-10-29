// `specfold gate require`: one ruleset that makes the specfold-gate check required on the default branch.
// see knowledge: /decisions/blocking-merge-gate.md
import { execFileSync } from "node:child_process";

export const RULESET_NAME = "specfold-gate";
export const CHECK = "specfold-gate";
// GitHub Actions' app id, so only an Actions job can satisfy the check
const ACTIONS_APP_ID = 15368;

export const MANUAL_STEPS =
  "To do it by hand: in the repository's Settings > Rules > Rulesets, add a ruleset for the default branch that requires the status check 'specfold-gate'.";

export interface GhResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/** Runs `gh` with `args`, passing `input` on stdin. */
export type Gh = (args: string[], input?: string) => GhResult;

export const realGh: Gh = (args, input) => {
  try {
    const stdout = execFileSync("gh", args, {
      encoding: "utf8",
      input,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30_000,
    });
    return { ok: true, stdout, stderr: "" };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; code?: string; message: string };
    const stderr = e.code === "ENOENT" ? "gh is not installed" : (e.stderr || e.message).trim();
    return { ok: false, stdout: e.stdout ?? "", stderr };
  }
};

/** The ruleset Specfold wants, in the shape the rulesets API takes and returns. */
export const desiredRuleset = () => ({
  name: RULESET_NAME,
  target: "branch",
  enforcement: "active",
  bypass_actors: [] as unknown[],
  conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] as string[] } },
  rules: [
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: false,
        do_not_enforce_on_create: false,
        required_status_checks: [{ context: CHECK, integration_id: ACTIONS_APP_ID }],
      },
    },
  ],
});

interface Rule {
  type?: unknown;
  parameters?: Record<string, unknown>;
}

interface Ruleset {
  id?: unknown;
  name?: unknown;
  source_type?: unknown;
  target?: unknown;
  enforcement?: unknown;
  bypass_actors?: { actor_id?: unknown; actor_type?: unknown; bypass_mode?: unknown }[];
  conditions?: { ref_name?: { include?: unknown; exclude?: unknown } };
  rules?: Rule[];
}

/** The fields of `r` that Specfold sets, in the order of `desiredRuleset`, for comparing. */
function reduce(r: Ruleset) {
  return {
    name: r.name,
    target: r.target,
    enforcement: r.enforcement,
    bypass_actors: (r.bypass_actors ?? []).map((a) => ({
      actor_id: a.actor_id,
      actor_type: a.actor_type,
      bypass_mode: a.bypass_mode,
    })),
    conditions: {
      ref_name: { include: r.conditions?.ref_name?.include, exclude: r.conditions?.ref_name?.exclude },
    },
    rules: (r.rules ?? []).map((rule) => {
      const p = rule.parameters ?? {};
      const checks = (p.required_status_checks ?? []) as { context?: unknown; integration_id?: unknown }[];
      return rule.type === "required_status_checks"
        ? {
            type: rule.type,
            parameters: {
              strict_required_status_checks_policy: p.strict_required_status_checks_policy ?? false,
              do_not_enforce_on_create: p.do_not_enforce_on_create ?? false,
              required_status_checks: checks.map((c) => ({
                context: c.context,
                integration_id: c.integration_id,
              })),
            },
          }
        : { type: rule.type, parameters: p };
    }),
  };
}

export interface RequireResult {
  repository: string;
  action: "created" | "updated" | "unchanged";
  /** True when nothing was written because of `dryRun`. */
  dryRun: boolean;
}

/** Why the check could not be made required: GitHub's or gh's own words. */
export class RequireError extends Error {}

function json(gh: Gh, args: string[]): unknown {
  const r = gh(args);
  if (!r.ok) throw new RequireError(r.stderr || `gh ${args.join(" ")} failed`);
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new RequireError(`gh ${args.join(" ")} returned no JSON`);
  }
}

/** Creates, updates or keeps the ruleset `specfold-gate`; throws RequireError when GitHub refuses. */
export function requireGate(gh: Gh, o: { dryRun?: boolean } = {}): RequireResult {
  const auth = gh(["auth", "status", "--hostname", "github.com"]);
  if (!auth.ok)
    throw new RequireError(
      auth.stderr === "gh is not installed" ? auth.stderr : "gh is not logged in to github.com",
    );
  const repo = (json(gh, ["repo", "view", "--json", "nameWithOwner"]) as { nameWithOwner?: unknown })
    .nameWithOwner;
  if (typeof repo !== "string") throw new RequireError("gh could not tell the repository of this checkout");
  const listed = json(gh, ["api", `repos/${repo}/rulesets`]);
  if (!Array.isArray(listed)) throw new RequireError(`GitHub returned no ruleset list for ${repo}`);
  const ours = (listed as Ruleset[]).find((r) => r.name === RULESET_NAME && r.source_type === "Repository");
  const desired = desiredRuleset();
  const dryRun = o.dryRun === true;
  const write = (method: string, path: string) => {
    if (dryRun) return;
    const r = gh(["api", "--method", method, path, "--input", "-"], JSON.stringify(desired));
    if (!r.ok) throw new RequireError(r.stderr || `gh api --method ${method} ${path} failed`);
  };
  if (!ours) {
    write("POST", `repos/${repo}/rulesets`);
    return { repository: repo, action: "created", dryRun };
  }
  const full = json(gh, ["api", `repos/${repo}/rulesets/${ours.id}`]) as Ruleset;
  if (JSON.stringify(reduce(full)) === JSON.stringify(desired))
    return { repository: repo, action: "unchanged", dryRun };
  write("PUT", `repos/${repo}/rulesets/${ours.id}`);
  return { repository: repo, action: "updated", dryRun };
}

/** One line for the result, as `gate require` and init print it. */
export function describeResult(r: RequireResult): string {
  if (r.action === "unchanged")
    return `${CHECK} is already a required check on ${r.repository}'s default branch`;
  const verb = r.action === "created" ? "create" : "update";
  return r.dryRun
    ? `would ${verb} ruleset ${RULESET_NAME} on ${r.repository}`
    : `${r.action} ruleset ${RULESET_NAME}: ${CHECK} is now a required check on ${r.repository}'s default branch`;
}
