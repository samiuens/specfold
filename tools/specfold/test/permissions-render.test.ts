import { describe, expect, it } from "vitest";
import { ACTION_TABLE } from "../src/permissions/actions.ts";
import { applyRules, desiredRules, planPermissions, resolveLevels } from "../src/permissions/render.ts";

const rules = (name: string) => ACTION_TABLE.find((a) => a.name === name)?.patterns ?? [];
const all = ACTION_TABLE.flatMap((a) => a.patterns);
const claude = [".claude/skills"];

describe("permissions: levels", () => {
  // spec: specfold-permissions#no-permissions-key
  it("counts a missing key as ask for every action", () => {
    const { levels, problems } = resolveLevels(undefined);
    expect(problems).toEqual([]);
    expect(desiredRules(levels)).toEqual({ allow: [], ask: all, deny: [] });
    expect(resolveLevels({ push: "allow" }).levels["open-pr"]).toBe("ask");
  });

  // spec: specfold-permissions#unknown-action
  it("names an unknown action", () => {
    const { problems } = resolveLevels({ "publish-release": "ask" });
    expect(problems).toEqual([
      { action: "publish-release", message: expect.stringContaining("unknown action") },
    ]);
  });

  // spec: specfold-permissions#unknown-level
  it("names the action and the allowed levels for an unknown level", () => {
    const { problems } = resolveLevels({ push: "sometimes" });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.action).toBe("push");
    expect(problems[0]?.message).toContain("allow, ask, deny");
  });

  it("rejects a permissions value that is not a mapping", () => {
    expect(resolveLevels(["push"]).problems[0]?.action).toBe("permissions");
  });

  // spec: specfold-permissions#looser-force-push
  it("rejects a sub-action looser than push", () => {
    const { problems } = resolveLevels({ push: "ask", "force-push": "allow" });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.action).toBe("force-push");
    expect(problems[0]?.message).toContain("'push: ask'");
    const plan = planPermissions({ push: "ask", "force-push": "allow" }, claude, "{}\n");
    expect(plan.text).toBeUndefined();
  });

  // spec: specfold-permissions#stricter-force-push
  it("accepts a sub-action stricter than push", () => {
    const { levels, problems } = resolveLevels({ push: "allow", "force-push": "deny" });
    expect(problems).toEqual([]);
    const desired = desiredRules(levels);
    expect(desired.allow).toEqual(expect.arrayContaining(rules("push")));
    expect(desired.deny).toEqual(rules("force-push"));
  });
});

describe("permissions: apply", () => {
  const settingsFor = (setting: unknown) => desiredRules(resolveLevels(setting).levels);

  // spec: specfold-permissions#level-changed
  it("moves the rules of a changed level", () => {
    const first = applyRules({}, settingsFor({}));
    if ("conflict" in first) throw new Error(first.conflict);
    const second = applyRules(first.settings, settingsFor({ "open-pr": "allow" }));
    if ("conflict" in second) throw new Error(second.conflict);
    const permissions = second.settings.permissions as Record<string, string[]>;
    expect(permissions.allow).toEqual(rules("open-pr"));
    expect(permissions.ask).not.toContain(rules("open-pr")[0]);
    expect(permissions.deny).toBeUndefined();
    expect(second.changes).toEqual([{ pattern: "Bash(gh pr create *)", from: "ask", to: "allow" }]);
  });

  // spec: specfold-permissions#merge-through-the-api
  it("covers gh pr merge and the merge endpoint", () => {
    const result = applyRules({}, settingsFor({ "merge-pr": "ask" }));
    if ("conflict" in result) throw new Error(result.conflict);
    const ask = (result.settings.permissions as Record<string, string[]>).ask;
    expect(ask).toContain("Bash(gh pr merge *)");
    expect(ask).toContain("Bash(gh api *pulls/*/merge*)");
  });

  // spec: specfold-permissions#team-rule-kept
  it("keeps foreign rules first and other keys unchanged, and settles on a second run", () => {
    const hooks = { Stop: [{ hooks: [{ type: "command", command: "x" }] }] };
    const settings = { permissions: { ask: ["Bash(rm -rf:*)"], deny: ["Read(**/*.map)"] }, hooks };
    const result = applyRules(settings, settingsFor({}));
    if ("conflict" in result) throw new Error(result.conflict);
    const permissions = result.settings.permissions as Record<string, string[]>;
    expect(permissions.ask?.[0]).toBe("Bash(rm -rf:*)");
    expect(permissions.deny).toEqual(["Read(**/*.map)"]);
    expect(result.settings.hooks).toBe(hooks);
    expect(Object.keys(permissions)).toEqual(["ask", "deny"]);
    const again = applyRules(result.settings, settingsFor({}));
    expect("changes" in again && again.changes).toEqual([]);
  });

  it("keeps an owned pattern's place in its own list", () => {
    const settings = { permissions: { ask: ["Bash(gh pr create *)", "Bash(rm *)"] } };
    const result = applyRules(settings, settingsFor({}));
    if ("conflict" in result) throw new Error(result.conflict);
    expect((result.settings.permissions as Record<string, string[]>).ask?.slice(0, 2)).toEqual([
      "Bash(gh pr create *)",
      "Bash(rm *)",
    ]);
  });

  it("refuses permissions that are not an object or lists that are not lists", () => {
    expect(applyRules({ permissions: [] }, settingsFor({}))).toEqual({ conflict: expect.any(String) });
    expect(applyRules({ permissions: { ask: "x" } }, settingsFor({}))).toEqual({
      conflict: expect.stringContaining("permissions.ask"),
    });
  });

  it("renders the same lists whatever the key order in specfold.yaml", () => {
    const a = settingsFor({ "close-pr": "allow", push: "allow" });
    const b = settingsFor({ push: "allow", "close-pr": "allow" });
    expect(a).toEqual(b);
    expect(a.allow[0]).toBe("Bash(git push *)");
  });

  it("plans nothing to write when no tool needs rendered rules", () => {
    expect(planPermissions({}, [".opencode/skills"], undefined)).toEqual({
      target: null,
      problems: [],
      changes: [],
    });
  });
});
