# Tasks

## 1. Templates

```yaml
files: [tools/specfold/src/new/templates.ts, tools/specfold/test/new-templates.test.ts]
depends: []
scenarios: [specfold-new#built-in-body, specfold-new#override-wins]
agent: implementer
```

- [ ] 1.1 Add built-in bodies per type, the override lookup and placeholder replacement
  - Done when: scenarios built-in-body and override-wins pass in `new-templates.test.ts`

## 2. New command

```yaml
files: [tools/specfold/src/new/command.ts, tools/specfold/src/commands.ts, tools/specfold/src/repo.ts, tools/specfold/test/new.test.ts, tools/specfold/test/repo.test.ts]
depends: [1]
scenarios: [specfold-new#unknown-type, specfold-new#path-not-kebab-case, specfold-new#new-concept-in-a-new-folder, specfold-new#existing-file, specfold-new#derived-title, specfold-new#model-from-the-environment, specfold-new#human-actor-refused, specfold-new#runbook-review-date, specfold-new#created-path-in-json]
agent: implementer
```

- [ ] 2.1 Add the `new` command: argument checks, frontmatter, actor, type-specific keys, file creation and JSON output
  - Done when: all nine scenarios of this group pass in `new.test.ts`

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Create the capability card with `specfold new`, fill it, update the CLI architecture concept and add the log entry
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Rebuild `scripts/specfold.mjs` before group 3, archive the change in this PR, then point the capability card at the archived spec.
