import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsv } from "../src/export-csv.js";

const item = (over) => ({ id: 1, title: "t", done: false, due: null, ...over });

// spec: csv-export#header-and-rows
test("writes a header and one row per item", () => {
  const csv = toCsv([
    { id: 1, title: "Pay rent", done: false, due: "2026-11-01" },
    { id: 2, title: "Call mom", done: true, due: "2026-10-30" },
  ]);
  assert.equal(csv, "id,title,done,due\n1,Pay rent,false,2026-11-01\n2,Call mom,true,2026-10-30");
});

// spec: csv-export#empty-due
test("leaves the due field empty without a date", () => {
  const csv = toCsv([{ id: 3, title: "Read", done: false, due: null }]);
  assert.equal(csv.split("\n")[1], "3,Read,false,");
});

// spec: csv-export#comma-quoted
test("quotes a title with a comma", () => {
  assert.equal(toCsv([item({ title: "Milk, eggs" })]).split("\n")[1], '1,"Milk, eggs",false,');
});

// spec: csv-export#quote-doubled
test("doubles quotes inside a quoted title", () => {
  assert.equal(toCsv([item({ title: 'Read "Dune"' })]).split("\n")[1], '1,"Read ""Dune""",false,');
});

// spec: csv-export#newline-quoted
test("keeps a newline inside quotes", () => {
  const csv = toCsv([item({ title: "Line one\nline two" })]);
  assert.equal(csv, 'id,title,done,due\n1,"Line one\nline two",false,');
});
