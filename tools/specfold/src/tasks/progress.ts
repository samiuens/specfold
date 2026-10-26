import type { Group, Task, TasksFile } from "./parse.ts";

export type GroupState = "done" | "in progress" | "ready" | "blocked";

export interface GroupProgress {
  group: Group;
  done: number;
  total: number;
  state: GroupState;
  /** Dependencies that are not done yet; only set for blocked groups. */
  blockedBy: number[];
}

export interface Progress {
  groups: GroupProgress[];
  done: number;
  total: number;
  /** The next open task with its group, or undefined when none is workable. */
  next?: { task: Task; group: Group };
}

/** Group states from the checkboxes, and the next open task. */
export function progressOf(tasks: TasksFile): Progress {
  const finished = new Set(tasks.groups.filter((g) => g.tasks.every((t) => t.done)).map((g) => g.number));
  const groups = tasks.groups.map((group): GroupProgress => {
    const done = group.tasks.filter((t) => t.done).length;
    const total = group.tasks.length;
    const blockedBy = (group.meta?.depends ?? []).filter((d) => !finished.has(d));
    const state: GroupState =
      done === total ? "done" : done > 0 ? "in progress" : blockedBy.length > 0 ? "blocked" : "ready";
    return { group, done, total, state, blockedBy: state === "blocked" ? blockedBy : [] };
  });
  const workable = groups.find((g) => g.state === "in progress" || g.state === "ready");
  const task = workable?.group.tasks.find((t) => !t.done);
  return {
    groups,
    done: groups.reduce((n, g) => n + g.done, 0),
    total: groups.reduce((n, g) => n + g.total, 0),
    ...(workable && task ? { next: { task, group: workable.group } } : {}),
  };
}
