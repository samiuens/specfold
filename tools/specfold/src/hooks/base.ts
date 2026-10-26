import { git, gitSucceeds } from "../git.ts";

/** The branch the local gate compares against: origin/HEAD, else origin/main; undefined when neither exists. */
export function localBase(root: string): string | undefined {
  try {
    const head = git(root, ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"]).trim();
    if (head) return head.replace(/^refs\/remotes\//, "");
  } catch {
    // no origin/HEAD; try origin/main
  }
  return gitSucceeds(root, ["rev-parse", "--verify", "--quiet", "origin/main^{commit}"])
    ? "origin/main"
    : undefined;
}
