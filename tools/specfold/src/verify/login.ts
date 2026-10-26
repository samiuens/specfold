import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { EnvError } from "../errors.ts";

export const LOCAL_FILE = ".specfold/local.yaml";
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** Calls into the machine, replaced in tests. */
export const system = {
  /** The login `gh api user` reports, or undefined when gh is missing or not logged in. */
  ghLogin(cwd: string): string | undefined {
    try {
      return execFileSync("gh", ["api", "user", "--jq", ".login"], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 10_000,
      }).trim();
    } catch {
      return undefined;
    }
  },
  /** stdin is a terminal, so a person can be at the keyboard. */
  isInteractive(): boolean {
    return process.stdin.isTTY === true;
  },
};

function localLogin(root: string): string | undefined {
  const path = join(root, LOCAL_FILE);
  if (!existsSync(path)) return undefined;
  let data: unknown;
  try {
    data = parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new EnvError(`${LOCAL_FILE}: ${(error as Error).message.split("\n")[0]}`);
  }
  const login = (data as { actors?: { github_login?: unknown } } | null)?.actors?.github_login;
  return typeof login === "string" ? login : undefined;
}

/** The GitHub login of the person running the command: gh first, then `.specfold/local.yaml`. */
export function resolveLogin(root: string): string {
  const login = system.ghLogin(root) || localLogin(root);
  if (!login)
    throw new EnvError(
      `no GitHub login found: log in with 'gh auth login', or set actors.github_login in ${LOCAL_FILE}`,
    );
  if (!LOGIN.test(login)) throw new EnvError(`'${login}' is not a GitHub login`);
  return login;
}
