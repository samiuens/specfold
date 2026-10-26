# Tasks

## 1. Due dates

```yaml
files: [src/todo.js, test/todo.test.js, test/due-dates.test.js]
depends: []
scenarios: [due-dates#item-with-due-date, due-dates#item-without-due-date, due-dates#impossible-date]
agent: implementer
```

- [x] 1.1 Accept and validate an optional due date in `add`
  - Done when: scenarios item-with-due-date, item-without-due-date and impossible-date pass in `test/due-dates.test.js`

## 2. Overdue query

```yaml
files: [src/todo.js, test/overdue.test.js]
depends: [1]
scenarios: [due-dates#overdue-items, due-dates#done-items-are-not-overdue, due-dates#missing-today]
agent: implementer
```

- [x] 2.1 Add `overdue(today)`
  - Done when: the three scenarios of this group pass in `test/overdue.test.js`

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Write the capability card and the decision listed in `knowledge.md`
  - Done when: `specfold validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-due-dates` and commit its result in the same PR.
