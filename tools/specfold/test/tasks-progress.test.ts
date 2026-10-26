import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTasks } from "../src/tasks/parse.ts";
import { progressOf } from "../src/tasks/progress.ts";
import { run, tempDir } from "./helpers.ts";

const group = (n: number, depends: number[], ticked: boolean[]) =>
  `## ${n}. G${n}\n\n\`\`\`yaml\nfiles: [g${n}/**]\ndepends: [${depends.join(", ")}]\n\`\`\`\n\n${ticked
    .map((t, i) => `- [${t ? "x" : " "}] ${n}.${i + 1} Step ${i + 1}\n  - Done when: test ${n}.${i + 1}\n`)
    .join("")}\n`;

const TASKS = "openspec/changes/demo/tasks.md";
const tick = (repo: string, ids: string[]) => {
  const path = join(repo, TASKS);
  let text = readFileSync(path, "utf8");
  for (const id of ids) text = text.replace(`- [ ] ${id} `, `- [x] ${id} `);
  writeFileSync(path, text);
};

describe("progress", () => {
  // spec: specfold-tasks#progress-per-group
  it("reports the state of each group and the next open task", () => {
    const p = progressOf(
      parseTasks(group(1, [], [true, true]) + group(2, [], [true, false, false]) + group(3, [2], [false])),
    );
    expect(p.groups.map((g) => [g.group.number, g.state, g.done, g.total, g.blockedBy])).toEqual([
      [1, "done", 2, 2, []],
      [2, "in progress", 1, 3, []],
      [3, "blocked", 0, 1, [2]],
    ]);
    expect(p.next?.task.id).toBe("2.2");
    expect([p.done, p.total]).toEqual([3, 6]);
  });

  // spec: specfold-tasks#ready-group-after-finished-group
  it("picks the first task of the lowest ready group", () => {
    const p = progressOf(parseTasks(group(1, [], [true]) + group(2, [1], [false]) + group(3, [1], [false])));
    expect(p.groups.map((g) => g.state)).toEqual(["done", "ready", "ready"]);
    expect(p.next?.task.id).toBe("2.1");
  });

  it("has no next task when everything is done or blocked", () => {
    expect(progressOf(parseTasks(group(1, [], [true]))).next).toBeUndefined();
    expect(progressOf(parseTasks(group(1, [2], [false]) + group(2, [1], [false]))).next).toBeUndefined();
  });
});

describe("status: command", () => {
  it("prints progress per group for one change", async () => {
    const result = await run(["status", "demo"], tempDir("tasks"));
    expect(result).toMatchObject({
      code: 0,
      stdout:
        "demo: 1/4 tasks\n  1. Checkout   done          1/1\n  2. Receipt    ready         0/2\n  3. Knowledge  blocked by 2  0/1\nnext: 2.1 Mail the receipt\n",
    });
  });

  it("prints one line per active change", async () => {
    const result = await run(["status"], tempDir("tasks"));
    expect(result.stdout).toBe("demo      1/4  next: 2.1 Mail the receipt\nno-tasks  no tasks.md\n");
  });

  it("prints JSON with per-task commits", async () => {
    const out = JSON.parse((await run(["status", "demo", "--json"], tempDir("tasks"))).stdout);
    expect(out).toMatchObject({
      change: "demo",
      done: 1,
      total: 4,
      next: { task: "2.1", text: "Mail the receipt" },
    });
    expect(out.groups[2]).toMatchObject({ group: 3, state: "blocked", blockedBy: [2] });
    expect(out.groups[0].tasks[0]).toEqual({
      task: "1.1",
      text: "Add guest payment",
      done: true,
      commit: null,
    });
    const all = JSON.parse((await run(["status", "--json"], tempDir("tasks"))).stdout);
    expect(all.changes.map((c: { change: string }) => c.change)).toEqual(["demo", "no-tasks"]);
  });
});

describe("resume: command", () => {
  // spec: specfold-tasks#resume-a-fresh-session
  it("prints the next task with its group context and trailer", async () => {
    const repo = tempDir("tasks");
    tick(repo, ["2.1"]);
    const result = await run(["resume", "demo"], repo);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      [
        "Next task: 2.2 Add the receipt template",
        "Done when: npm test -- receipt passes",
        "Group: 2. Receipt",
        "  files: src/mail/**",
        "  depends: none",
        "  scenarios: mail#receipt-sent",
        "  agent: implementer",
        "Remaining in group: none",
        "Trailer: Task: demo#2.2",
        "",
      ].join("\n"),
    );
    const out = JSON.parse((await run(["resume", "demo", "--json"], tempDir("tasks"))).stdout);
    expect(out).toMatchObject({
      allDone: false,
      next: { task: "2.1", doneWhen: "scenario mail#receipt-sent passes" },
      group: { group: 2, files: ["src/mail/**"], scenarios: ["mail#receipt-sent"], agent: "implementer" },
      remaining: [{ task: "2.2", text: "Add the receipt template" }],
      trailer: "Task: demo#2.1",
    });
  });

  // spec: specfold-tasks#all-done
  it("reports that all tasks are done and exits with 0", async () => {
    const repo = tempDir("tasks");
    tick(repo, ["2.1", "2.2", "3.1"]);
    expect(await run(["resume", "demo"], repo)).toMatchObject({
      code: 0,
      stdout: "All tasks of demo are done.\n",
    });
  });

  it("exits with 1 when every open group is blocked", async () => {
    const repo = tempDir("tasks");
    const path = join(repo, TASKS);
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace("files: [src/mail/**]", "files: [src/mail/**]\ndepends: [3]"),
    );
    const result = await run(["resume", "demo"], repo);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("group 2 is blocked by 3");
  });

  it("fails with an environment error for a change without tasks.md", async () => {
    expect((await run(["resume", "no-tasks"], tempDir("tasks"))).code).toBe(2);
    expect((await run(["status", "no-tasks"], tempDir("tasks"))).code).toBe(2);
  });
});
