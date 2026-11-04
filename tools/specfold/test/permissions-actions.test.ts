import { describe, expect, it } from "vitest";
import { ACTION_TABLE, ACTIONS, RETIRED } from "../src/permissions/actions.ts";

/**
 * Claude Code's Bash rule matching as documented (/references/claude-code.md, Permissions): `*` matches
 * any text, `:*` at the end equals ` *`, and a trailing ` *` that is the only wildcard also matches the
 * bare command.
 */
function matches(rule: string, command: string): boolean {
  const inner = /^Bash\((.*)\)$/.exec(rule)?.[1];
  if (inner === undefined) throw new Error(`not a Bash rule: ${rule}`);
  const body = inner.endsWith(":*") ? `${inner.slice(0, -2)} *` : inner;
  const regex = (text: string) =>
    new RegExp(
      `^${text
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    );
  if (regex(body).test(command)) return true;
  const stars = body.split("*").length - 1;
  return stars === 1 && body.endsWith(" *") && command === body.slice(0, -2);
}

const patterns = (name: string) => ACTION_TABLE.find((a) => a.name === name)?.patterns ?? [];
const anyMatch = (name: string, command: string) => patterns(name).some((p) => matches(p, command));

describe("permissions: action table", () => {
  it("lists the seven actions in table order", () => {
    expect(ACTION_TABLE.map((a) => a.name)).toEqual([...ACTIONS]);
  });

  it("matches the documented examples", () => {
    expect(matches("Bash(ls *)", "ls")).toBe(true);
    expect(matches("Bash(ls *)", "lsof")).toBe(false);
    expect(matches("Bash(ls:*)", "ls -la")).toBe(true);
    expect(matches("Bash(git log * main)", "git log main")).toBe(false);
    expect(matches("Bash(* --help *)", "npm --help")).toBe(false);
  });

  it.each([
    ["push", "git push origin main", "git pull origin main"],
    ["push", "git push", "git pushx"],
    ["force-push", "git push --force-with-lease origin main", "git push origin main"],
    ["force-push", "git push -f origin main", "git push --follow-tags"],
    ["force-push", "git push origin -f", "git push origin feature-fix"],
    ["force-push", "git push origin +main", "git push origin a+b"],
    ["delete-remote-branch", "git push origin --delete old", "git push origin main"],
    ["delete-remote-branch", "git push -d origin old", "git push origin dev"],
    ["delete-remote-branch", "git push origin -d old", "git push origin HEAD:main"],
    ["push-tags", "git push --follow-tags", "git push origin main"],
    ["push-tags", "git push origin --tags", "git tag v1"],
    ["open-pr", "gh pr create --fill", "gh pr view 3"],
    ["merge-pr", "gh pr merge 3 --squash", "gh pr view 3"],
    ["merge-pr", "gh api -X PUT repos/o/r/pulls/3/merge", "gh api repos/o/r/pulls/3"],
    ["close-pr", "gh pr close 3", "gh pr checks 3"],
    [
      "close-pr",
      "gh api -X PATCH repos/o/r/pulls/3 -f state=closed",
      "gh api repos/o/r/pulls/3 -f state=open",
    ],
  ])("%s matches '%s' and misses '%s'", (name, hit, miss) => {
    expect(anyMatch(name, hit)).toBe(true);
    expect(anyMatch(name, miss)).toBe(false);
  });

  it("puts every push sub-action under the push rule", () => {
    for (const action of ACTION_TABLE.filter((a) => a.parent === "push"))
      for (const sample of ["git push --force", "git push -d origin x", "git push --tags"])
        if (anyMatch(action.name, sample)) expect(anyMatch("push", sample)).toBe(true);
  });

  it("keeps retired patterns apart from the current ones", () => {
    const current = ACTION_TABLE.flatMap((a) => a.patterns);
    expect(RETIRED.filter((p) => current.includes(p))).toEqual([]);
    expect(new Set(current).size).toBe(current.length);
  });
});
