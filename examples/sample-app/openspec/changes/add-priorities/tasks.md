# Tasks

## 1. Priority on add

```yaml
files: [src/todo.js, test/todo.test.js, test/priorities.test.js]
depends: []
scenarios: [priorities#item-with-priority, priorities#default-priority, priorities#unknown-priority-on-add]
agent: implementer
```

- [ ] 1.1 Accept and validate an optional priority in `add`, defaulting to `"normal"`, and update the existing exact-match item test
  - Done when: scenarios item-with-priority, default-priority and unknown-priority-on-add pass in `test/priorities.test.js` and `npm test` passes

## 2. Change priority

```yaml
files: [src/todo.js, test/set-priority.test.js]
depends: [1]
scenarios: [priorities#priority-changed, priorities#done-item-priority-changed, priorities#unknown-id, priorities#unknown-priority-on-change]
agent: implementer
```

- [ ] 2.1 Add `setPriority(id, priority)`
  - Done when: the four scenarios of this group pass in `test/set-priority.test.js`

## 3. Priority filter

```yaml
files: [src/todo.js, test/priority-filter.test.js]
depends: [2]
scenarios: [priorities#filter-by-priority, priorities#combined-with-done-filter, priorities#unknown-priority-filter]
agent: implementer
```

- [ ] 3.1 Add the `priority` filter to `list`
  - Done when: the three scenarios of this group pass in `test/priority-filter.test.js`

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the capability card and the decision listed in `knowledge.md`
  - Done when: `specfold validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-priorities` and commit its result in the same PR.
