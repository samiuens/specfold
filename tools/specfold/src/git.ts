import { execFileSync } from "node:child_process";
import { EnvError } from "./errors.ts";

/** Runs git in `repoRoot` and returns stdout; a failure is an environment error with git's first stderr line. */
export function git(repoRoot: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? "")
      .trim()
      .split("\n")[0];
    throw new EnvError(`git ${args[0]} failed${stderr ? `: ${stderr}` : ""}`);
  }
}

/** True when git exits with 0; output is discarded. */
export function gitSucceeds(repoRoot: string, args: string[]): boolean {
  try {
    execFileSync("git", args, { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
