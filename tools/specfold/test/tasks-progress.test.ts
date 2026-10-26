import { describe, expect, it } from "vitest";
import { parseTasks } from "../src/tasks/parse.ts";
import { progressOf } from "../src/tasks/progress.ts";

const group = (n: number, depends: number[], ticked: boolean[]) =>
  `## ${n}. G${n}\n\n\`\`\`yaml\nfiles: [g${n}/**]\ndepends: [${depends.join(", ")}]\n\`\`\`\n\n${ticked
    .map((t, i) => `- [${t ? "x" : " "}] ${n}.${i + 1} Step ${i + 1}\n  - Done when: test ${n}.${i + 1}\n`)
    .join("")}\n`;

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
