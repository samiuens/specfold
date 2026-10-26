import { execFileSync } from "node:child_process";
import { write } from "./gate-helpers.ts";

/** Writes the files and commits everything with the given author and committer date. */
export function commitAt(root: string, date: string, files: Record<string, string>, message = "work"): void {
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
      cwd: root,
      env,
    });
  git("add", "-A");
  git("commit", "-q", "--allow-empty", "-m", message);
}

/** A concept with the given trust frontmatter lines and body. */
export const dependent = (extra: string, body = "Text.\n") =>
  `---\ntype: Decision\ntitle: Retries\ndescription: Retry policy.\nstatus: draft\n${extra}\n---\n\n${body}`;
