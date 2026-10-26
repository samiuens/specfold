import assert from "node:assert/strict";
import { test } from "node:test";
import { createTodoList } from "../src/todo.js";

// spec: due-dates#item-with-due-date
test("keeps the due date given on add", () => {
  assert.equal(createTodoList().add("Pay rent", { due: "2026-11-01" }).due, "2026-11-01");
});

// spec: due-dates#item-without-due-date
test("uses null without a due date", () => {
  assert.equal(createTodoList().add("Buy milk").due, null);
});

// spec: due-dates#impossible-date
test("rejects an impossible date and adds nothing", () => {
  const todos = createTodoList();
  for (const due of ["2026-02-30", "2026-1-5", "tomorrow"]) {
    assert.throws(() => todos.add("Pay rent", { due }), TypeError, due);
  }
  assert.deepEqual(todos.list(), []);
});
