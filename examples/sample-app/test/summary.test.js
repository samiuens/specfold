import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize } from "../src/summary.js";

// spec: summary#mixed-list
test("counts a mixed list", () => {
  const items = [
    { id: 1, title: "a", done: false, due: "2026-11-01" },
    { id: 2, title: "b", done: false, due: null },
    { id: 3, title: "c", done: true, due: "2026-10-20" },
  ];
  assert.deepEqual(summarize(items), { total: 3, open: 2, done: 1, withDue: 2 });
});

// spec: summary#empty-list
test("counts an empty list", () => {
  assert.deepEqual(summarize([]), { total: 0, open: 0, done: 0, withDue: 0 });
});
