# Tasks

## 1. Setting

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Read `gate.block_on_drift`
  - Done when: `repo.test.ts` covers the default and `true`

## 2. Dependent paths and baselines

```yaml
files: [tools/specfold/src/drift/deps.ts, tools/specfold/src/drift/drift.ts, tools/specfold/test/drift.test.ts]
depends: []
scenarios: [specfold-drift#code-reference, specfold-drift#url-source, specfold-drift#code-changed-after-verification, specfold-drift#concept-edited-after-the-code]
agent: implementer
```

- [ ] 2.1 Map concepts to their dependent repository paths
  - Done when: scenarios code-reference and url-source pass in `drift.test.ts`
- [ ] 2.2 Find commits newer than a concept's baseline
  - Done when: scenarios code-changed-after-verification and concept-edited-after-the-code pass in `drift.test.ts`

## 3. Drift command

```yaml
files: [tools/specfold/src/drift/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/drift-command.test.ts]
depends: [2]
scenarios: [specfold-drift#nothing-drifted, specfold-drift#json-report]
agent: implementer
```

- [ ] 3.1 Add `specfold drift` with human and JSON output
  - Done when: scenarios nothing-drifted and json-report pass in `drift-command.test.ts`

## 4. Lookup flag

```yaml
files: [tools/specfold/src/lookup/command.ts, tools/specfold/test/lookup.test.ts]
depends: [2]
scenarios: [specfold-lookup#code-changed-after-verification]
agent: implementer
```

- [ ] 4.1 Flag possibly stale lookup results with `drift`
  - Done when: scenario code-changed-after-verification passes in `lookup.test.ts`

## 5. Gate rule G16

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/test/gate-rules.test.ts]
depends: [1, 2]
scenarios: [specfold-gate#code-changed-concept-untouched, specfold-gate#concept-updated-in-the-same-pr, specfold-gate#blocking-configured]
agent: implementer
```

- [ ] 5.1 Add G16 to the gate
  - Done when: scenarios code-changed-concept-untouched, concept-updated-in-the-same-pr and blocking-configured pass in `gate-rules.test.ts`

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3, 4, 5]
scenarios: []
agent: implementer
```

- [ ] 6.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [6]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-drift` and commit its result in the same PR.
