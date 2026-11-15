import type { Config } from "./repo.ts";

/** Variables omp sets on every agent command: `PI_SESSION_ID` is documented, `OMPCODE` was observed. */
export const OMP_VARIABLES = ["OMPCODE", "PI_SESSION_ID"] as const;

/**
 * The `generated.by` actor of an agent write: `omp/<model>` under omp, else `actors.agent_prefix` + model.
 * omp also sets `CLAUDECODE`, so only its own variables tell the tools apart.
 * see knowledge: /references/omp.md
 */
export function agentBy(
  config: Pick<Config, "agentPrefix">,
  model: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return OMP_VARIABLES.some((v) => env[v]) ? `omp/${model}` : `${config.agentPrefix}${model}`;
}
