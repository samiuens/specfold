# Tasks

## 1. Reuse

```yaml
files: [tools/specfold/src/new/command.ts, tools/specfold/src/log/command.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Extract `renderConcept` from the `new` command and export `localDate` from the `log` command
  - Done when: `npm test -w specfold` passes unchanged

## 2. Frontmatter edits

```yaml
files: [tools/specfold/src/sync/frontmatter.ts, tools/specfold/test/sync-frontmatter.test.ts]
depends: []
scenarios: [specfold-sync#unrelated-keys-kept]
agent: implementer
```

- [x] 2.1 Set keys and append sources while keeping other keys, order, comments and body
  - Done when: scenario unrelated-keys-kept passes in `sync-frontmatter.test.ts`

## 3. Plan and apply ops

```yaml
files: [tools/specfold/src/sync/apply.ts, tools/specfold/test/sync-apply.test.ts]
depends: [1, 2]
scenarios: [specfold-sync#missing-concept-gets-a-stub, specfold-sync#actor-without-model-variable, specfold-sync#concept-deprecated, specfold-sync#card-linked-to-the-archived-change, specfold-sync#modified-capability-keeps-its-history, specfold-sync#decision-linked-to-its-change]
agent: implementer
```

- [x] 3.1 Plan and apply create, deprecate, capability and decision actions
  - Done when: the six scenarios of this group pass in `sync-apply.test.ts`

## 4. Sync command

```yaml
files: [tools/specfold/src/sync/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/sync.test.ts, tools/specfold/test/fixtures/sync/**]
depends: [3]
scenarios: [specfold-sync#name-resolves-to-the-archived-change, specfold-sync#not-archived-yet, specfold-sync#broken-delta-writes-nothing, specfold-sync#log-entry-once, specfold-sync#second-run, specfold-sync#dry-run-writes-nothing]
agent: implementer
```

- [x] 4.1 Add `specfold sync <change> [--dry-run] [--json]` with resolving, checks, indexes and the log entry
  - Done when: the six scenarios of this group pass in `sync.test.ts`

## 5. Bundle

```yaml
files: [scripts/specfold.mjs]
depends: [4]
scenarios: []
agent: implementer
```

- [x] 5.1 Rebuild the bundled CLI
  - Done when: `npm run build -w specfold` leaves no diff

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [x] 6.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-sync` and commit its result in the same PR.
