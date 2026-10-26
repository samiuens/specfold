# Tasks

## 1. Setting

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Read `trace.test_globs` with its defaults
  - Done when: `repo.test.ts` covers the defaults and a configured list

## 2. Scenarios and references

```yaml
files: [tools/specfold/src/trace/specs.ts, tools/specfold/src/trace/refs.ts, tools/specfold/src/trace/trace.ts, tools/specfold/test/trace.test.ts]
depends: [1]
scenarios: [specfold-trace#nested-capability, specfold-trace#removed-in-a-change, specfold-trace#reference-in-a-test-name, specfold-trace#reference-outside-test-files]
agent: implementer
```

- [x] 2.1 Parse main and delta specs into scenarios with ids
  - Done when: scenarios nested-capability and removed-in-a-change pass in `trace.test.ts`
- [x] 2.2 Scan test files for references and build the report
  - Done when: scenarios reference-in-a-test-name and reference-outside-test-files pass in `trace.test.ts`

## 3. Trace command

```yaml
files: [tools/specfold/src/trace/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/trace-command.test.ts]
depends: [2]
scenarios: [specfold-trace#fully-covered, specfold-trace#unknown-change, specfold-trace#json-report]
agent: implementer
```

- [ ] 3.1 Add `specfold trace` with human and JSON output
  - Done when: scenarios fully-covered, unknown-change and json-report pass in `trace-command.test.ts`

## 4. Gate rule G15

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/test/gate-rules.test.ts]
depends: [2]
scenarios: [specfold-gate#new-scenario-without-test, specfold-gate#change-being-planned, specfold-gate#renamed-scenario, specfold-gate#old-gaps]
agent: implementer
```

- [ ] 4.1 Add G15 to the gate
  - Done when: scenarios new-scenario-without-test, change-being-planned, renamed-scenario and old-gaps pass in `gate-rules.test.ts`

## 5. Settings files

```yaml
files: [specfold.yaml, template/specfold.yaml]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 5.1 Add `trace.test_globs` to the kit and template settings
  - Done when: `node scripts/specfold.mjs trace` in the kit reports no dangling reference

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3, 4]
scenarios: []
agent: implementer
```

- [ ] 6.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [5, 6]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-trace` and commit its result in the same PR.
