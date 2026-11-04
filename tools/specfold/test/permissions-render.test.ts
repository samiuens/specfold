import { describe, expect, it } from "vitest";
import { ACTION_TABLE } from "../src/permissions/actions.ts";
import { desiredRules, resolveLevels } from "../src/permissions/render.ts";

const rules = (name: string) => ACTION_TABLE.find((a) => a.name === name)?.patterns ?? [];
const all = ACTION_TABLE.flatMap((a) => a.patterns);

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
