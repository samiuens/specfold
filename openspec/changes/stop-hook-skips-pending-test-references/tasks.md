# Tasks

## 1. Stop hook

```yaml
files: [tools/specfold/src/hooks/claude.ts, tools/specfold/test/hooks-claude.test.ts, scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: []
scenarios: [specfold-hooks#scenario-without-a-test-in-an-active-change, specfold-hooks#scenario-without-a-test-in-an-archived-change]
agent: implementer
```

- [x] 1.1 `stop` splits G15 findings whose path lies in an active change (`openspec/changes/<name>/`, not `archive/`) off the blocking set and prints them with "not blocking: the change is still in progress"; tests for both new scenarios and the existing G13 one
  - Done when: `npx vitest run tools/specfold/test/hooks-claude.test.ts` passes with tests tagged `spec: specfold-hooks#scenario-without-a-test-in-an-active-change` and `#scenario-without-a-test-in-an-archived-change`
- [x] 1.2 Rebuild the bundle, copy it to `template/scripts/specfold.mjs` and regenerate `template/.specfold/manifest.json`
  - Done when: the repo's build script runs clean and the full test suite passes

## 2. Knowledge

```yaml
files: [knowledge/**]
depends: [1]
scenarios: []
agent: knowledge-curator
```

- [ ] 2.1 Write the concepts listed in knowledge.md
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync stop-hook-skips-pending-test-references` and commit the result in the same PR.
