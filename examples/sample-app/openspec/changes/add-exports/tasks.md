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

## 2. JSON import

```yaml
files: [src/import-json.js, test/import-json.test.js]
depends: []
scenarios: [json-import#valid-entries, json-import#not-an-array, json-import#empty-title-names-its-index, json-import#non-string-title-names-its-index, json-import#invalid-due-date-names-its-index, json-import#non-boolean-done-names-its-index]
agent: implementer
```

- [ ] 2.1 Parse and check titles and done flags in `fromJson(text)`
  - Done when: scenarios valid-entries, not-an-array, empty-title-names-its-index, non-string-title-names-its-index and the done-flag scenario non-boolean-done-names-its-index pass in `test/import-json.test.js`
- [ ] 2.2 Check due dates with the same function `add` uses (`isCalendarDate` in `src/todo.js`, imported, not copied)
  - Done when: scenario invalid-due-date-names-its-index passes in `test/import-json.test.js` and `npm test` passes

## 3. Summary

```yaml
files: [src/summary.js, test/summary.test.js]
depends: []
scenarios: [summary#mixed-list, summary#empty-list]
agent: implementer
```

- [x] 3.1 Add `summarize(items)`
  - Done when: scenarios mixed-list and empty-list pass in `test/summary.test.js` and `npm test` passes

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2, 3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the three capability cards listed in `knowledge.md`
  - Done when: `specfold validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-exports` and commit its result in the same PR; then run the retro from sf-sync.
