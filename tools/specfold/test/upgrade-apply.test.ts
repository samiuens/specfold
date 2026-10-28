import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { applyPlan, setKitVersion } from "../src/upgrade/apply.ts";
import { runMigrations } from "../src/upgrade/migrations.ts";
import { planUpgrade } from "../src/upgrade/plan.ts";
import { reportText } from "../src/upgrade/report.ts";
import { write } from "./gate-helpers.ts";
import { installed, release } from "./upgrade-helpers.ts";

const status = (root: string) =>
  execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });

describe("apply an upgrade plan", () => {
  // spec: specfold-upgrade#knowledge-unchanged
  it("changes kit files, blocks, kit_version and the manifest, and nothing below knowledge/", () => {
    const base = release("0.1.0-rc.1");
    const next = release("0.1.0-rc.2", {
      ".agents/skills/sf-lookup/SKILL.md": "# sf-lookup\n\nLook first.\n",
      "AGENTS.md": "# Agent instructions\n\nRead knowledge, then specs.\n",
      "knowledge/index.md": "# Knowledge from the new release\n",
      "knowledge/decisions/keep-it.md": "replaced?\n",
    });
    const root = installed(base, "0.1.0-rc.1");
    const plan = planUpgrade({ root, from: next, base, installed: "0.1.0-rc.1", target: "0.1.0-rc.2" });
    applyPlan(root, plan, "v0.1.0-rc.2");
    const changed = status(root)
      .split("\n")
      .filter(Boolean)
      .map((l) => l.slice(3))
      .sort();
    expect(changed).toEqual([
      ".agents/skills/sf-lookup/SKILL.md",
      ".specfold/manifest.json",
      "AGENTS.md",
      "scripts/specfold.mjs",
      "specfold.yaml",
    ]);
    expect(readFileSync(join(root, "specfold.yaml"), "utf8")).toContain(
      "kit_version: 0.1.0-rc.2          # set by",
    );
    expect(JSON.parse(readFileSync(join(root, ".specfold/manifest.json"), "utf8"))).toMatchObject({
      kit_version: "0.1.0-rc.2",
      ref: "v0.1.0-rc.2",
    });
    expect(statSync(join(root, "scripts/specfold.mjs")).mode & 0o777).toBe(0o755);
    expect(existsSync(join(root, "knowledge/index.md"))).toBe(false);
  });

  it("edits only the kit_version value", () => {
    expect(setKitVersion('kit_version: "0.1.0-rc.1" # pinned\nchannel: next\n', "0.1.0-rc.2")).toBe(
      'kit_version: "0.1.0-rc.2" # pinned\nchannel: next\n',
    );
  });

  // spec: specfold-upgrade#two-migrations-in-order
  it("runs the migrations above the installed version up to the target, in order", async () => {
    const migration = `import { appendFileSync } from "node:fs";\nimport { join } from "node:path";\nexport default ({ root, version, report }) => { appendFileSync(join(root, "ran.txt"), version + "\\n"); report("ran " + version); };\n`;
    const next = release("0.1.0", {
      "upgrade/migrations/0.1.0-rc.1.mjs": migration,
      "upgrade/migrations/0.1.0.mjs": migration,
      "upgrade/migrations/0.1.0-rc.2.mjs": migration,
    });
    const root = installed(release("0.1.0-rc.1"), "0.1.0-rc.1");
    const plan = planUpgrade({ root, from: next, installed: "0.1.0-rc.1", target: "0.1.0" });
    expect(plan.migrations).toEqual(["0.1.0-rc.2", "0.1.0"]);
    const lines: { version: string; line: string }[] = [];
    await runMigrations(root, next, plan.migrations, (version, line) => lines.push({ version, line }));
    expect(readFileSync(join(root, "ran.txt"), "utf8")).toBe("0.1.0-rc.2\n0.1.0\n");
    expect(reportText(plan, { migrations: lines })).toContain(
      "- 0.1.0-rc.2\n  - ran 0.1.0-rc.2\n- 0.1.0\n  - ran 0.1.0",
    );
  });

  it("stops on a migration that throws", async () => {
    const dir = release("0.1.0-rc.2");
    write(dir, "upgrade/migrations/0.1.0-rc.2.mjs", 'export default () => { throw new Error("boom"); };\n');
    await expect(runMigrations(dir, dir, ["0.1.0-rc.2"], () => {})).rejects.toThrow(EnvError);
  });

  it("reports conflicts first, then changes, kept files, follow-ups and notes", () => {
    const base = release("0.1.0-rc.1");
    const next = release("0.1.0-rc.2", {
      ".claude/agents/verifier.md": "# Verifier\n\nRun all tests.\n\nRun the gate.\n\nReport findings.\n",
      "upgrade/notes/0.1.0-rc.2.md": "Run the rc.2 CLI once.\n",
    });
    const root = installed(base, "0.1.0-rc.1");
    write(
      root,
      ".claude/agents/verifier.md",
      "# Verifier\n\nRun the unit tests.\n\nRun the gate.\n\nReport findings.\n",
    );
    const plan = planUpgrade({ root, from: next, base, installed: "0.1.0-rc.1", target: "0.1.0-rc.2" });
    const text = reportText(plan, {
      followUps: [{ command: "specfold validate", code: 0, output: "0 errors" }],
    });
    expect(text).toMatch(
      /^# Specfold upgrade: 0\.1\.0-rc\.1 to 0\.1\.0-rc\.2\n\n## Conflicts \(1\)\n\n- `\.claude\/agents\/verifier\.md`: changed here/,
    );
    expect(text).toContain("| `scripts/specfold.mjs` | replace |");
    expect(text).toContain("| `specfold validate` | 0 | 0 errors |");
    expect(text).toContain("## Upgrade notes\n\n### 0.1.0-rc.2\n\nRun the rc.2 CLI once.\n");
  });
});
