# Tasks

## 1. Plan the sample change

```yaml
files: [examples/sample-app/openspec/changes/add-exports/**]
depends: []
scenarios: []
agent: spec-writer
```

- [x] 1.1 Plan `add-exports` in the sample app with three module groups
  - Done when: the sample app's `change check add-exports` and `openspec validate add-exports --strict` pass, and the brief is confirmed

## 2. Parallel run

```yaml
files: [examples/sample-app/src/**, examples/sample-app/test/**]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Run the three module groups as parallel implementers and merge their branches
  - Done when: the three branches are merged into this branch and the sample app's `npm test` passes
- [x] 2.2 Resolve the split proposal through `spec-writer` and the user, then finish the group
  - Done when: the sample app's `tasks check add-exports` passes and every module group is ticked

## 3. Verify, archive and sync the sample change

```yaml
files: [examples/sample-app/openspec/**, examples/sample-app/knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [x] 3.1 Verify, archive and sync `add-exports` in the sample app
  - Done when: the verifier returns PASS, and the sample app's validate, `index --check`, `openspec validate --all --strict` and `sync --dry-run` pass

## 4. Record

```yaml
files: [examples/runs/pattern-2/**, examples/README.md]
depends: [3]
scenarios: []
agent: implementer
```

- [x] 4.1 Write the run record and link it
  - Done when: `examples/runs/pattern-2/README.md` holds the timeline, final messages, merges, the split and the verdict

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [x] 5.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-pattern-2-run` and commit its result in the same PR.
