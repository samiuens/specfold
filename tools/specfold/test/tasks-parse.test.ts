import { describe, expect, it } from "vitest";
import { parseTasks } from "../src/tasks/parse.ts";

const TASKS = `# Tasks

## 1. Setup

\`\`\`yaml
files: [src/setup/**]
\`\`\`

- [x] 1.1 Add the module
  - Done when: npm test -- setup passes

## 2. Guest token

\`\`\`yaml
files: [src/checkout/token/**]
depends: [1]
scenarios: []
\`\`\`

- [ ] 2.1 Add token issuer
  - Done when: npm test -- token passes
- [ ] 2.2 Add token expiry

## Workflow follow-up

- Run specfold sync add-guest-checkout after archive.
- [ ] 9.9 not a task here
`;

describe("parseTasks", () => {
  // spec: specfold-tasks#valid-group
  it("reads a group with its metadata and default agent", () => {
    const group = parseTasks(TASKS).groups[1];
    expect(group).toMatchObject({
      number: 2,
      name: "Guest token",
      line: 12,
      metaLine: 14,
      meta: { files: ["src/checkout/token/**"], depends: [1], scenarios: [], agent: "implementer" },
    });
    expect(group?.metaError).toBeUndefined();
  });

  // spec: specfold-tasks#valid-task
  it("reads tasks with their done criterion", () => {
    const [first, second] = parseTasks(TASKS).groups[1]?.tasks ?? [];
    expect(first).toEqual({
      id: "2.1",
      group: 2,
      index: 1,
      done: false,
      text: "Add token issuer",
      line: 20,
      doneWhen: "npm test -- token passes",
    });
    expect(second?.doneWhen).toBeUndefined();
    expect(parseTasks(TASKS).groups[0]?.tasks[0]?.done).toBe(true);
  });

  // spec: specfold-tasks#follow-up-section-ignored
  it("ignores the workflow follow-up section", () => {
    const file = parseTasks(TASKS);
    expect(file.followUpLine).toBe(24);
    expect(file.strayHeadings).toEqual([]);
    expect(file.groups.flatMap((g) => g.tasks.map((t) => t.id))).toEqual(["1.1", "2.1", "2.2"]);
  });

  it("records stray headings, orphan tasks and metadata problems", () => {
    const file = parseTasks(
      "- [ ] 1.1 early\n\n## 1. A\n\n- [ ] 1.1 x\n\n## Notes\n\n## 2. B\n\n```yaml\ndepends: [1]\n```\n",
    );
    expect(file.orphanTasks.map((t) => t.line)).toEqual([1]);
    expect(file.strayHeadings).toEqual([{ text: "Notes", line: 7 }]);
    expect(file.groups[0]?.metaError).toBe("no metadata block after the heading");
    expect(file.groups[1]).toMatchObject({ metaLine: 11, metaError: "metadata has no 'files'" });
  });

  it("reports invalid YAML and wrong key types", () => {
    const meta = (yaml: string) =>
      parseTasks(`## 1. A\n\n\`\`\`yaml\n${yaml}\n\`\`\`\n`).groups[0]?.metaError;
    expect(meta("files: [")).toMatch(/^metadata is not valid YAML/);
    expect(meta("files: []")).toBe("'files' must not be empty");
    expect(meta("files: [a]\ndepends: [x]")).toBe("'depends' must be a list of group numbers");
    expect(meta("files: [a]\nagent: 3")).toBe("'agent' must be a role name");
  });
});
