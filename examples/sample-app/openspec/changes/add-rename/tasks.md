# Tasks

## 1. Rename

```yaml
files: [src/todo.js, test/rename.test.js]
depends: []
scenarios: [rename#title-changed, rename#done-item-renamed, rename#empty-title, rename#unknown-id]
agent: implementer
```

- [x] 1.1 Add `rename(id, title)` with the title rules of `add`
  - Done when: the four scenarios pass in `test/rename.test.js` and `npm test` passes

## 2. Knowledge

```yaml
files: [knowledge/**]
depends: [1]
scenarios: []
agent: knowledge-curator
```

- [ ] 2.1 Write the capability card listed in `knowledge.md`
  - Done when: `specfold validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-rename` and commit its result in the same PR; then run the retro from sf-sync.
