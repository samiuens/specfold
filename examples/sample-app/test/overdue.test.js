import assert from "node:assert/strict";
import { test } from "node:test";
import { createTodoList } from "../src/todo.js";

// spec: due-dates#overdue-items
test("returns open items due before today", () => {
  const todos = createTodoList();
  todos.add("yesterday", { due: "2026-10-25" });
  todos.add("today", { due: "2026-10-26" });
  todos.add("tomorrow", { due: "2026-10-27" });
  todos.add("no date");
  assert.deepEqual(todos.overdue("2026-10-26").map((i) => i.title), ["yesterday"]);
});

// spec: due-dates#done-items-are-not-overdue
test("leaves out done items", () => {
  const todos = createTodoList();
  const item = todos.add("old", { due: "2026-10-01" });
  todos.complete(item.id);
  assert.deepEqual(todos.overdue("2026-10-26"), []);
});

// spec: due-dates#missing-today
test("requires today as a calendar date", () => {
  const todos = createTodoList();
  assert.throws(() => todos.overdue(), TypeError);
  assert.throws(() => todos.overdue("26.10.2026"), TypeError);
});
