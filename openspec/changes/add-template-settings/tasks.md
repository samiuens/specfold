# Tasks

## 1. Template settings

```yaml
files: [template/specfold.yaml, template/README.md, specfold.yaml]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add `template/specfold.yaml` with the shipped defaults
  - Done when: `node ../scripts/specfold.mjs doctor` run in `template/` reports the config as loaded
- [x] 1.2 Narrow the kit's `source_globs` so template knowledge is not scanned as kit code
  - Done when: `node scripts/specfold.mjs index --check` exits 0 with no I2 warning

## 2. Code-comment convention

```yaml
files: [template/knowledge/**]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Add `template/knowledge/conventions/code-comments.md` and generate the template's indexes
  - Done when: `validate` and `index --check` exit 0 in `template/`

## 3. Sample app

```yaml
files: [examples/**]
depends: [2]
scenarios: []
agent: implementer
```

- [x] 3.1 Set up `examples/sample-app` from `template/` with a tiny to-do library and its tests
  - Done when: `node --test` and `specfold validate` pass in `examples/sample-app`
- [x] 3.2 Plan the change `add-due-dates`: brief, proposal, spec, design, knowledge and tasks
  - Done when: `specfold change check add-due-dates` reports only the open confirmation in the sample
- [ ] 3.3 Apply `add-due-dates` task by task, then archive and sync it
  - Done when: `specfold validate`, `openspec validate --all --strict` and `node --test` pass and `specfold sync add-due-dates --dry-run` reports nothing to change

## 4. CI

```yaml
files: [.github/workflows/cli.yml]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Add the sample-app checks and the copy check to CI
  - Done when: the `cli` workflow passes on the PR

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-template-settings` and commit its result in the same PR.
