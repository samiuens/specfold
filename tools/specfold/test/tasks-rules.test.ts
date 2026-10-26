import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTasks } from "../src/tasks/parse.ts";
import { checkStatic, type RuleContext } from "../src/tasks/rules.ts";
import { knownScenarioIds, scenarioSlug } from "../src/tasks/scenarios.ts";
import { tempDir } from "./helpers.ts";

const write = (root: string, rel: string, content = "") => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

const group = (n: number, name: string, meta: string, tasks = 1) =>
  `## ${n}. ${name}\n\n\`\`\`yaml\n${meta}\n\`\`\`\n\n${Array.from(
    { length: tasks },
    (_, i) => `- [ ] ${n}.${i + 1} Do step ${i + 1}\n  - Done when: npm test passes\n`,
  ).join("")}\n`;

const VALID =
  group(
    1,
    "Token",
    "files: [src/token/**]\nscenarios: [checkout/guest-checkout#guest-pays-without-account]",
  ) +
  group(2, "Mail", "files: [src/mail/**]") +
  group(3, "Knowledge", "files: [knowledge/**]\ndepends: [1, 2]\nagent: implementer");

const ctx = (overrides: Partial<RuleContext> = {}): RuleContext => ({
  repoRoot: tempDir(),
  file: "openspec/changes/demo/tasks.md",
  knownScenarios: new Set(["checkout/guest-checkout#guest-pays-without-account"]),
  maxTasksPerGroup: 8,
  ...overrides,
});

const rules = (text: string, overrides: Partial<RuleContext> = {}) =>
  checkStatic(parseTasks(text), ctx(overrides));

describe("checkStatic", () => {
  it("accepts a valid breakdown", () => {
    expect(rules(VALID)).toEqual([]);
  });

  // spec: specfold-tasks#id-from-a-delta-spec
  it("knows scenario ids from delta specs and main specs", () => {
    const root = tempDir();
    const changeDir = join(root, "openspec", "changes", "demo");
    write(changeDir, "specs/checkout/guest-checkout/spec.md", "#### Scenario: Guest pays without account\n");
    write(root, "openspec/specs/mail/spec.md", "#### Scenario: Ticking tasks.md is not scope widening\n");
    expect(knownScenarioIds(root, changeDir)).toEqual(
      new Set([
        "checkout/guest-checkout#guest-pays-without-account",
        "mail#ticking-tasks-md-is-not-scope-widening",
      ]),
    );
    expect(scenarioSlug("  Guest: pays (again)! ")).toBe("guest-pays-again");
  });

  // spec: specfold-tasks#group-without-files
  it("T1: reports a group without files", () => {
    const text = VALID.replace("files: [src/mail/**]", "depends: [1]");
    expect(rules(text)).toEqual([
      expect.objectContaining({
        rule: "T1",
        severity: "error",
        group: 2,
        line: 13,
        message: "metadata has no 'files'",
      }),
    ]);
  });

  // spec: specfold-tasks#task-without-done-criterion
  it("T2: reports a task without done criterion", () => {
    const text = VALID.replace(
      "- [ ] 2.1 Do step 1\n  - Done when: npm test passes\n",
      "- [ ] 2.1 Do step 1\n",
    );
    expect(rules(text)).toEqual([expect.objectContaining({ rule: "T2", group: 2, task: "2.1" })]);
  });

  // spec: specfold-tasks#gap-in-task-numbers
  it("T3: reports a gap in task numbers", () => {
    const text = VALID.replace(
      group(2, "Mail", "files: [src/mail/**]"),
      group(2, "Mail", "files: [src/mail/**]", 3),
    ).replace("- [ ] 2.2 Do step 2\n  - Done when: npm test passes\n", "");
    expect(rules(text)).toEqual([
      expect.objectContaining({ rule: "T3", task: "2.3", message: "task 2.3 follows 2.1, expected 2.2" }),
    ]);
  });

  // spec: specfold-tasks#task-in-the-wrong-group
  it("T3: reports a task numbered for another group", () => {
    const text = VALID.replace("- [ ] 2.1 Do step 1", "- [ ] 3.1 Do step 1");
    expect(rules(text)).toEqual([expect.objectContaining({ rule: "T3", group: 2, task: "3.1" })]);
  });

  it("T3: reports group numbering errors and tasks outside groups", () => {
    const text = `- [ ] 1.1 early\n  - Done when: x\n\n${VALID.replace("## 2. Mail", "## 4. Mail")}`;
    expect(rules(text).map((f) => [f.rule, f.message])).toEqual(
      expect.arrayContaining([
        ["T3", "group numbered 4, expected 2"],
        ["T3", "task 1.1 is outside any group"],
      ]),
    );
  });

  // spec: specfold-tasks#stray-heading
  it("T3: reports a stray level-2 heading", () => {
    const text = VALID.replace("## 2. Mail", "## Notes\n\nSome text.\n\n## 2. Mail");
    expect(rules(text)).toEqual([
      expect.objectContaining({ rule: "T3", message: "'## Notes' is not a task group heading" }),
    ]);
  });

  // spec: specfold-tasks#cycle
  it("T4: reports a dependency cycle with its groups", () => {
    const text = VALID.replace("files: [src/mail/**]", "files: [src/mail/**]\ndepends: [3]");
    expect(rules(text)).toEqual([
      expect.objectContaining({
        rule: "T4",
        group: 2,
        message: "groups 2, 3 depend on each other in a cycle",
      }),
    ]);
  });

  // spec: specfold-tasks#unknown-group
  it("T4: reports a dependency on a missing group and on itself", () => {
    const text = VALID.replace("files: [src/mail/**]", "files: [src/mail/**]\ndepends: [7, 2]");
    expect(rules(text).map((f) => f.message)).toEqual([
      "group 2 depends on missing group 7",
      "group 2 depends on itself",
    ]);
  });

  // spec: specfold-tasks#nested-directories
  it("T5: reports nested directories in independent groups", () => {
    const text = VALID.replace("files: [src/mail/**]", "files: [src/token/sub/**]");
    expect(rules(text)).toEqual([
      expect.objectContaining({
        rule: "T5",
        group: 2,
        message: "groups 1 and 2 may run in parallel but both own src/token/** and src/token/sub/**",
      }),
    ]);
  });

  it("T5: finds overlaps through wildcard-free entries and existing files", () => {
    const repoRoot = tempDir();
    write(repoRoot, "src/shared/util.ts");
    const byEntry = VALID.replace("files: [src/mail/**]", "files: [src/token/index.ts]");
    expect(rules(byEntry).map((f) => f.rule)).toEqual(["T5"]);
    const byFile = VALID.replace("files: [src/token/**]", "files: ['src/*/util.ts']").replace(
      "files: [src/mail/**]",
      "files: ['src/shared/*.ts']",
    );
    expect(rules(byFile, { repoRoot }).map((f) => f.message)).toEqual([
      "groups 1 and 2 may run in parallel but both own src/shared/util.ts",
    ]);
  });

  // spec: specfold-tasks#ordered-groups-may-share-files
  it("T5: lets ordered groups share files", () => {
    const text = VALID.replace("files: [src/mail/**]", "files: [src/token/**]\ndepends: [1]");
    expect(rules(text)).toEqual([]);
  });

  // spec: specfold-tasks#renamed-scenario
  it("T6: reports an unknown scenario id", () => {
    const text = VALID.replace("#guest-pays-without-account", "#old-title");
    expect(rules(text)).toEqual([
      expect.objectContaining({
        rule: "T6",
        severity: "error",
        message: "unknown scenario 'checkout/guest-checkout#old-title'",
      }),
    ]);
  });

  // spec: specfold-tasks#unknown-role
  it("T7: warns about an unknown agent role", () => {
    const text = VALID.replace("agent: implementer", "agent: designer");
    expect(rules(text)).toEqual([expect.objectContaining({ rule: "T7", severity: "warning", group: 3 })]);
    const repoRoot = tempDir();
    write(repoRoot, ".claude/agents/designer.md");
    expect(rules(text, { repoRoot })).toEqual([]);
  });

  // spec: specfold-tasks#knowledge-group-missing
  it("T8: warns when the last group is not Knowledge", () => {
    const text = VALID.replace("## 3. Knowledge", "## 3. Tests");
    expect(rules(text)).toEqual([expect.objectContaining({ rule: "T8", severity: "warning", group: 3 })]);
  });

  // spec: specfold-tasks#too-many-tasks
  it("T9: warns about a group with more tasks than the limit", () => {
    const text = VALID.replace(
      group(2, "Mail", "files: [src/mail/**]"),
      group(2, "Mail", "files: [src/mail/**]", 9),
    );
    expect(rules(text)).toEqual([
      expect.objectContaining({
        rule: "T9",
        severity: "warning",
        fix: "split the group into smaller groups",
      }),
    ]);
    expect(rules(text, { maxTasksPerGroup: 9 })).toEqual([]);
  });
});
