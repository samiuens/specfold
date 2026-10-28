# Tasks

## 1. Template context

```yaml
files: [template/openspec/config.yaml, examples/sample-app/openspec/config.yaml]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add the English line to the OpenSpec context of the template and the sample app
  - Done when: both contexts start with the kit's `Language: English.` line and `npx vitest run` passes

## 2. Plan

```yaml
files: [docs/plan.md]
depends: []
scenarios: []
agent: implementer
```

- [x] 2.1 Name the managed-block markers `specfold:start` / `specfold:end` in the plan
  - Done when: `git grep "specfold:begin"` finds nothing in `docs/plan.md`

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0 and `specfold drift` flags only the 24 concepts on the verification list

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync recheck-drifted-knowledge` and commit its result in the same PR.
- The PR body lists the 24 concepts that still hold, with a reason each, for the user to verify.
