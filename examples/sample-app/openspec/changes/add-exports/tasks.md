# Tasks

## 1. CSV export

```yaml
files: [src/export-csv.js, test/export-csv.test.js]
depends: []
scenarios: [csv-export#header-and-rows, csv-export#empty-due, csv-export#comma-quoted, csv-export#quote-doubled, csv-export#newline-quoted]
agent: implementer
```

- [x] 1.1 Add `toCsv(items)` with quoting
  - Done when: the five csv-export scenarios pass in `test/export-csv.test.js` and `npm test` passes
- [ ] 1.2 Remove the unrelated `see knowledge:` comment from `src/export-csv.js`
  - Done when: `npm test` passes and `node scripts/specfold.mjs index` lists no reference from `src/export-csv.js`

## 2. JSON import

```yaml
files: [src/import-json.js, test/import-json.test.js]
depends: []
scenarios: [json-import#valid-entries, json-import#not-an-array, json-import#empty-title-names-its-index, json-import#non-string-title-names-its-index, json-import#non-boolean-done-names-its-index]
agent: implementer
```

- [x] 2.1 Parse and check titles and done flags in `fromJson(text)`
  - Done when: scenarios valid-entries, not-an-array, empty-title-names-its-index, non-string-title-names-its-index and the done-flag scenario non-boolean-done-names-its-index pass in `test/import-json.test.js`

## 3. Summary

```yaml
files: [src/summary.js, test/summary.test.js]
depends: []
scenarios: [summary#mixed-list, summary#empty-list]
agent: implementer
```

- [x] 3.1 Add `summarize(items)`
  - Done when: scenarios mixed-list and empty-list pass in `test/summary.test.js` and `npm test` passes

## 4. Calendar check export

```yaml
files: [src/todo.js]
depends: []
scenarios: []
agent: implementer
```

- [x] 4.1 Export `isCalendarDate` from `src/todo.js` with no behavior change
  - Done when: `npm test` passes

## 5. Import due dates

```yaml
files: [src/import-json.js, test/import-json.test.js]
depends: [2, 4]
scenarios: [json-import#invalid-due-date-names-its-index, json-import#non-json-text]
agent: implementer
```

- [x] 5.1 Check `due` in `fromJson(text)` when it is not null with the same function `add` uses (`isCalendarDate` from `src/todo.js`, imported, not copied), throwing `entry <i>: due must be a YYYY-MM-DD date`
  - Done when: scenario invalid-due-date-names-its-index passes in `test/import-json.test.js` and `npm test` passes
- [x] 5.2 Rethrow a JSON parse error as `TypeError` in `fromJson`
  - Done when: scenario non-json-text passes in `test/import-json.test.js` and `npm test` passes

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2, 3, 4, 5]
scenarios: []
agent: knowledge-curator
```

- [x] 6.1 Write the three capability cards listed in `knowledge.md`
  - Done when: `specfold validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-exports` and commit its result in the same PR; then run the retro from sf-sync.
