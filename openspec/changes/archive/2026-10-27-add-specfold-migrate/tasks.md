# Tasks

## 1. Fixture repositories

```yaml
files: [tools/specfold/test/fixtures/migrate/**]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add the fixture with ADRs and docs, and the fixture with Cursor rules and OpenSpec
  - Done when: both folders exist under `tools/specfold/test/fixtures/migrate/` with the files the brief of `add-sf-migrate-skill` lists

## 2. Repository, state and detection

```yaml
files: [tools/specfold/src/migrate/repo.ts, tools/specfold/src/migrate/state.ts, tools/specfold/src/migrate/detect.ts, tools/specfold/src/migrate/inventory.ts, tools/specfold/test/migrate-inventory.test.ts, tools/specfold/test/migrate-helpers.ts]
depends: [1]
scenarios: [specfold-migrate#adrs-and-cursor-rules, specfold-migrate#ignored-files]
agent: implementer
```

- [x] 2.1 Find the git root, branches and a clean tree, and keep the migration state
  - Done when: `migrate-inventory.test.ts` covers the default branch order and the state file round trip
- [x] 2.2 Detect stack, layout, CI and source globs, and classify knowledge sources
  - Done when: scenarios adrs-and-cursor-rules and ignored-files pass in `migrate-inventory.test.ts`

## 3. Merge helpers

```yaml
files: [tools/specfold/src/migrate/blocks.ts, tools/specfold/src/migrate/merge.ts, tools/specfold/test/migrate-merge.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 3.1 Insert and replace managed blocks in Markdown and hash-comment files
  - Done when: `migrate-merge.test.ts` covers a new file, a file without markers, a rerun and a start marker without an end
- [x] 3.2 Merge Claude Code settings and an existing OpenSpec config
  - Done when: `migrate-merge.test.ts` covers added hooks, kept keys, invalid JSON and kept rules and comments

## 4. Install

```yaml
files: [tools/specfold/src/migrate/install.ts, tools/specfold/test/migrate-install.test.ts, template/.gitignore]
depends: [2, 3]
scenarios: [specfold-migrate#wrong-folder, specfold-migrate#differing-cli-copy, specfold-migrate#existing-agents-md, specfold-migrate#existing-permissions, specfold-migrate#active-change-on-another-schema, specfold-migrate#source-globs, specfold-migrate#agents-only, specfold-migrate#manifest-entry, specfold-migrate#rerun]
agent: implementer
```

- [x] 4.1 Install kit-owned files, managed blocks, settings and project files
  - Done when: scenarios wrong-folder, differing-cli-copy, existing-agents-md, existing-permissions, source-globs and agents-only pass in `migrate-install.test.ts`
- [x] 4.2 Set up OpenSpec, links, hooks and the manifest, idempotently
  - Done when: scenarios active-change-on-another-schema, manifest-entry and rerun pass in `migrate-install.test.ts`

## 5. Migrate command

```yaml
files: [tools/specfold/src/migrate/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/migrate.test.ts]
depends: [2, 4]
scenarios: [specfold-migrate#no-git-repository, specfold-migrate#started-on-the-default-branch, specfold-migrate#feature-branch, specfold-migrate#dirty-tree, specfold-migrate#install-on-the-default-branch, specfold-migrate#both-main-and-master, specfold-migrate#resumed-migration]
agent: implementer
```

- [x] 5.1 Add `migrate start`, `inventory`, `install`, `mark` and `status`
  - Done when: scenarios no-git-repository, started-on-the-default-branch, feature-branch, dirty-tree, install-on-the-default-branch, both-main-and-master and resumed-migration pass in `migrate.test.ts`

## 6. Adoption PR

```yaml
files: [tools/specfold/src/gate/diff.ts, tools/specfold/src/gate/rules.ts, tools/specfold/src/gate/command.ts, tools/specfold/src/gate/summary.ts, tools/specfold/test/gate-adoption.test.ts]
depends: []
scenarios: [specfold-gate#migration-pr, specfold-gate#later-pr]
agent: implementer
```

- [x] 6.1 Skip G4 when the base has no `specfold.yaml` and say so
  - Done when: scenarios migration-pr and later-pr pass in `gate-adoption.test.ts`

## 7. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [5, 6]
scenarios: []
agent: implementer
```

- [x] 7.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 8. Knowledge

```yaml
files: [knowledge/**]
depends: [7]
scenarios: []
agent: knowledge-curator
```

- [x] 8.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-migrate` and commit its result in the same PR.
