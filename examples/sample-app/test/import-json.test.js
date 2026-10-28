import assert from "node:assert/strict";
import { test } from "node:test";
import { fromJson } from "../src/import-json.js";

// spec: json-import#valid-entries
test("returns checked entries", () => {
  assert.deepEqual(fromJson('[{"title":" Pay rent ","due":"2026-11-01"},{"title":"Call mom","done":true}]'), [
    { title: "Pay rent", done: false, due: "2026-11-01" },
    { title: "Call mom", done: true, due: null },
  ]);
});

// spec: json-import#not-an-array
test("rejects text that is not an array", () => {
  assert.throws(() => fromJson('{"title":"Pay rent"}'), TypeError);
});

// spec: json-import#empty-title-names-its-index
test("names the index of an empty title", () => {
  assert.throws(() => fromJson('[{"title":"Pay rent"},{"title":"  "}]'), { name: "TypeError", message: /^entry 1:/ });
});

// spec: json-import#non-string-title-names-its-index
test("names the index of a non-string title", () => {
  assert.throws(() => fromJson('[{"title":42}]'), { name: "TypeError", message: /^entry 0:/ });
});

// spec: json-import#non-boolean-done-names-its-index
test("names the index of a non-boolean done flag", () => {
  assert.throws(() => fromJson('[{"title":"Pay rent","done":"yes"}]'), {
    name: "TypeError",
    message: "entry 0: done must be true or false",
  });
});
