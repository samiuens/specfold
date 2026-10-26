# Tasks

## 1. Glob matching

```yaml
files: [tools/specfold/src/glob.ts, tools/specfold/test/glob.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add the glob matcher and the repository file walk
  - Done when: `glob.test.ts` covers `**` matching zero segments, `*`, `?`, braces and the skipped folders

## 2. Index generation

```yaml
files: [tools/specfold/src/indexes/generate.ts, tools/specfold/src/indexes/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/index.test.ts, tools/specfold/test/fixtures/index/**]
depends: []
scenarios: [specfold-index#default-bundle, specfold-index#no-configuration, specfold-index#new-folder-gets-an-index, specfold-index#concepts-and-log-untouched, specfold-index#hand-edit-overwritten, specfold-index#root-index-frontmatter, specfold-index#configured-folder, specfold-index#unconfigured-folder, specfold-index#log-listed, specfold-index#grouping-and-order, specfold-index#missing-title-or-description, specfold-index#deprecated-entry, specfold-index#empty-runbooks-folder, specfold-index#two-runs-same-bytes]
agent: implementer
```

- [ ] 2.1 Add index generation for sections, log entry, type groups, deprecated and empty folders
  - Done when: the golden files in `test/fixtures/index/expected/` match, and scenarios root-index-frontmatter, configured-folder, unconfigured-folder, log-listed, grouping-and-order, missing-title-or-description, deprecated-entry and empty-runbooks-folder pass
- [ ] 2.2 Add the `index` command that writes changed indexes only
  - Done when: scenarios default-bundle, no-configuration, new-folder-gets-an-index, concepts-and-log-untouched, hand-edit-overwritten and two-runs-same-bytes pass

## 3. Code references

```yaml
files: [tools/specfold/src/indexes/refs.ts, tools/specfold/src/indexes/generate.ts, tools/specfold/test/index-refs.test.ts]
depends: [1, 2]
scenarios: [specfold-index#reference-listed, specfold-index#reference-to-a-missing-concept]
agent: implementer
```

- [ ] 3.1 Scan `source_globs` for `see knowledge:` references and list them under their concepts
  - Done when: scenarios reference-listed and reference-to-a-missing-concept pass

## 4. Check mode and output

```yaml
files: [tools/specfold/src/indexes/command.ts, tools/specfold/test/index-check.test.ts]
depends: [2]
scenarios: [specfold-index#broken-concept-skipped, specfold-index#outdated-index, specfold-index#up-to-date, specfold-index#json-in-check-mode]
agent: implementer
```

- [ ] 4.1 Add `--check`, `--json`, unparseable-concept findings and exit codes
  - Done when: scenarios broken-concept-skipped, outdated-index, up-to-date and json-in-check-mode pass

## 5. Dogfooding and CI

```yaml
files: [specfold.yaml, knowledge/**/index.md, scripts/specfold.mjs, .github/workflows/cli.yml, AGENTS.md]
depends: [3, 4]
scenarios: []
agent: implementer
```

- [ ] 5.1 Move folder titles and descriptions into `specfold.yaml`, then regenerate the kit's indexes with the bundle
  - Done when: `node scripts/specfold.mjs index --check` exits 0 in the kit repo
- [ ] 5.2 Run `index --check` in CI, and tell agents in `AGENTS.md` that indexes are generated
  - Done when: the `cli` workflow passes on this PR

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Add the capability card for `specfold-index`, then update the CLI architecture concept, indexes and log
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change with `openspec archive add-specfold-index` in this PR, then point the capability card at the archived spec.
