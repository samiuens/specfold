import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { ACTION_TABLE, type ActionName } from "../src/permissions/actions.ts";
import { type OmpEntry, ompMatches, planOmpPermissions } from "../src/permissions/omp.ts";

/** omp's documented matching: `*` matches any text, whitespace runs are normalized, the whole command matches. */
function matches(match: string, command: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");
  const literal = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${norm(match).split("*").map(literal).join(".*")}$`).test(norm(command));
}

/** The approval of the first entry matching the command, as omp applies it. */
const firstMatch = (entries: OmpEntry[], command: string) =>
  entries.find((e) => matches(e.match, command))?.approval;

const patternsOf = (text: string | undefined): OmpEntry[] => parse(text ?? "").bash.patterns;

const COMMANDS: Record<ActionName, { yes: string; no: string }> = {
  push: { yes: "git push origin main", no: "git pull origin main" },
  "force-push": { yes: "git push --force origin main", no: "git push origin main" },
  "delete-remote-branch": { yes: "git push origin --delete feature", no: "git push origin feature" },
  "push-tags": { yes: "git push origin --tags", no: "git push origin v1.0" },
  "open-pr": { yes: "gh pr create --fill", no: "gh pr list" },
  "merge-pr": { yes: "gh pr merge 12 --squash", no: "gh pr view 12" },
  "close-pr": { yes: "gh pr close 12", no: "gh pr reopen 12" },
};

describe("permissions: omp match strings", () => {
  for (const action of ACTION_TABLE)
    it(`matches one ${action.name} command and not another`, () => {
      const own = ompMatches(action.patterns);
      const { yes, no } = COMMANDS[action.name];
      expect(own.some((m) => matches(m, yes))).toBe(true);
      expect(own.some((m) => matches(m, no))).toBe(false);
    });

  it("strips Bash( ) and owns the bare form of every pattern ending in ' *'", () => {
    expect(ompMatches(["Bash(git push *)", "Bash(gh api *pulls/*/merge*)"])).toEqual([
      "git push *",
      "git push",
      "gh api *pulls/*/merge*",
    ]);
    const push = ompMatches(ACTION_TABLE[0]?.patterns ?? []);
    expect(push.some((m) => matches(m, "git push"))).toBe(true);
    expect(push.some((m) => matches(m, "git  push   origin main"))).toBe(true);
  });
});

describe("permissions: omp rules", () => {
  // spec: specfold-permissions#omp-rules-written
  it("writes a prompt entry for git push into a missing file", () => {
    const plan = planOmpPermissions({ push: "ask" }, undefined);
    expect(plan.target).toBe(".omp/config.yml");
    const entries = patternsOf(plan.text);
    expect(firstMatch(entries, "git push origin main")).toBe("prompt");
    expect(entries.every((e) => Object.keys(e).join() === "match,approval")).toBe(true);
    expect(plan.changes).toContainEqual({
      pattern: "git push *",
      from: "none",
      to: "prompt",
      target: ".omp/config.yml",
    });
    expect(planOmpPermissions({ push: "ask" }, plan.text)).toEqual({
      target: ".omp/config.yml",
      changes: [],
    });
  });

  // spec: specfold-permissions#stricter-force-push-wins
  it("puts the deny entries of force-push before the allow entries of push", () => {
    const entries = patternsOf(planOmpPermissions({ push: "allow", "force-push": "deny" }, undefined).text);
    const at = (name: ActionName) =>
      ompMatches(ACTION_TABLE.find((a) => a.name === name)?.patterns ?? []).map((m) =>
        entries.findIndex((e) => e.match === m),
      );
    expect(Math.max(...at("force-push"))).toBeLessThan(Math.min(...at("push")));
    expect(entries.map((e) => e.approval)).toEqual(
      [...entries.map((e) => e.approval)].sort(
        (a, b) => ["deny", "prompt", "allow"].indexOf(a) - ["deny", "prompt", "allow"].indexOf(b),
      ),
    );
    expect(firstMatch(entries, "git push --force origin main")).toBe("deny");
    expect(firstMatch(entries, "git push origin main")).toBe("allow");
  });

  // spec: specfold-permissions#team-rule-kept
  it("keeps the team entry after the block, unchanged, and every other key", () => {
    const text = [
      "# team settings",
      "task:",
      "  maxRecursionDepth: 1 # keep",
      "bash:",
      "  patterns:",
      '    - { match: "rm -rf *", approval: deny }',
      "    - match: git push *",
      "      approval: allow",
      "  timeout: 30",
      "",
    ].join("\n");
    const plan = planOmpPermissions({}, text);
    const entries = patternsOf(plan.text);
    expect(entries.at(-1)).toEqual({ match: "rm -rf *", approval: "deny" });
    expect(entries.filter((e) => e.match === "git push *")).toEqual([
      { match: "git push *", approval: "prompt" },
    ]);
    expect(plan.text).toContain('- { match: "rm -rf *", approval: deny }');
    expect(plan.text).toContain("# team settings");
    expect(plan.text).toContain("maxRecursionDepth: 1 # keep");
    const { bash, ...rest } = parse(plan.text ?? "");
    const { bash: before, ...restBefore } = parse(text);
    expect(rest).toEqual(restBefore);
    expect(bash.timeout).toBe(before.timeout);
    expect(plan.changes).toContainEqual({
      pattern: "git push *",
      from: "allow",
      to: "prompt",
      target: ".omp/config.yml",
    });
    expect(planOmpPermissions({}, plan.text).changes).toEqual([]);
  });

  it("moves an owned entry that a team entry precedes back into the block", () => {
    const first = planOmpPermissions({}, undefined).text ?? "";
    const entries = patternsOf(first);
    const moved = `bash:\n  patterns:\n${[{ match: "git *", approval: "allow" }, ...entries]
      .map((e) => `    - { match: "${e.match}", approval: ${e.approval} }`)
      .join("\n")}\n`;
    const plan = planOmpPermissions({}, moved);
    expect(plan.changes.length).toBeGreaterThan(0);
    expect(patternsOf(plan.text).at(-1)).toEqual({ match: "git *", approval: "allow" });
    expect(firstMatch(patternsOf(plan.text), "git push origin main")).toBe("prompt");
  });

  it("reports a level change with the omp level names", () => {
    const first = planOmpPermissions({}, undefined).text;
    const plan = planOmpPermissions({ "open-pr": "allow" }, first);
    expect(plan.changes).toContainEqual({
      pattern: "gh pr create *",
      from: "prompt",
      to: "allow",
      target: ".omp/config.yml",
    });
    expect(plan.changes.every((c) => c.from === "prompt" && c.to === "allow")).toBe(true);
  });

  it("refuses a file that is not a mapping or a bash.patterns that is not a list", () => {
    expect(() => planOmpPermissions({}, "- a\n")).toThrow(".omp/config.yml");
    expect(() => planOmpPermissions({}, "bash:\n  patterns: x\n")).toThrow("bash.patterns");
    expect(() => planOmpPermissions({}, "bash: x\n")).toThrow("'bash'");
  });

  it("plans nothing for an invalid setting", () => {
    expect(planOmpPermissions({ push: "maybe" }, "- a\n")).toEqual({
      target: ".omp/config.yml",
      changes: [],
    });
  });
});
