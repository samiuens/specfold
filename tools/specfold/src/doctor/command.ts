import { execFileSync } from "node:child_process";
import { register } from "../cli.ts";
import { type Check, type DoctorEnv, runChecks } from "./checks.ts";

export function realEnv(cwd: string): DoctorEnv {
  return {
    cwd,
    nodeVersion: process.versions.node,
    exec: (cmd, args, dir) => {
      try {
        return execFileSync(cmd, args, {
          cwd: dir,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          timeout: 10_000,
        });
      } catch {
        return undefined;
      }
    },
  };
}

export const exitCode = (checks: Check[]) => (checks.some((c) => c.status === "fail") ? 1 : 0);

export function render(checks: Check[], json: boolean): string {
  if (json) return `${JSON.stringify({ ok: exitCode(checks) === 0, checks }, null, 2)}\n`;
  const lines = checks.flatMap((c) => [
    `${c.id} ${c.status} ${c.message}`,
    ...(c.fix ? [`    fix: ${c.fix}`] : []),
  ]);
  return `${lines.join("\n")}\n`;
}

register({
  name: "doctor",
  summary: "check the environment and Specfold configuration",
  usage: "specfold doctor [--json]",
  options: { json: { type: "boolean" } },
  run: ({ io, values }) => {
    const checks = runChecks(realEnv(io.cwd));
    io.stdout(render(checks, values.json === true));
    return exitCode(checks);
  },
});
