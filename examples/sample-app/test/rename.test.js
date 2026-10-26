import assert from "node:assert/strict";
import { test } from "node:test";
import { createTodoList } from "../src/todo.js";

// spec: rename#title-changed
test("renames an item and keeps its due date", () => {
  const todos = createTodoList();
  const item = todos.add("Pay rnet", { due: "2026-11-01" });
  assert.deepEqual(todos.rename(item.id, " Pay rent "), { id: 1, title: "Pay rent", done: false, due: "2026-11-01" });
  assert.equal(todos.list()[0].title, "Pay rent");
});

// spec: rename#done-item-renamed
test("renames a done item and keeps it done", () => {
  const todos = createTodoList();
  todos.complete(todos.add("old").id);
  assert.equal(todos.rename(1, "new").done, true);
});

// spec: rename#empty-title
test("rejects an empty or non-string title and keeps the old one", () => {
  const todos = createTodoList();
  todos.add("Buy milk");
  for (const title of ["  ", "", 7]) assert.throws(() => todos.rename(1, title), TypeError, String(title));
  assert.equal(todos.list()[0].title, "Buy milk");
});

// spec: rename#unknown-id
test("throws for an unknown id and changes nothing", () => {
  const todos = createTodoList();
  todos.add("Buy milk");
  assert.throws(() => todos.rename(7, "x"), RangeError);
  assert.deepEqual(todos.list().map((i) => i.title), ["Buy milk"]);
});
