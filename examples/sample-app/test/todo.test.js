import assert from "node:assert/strict";
import { test } from "node:test";
import { createTodoList } from "../src/todo.js";

test("adds open items with increasing ids", () => {
  const todos = createTodoList();
  assert.deepEqual(todos.add(" Buy milk "), { id: 1, title: "Buy milk", done: false });
  assert.equal(todos.add("Call Ana").id, 2);
});

test("rejects an empty title", () => {
  assert.throws(() => createTodoList().add("  "), TypeError);
});

test("completes an item and filters by state", () => {
  const todos = createTodoList();
  todos.add("a");
  todos.add("b");
  todos.complete(1);
  assert.deepEqual(todos.list({ done: true }).map((i) => i.title), ["a"]);
  assert.deepEqual(todos.list({ done: false }).map((i) => i.title), ["b"]);
  assert.equal(todos.list().length, 2);
});

test("throws for an unknown id", () => {
  assert.throws(() => createTodoList().complete(7), RangeError);
});
