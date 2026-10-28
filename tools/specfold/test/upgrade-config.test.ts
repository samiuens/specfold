import { describe, expect, it } from "vitest";
import { type ConfigMerge, upgradeOpenspecConfig, upgradeSettings } from "../src/upgrade/config.ts";

const hook = (name: string) => ({
  hooks: [{ type: "command", command: `node scripts/specfold.mjs hook ${name}` }],
});
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
const textOf = (m: ConfigMerge) => {
  if ("conflict" in m) throw new Error(m.conflict);
  return m.text;
};

describe("upgrade settings", () => {
  const base = json({
    env: { DEPTH: "1", OLD: "x" },
    permissions: { deny: ["Read(a)", "Read(b)"] },
    hooks: { Stop: [hook("claude-stop")], SessionStart: [hook("claude-session-start")] },
  });
  const next = json({
    env: { DEPTH: "2", NEW: "y" },
    worktree: { baseRef: "head" },
    permissions: { deny: ["Read(a)", "Read(c)"] },
    hooks: { Stop: [hook("claude-stop-v2")] },
  });

  it("adds and drops deny rules, replaces Specfold's hooks and keeps the team's", () => {
    const local = json({
      model: "opus",
      env: { DEPTH: "1", OLD: "x", TEAM: "1" },
      permissions: { deny: ["Read(b)", "Read(team)", "Read(a)"], allow: ["Bash(ls)"] },
      hooks: {
        Stop: [{ hooks: [{ type: "command", command: "say done" }] }, hook("claude-stop")],
        SessionStart: [hook("claude-session-start")],
      },
    });
    expect(JSON.parse(textOf(upgradeSettings(local, base, next)))).toEqual({
      model: "opus",
      env: { DEPTH: "2", TEAM: "1", NEW: "y" },
      permissions: { deny: ["Read(team)", "Read(a)", "Read(c)"], allow: ["Bash(ls)"] },
      hooks: { Stop: [{ hooks: [{ type: "command", command: "say done" }] }, hook("claude-stop-v2")] },
      worktree: { baseRef: "head" },
    });
  });

  it("keeps an env value the team changed and removes nothing without a base", () => {
    const local = json({ env: { DEPTH: "5", OLD: "x" }, permissions: { deny: ["Read(b)"] } });
    expect(JSON.parse(textOf(upgradeSettings(local, base, next))).env).toEqual({ DEPTH: "5", NEW: "y" });
    const noBase = JSON.parse(textOf(upgradeSettings(local, undefined, next)));
    expect(noBase.env).toEqual({ DEPTH: "5", OLD: "x", NEW: "y" });
    expect(noBase.permissions.deny).toEqual(["Read(b)", "Read(a)", "Read(c)"]);
  });

  it("changes nothing when the file is already up to date, and reports broken JSON", () => {
    expect(upgradeSettings(next, base, next)).toEqual({ text: next, changed: false, notes: [] });
    expect(upgradeSettings("{", base, next)).toEqual({ conflict: "is not valid JSON" });
  });
});

describe("upgrade openspec config", () => {
  const base = `schema: specfold
context: |
  Language: English.
  Stack: <filled by specfold init or sf-migrate>
rules:
  proposal:
    - Link knowledge.
  specs:
    - Observable behavior only.
  old:
    - Gone soon.
`;
  const next = `schema: specfold
context: |
  Language: English.
  Rather ask than assume.
  Stack: <filled by specfold init or sf-migrate>
rules:
  proposal:
    - Link knowledge and decisions.
  specs:
    - Observable behavior only.
  tasks:
    - Last group is Knowledge.
operations:
  apply:
    guidance:
      - Ask when unclear.
`;

  it("updates unchanged rules and the context, keeping the Stack line and the team's rules", () => {
    const local = `# our config
schema: specfold
context: |
  Language: English.
  Stack: TypeScript
rules:
  proposal:
    - Link knowledge.
  specs:
    - Observable behavior only, please.
  old:
    - Gone soon.
  team:
    - Our rule.
`;
    const result = upgradeOpenspecConfig(local, base, next);
    expect(textOf(result)).toBe(`# our config
schema: specfold
context: |
  Language: English.
  Rather ask than assume.
  Stack: TypeScript
rules:
  proposal:
    - Link knowledge and decisions.
  specs:
    - Observable behavior only, please.
  team:
    - Our rule.
  tasks:
    - Last group is Knowledge.
operations:
  apply:
    guidance:
      - Ask when unclear.
`);
  });

  // spec: specfold-upgrade#long-rule-kept-on-one-line
  it("keeps a long rule on one line when it adds a rules key", () => {
    const rule = `Name the endpoint, its owner and the error budget in every proposal ${"y".repeat(42)}`;
    expect(rule.length).toBe(110);
    const local = base.replace("    - Observable behavior only.", `    - ${rule}`);
    expect(textOf(upgradeOpenspecConfig(local, base, next))).toContain(`    - ${rule}\n`);
  });

  it("keeps a context the team edited and says so", () => {
    const local = base.replace("Language: English.", "Language: English. Use US spelling.");
    const result = upgradeOpenspecConfig(local, base, next);
    expect(textOf(result)).toContain("Use US spelling.");
    expect("notes" in result && result.notes).toEqual([
      "context was changed here; the new release's context was not applied",
    ]);
  });
});
