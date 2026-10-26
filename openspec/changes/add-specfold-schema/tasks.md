# Tasks

## 1. Schema

```yaml
files: [template/openspec/schemas/specfold/**, tools/specfold/test/schema.test.ts]
depends: []
scenarios: [specfold-schema#schema-validates, specfold-schema#brief-comes-first, specfold-schema#tasks-wait-for-knowledge, specfold-schema#apply-reads-the-task-list, specfold-schema#brief-rendered-for-a-new-change, specfold-schema#knowledge-rendered-for-a-change, specfold-schema#tasks-rendered-for-a-change]
agent: implementer
```

- [x] 1.1 Fork `spec-driven` into `template/openspec/schemas/specfold/` with OpenSpec 1.15.0
  - Done when: `openspec schema validate specfold` run in `template/` reports the schema as valid
- [ ] 1.2 Add the `brief` and `knowledge` artifacts, their templates, the dependency changes and the task-breakdown `tasks` template and instruction
  - Done when: the seven scenarios of this group pass in `schema.test.ts`

## 2. Shipped config

```yaml
files: [template/openspec/config.yaml, tools/specfold/test/schema-config.test.ts]
depends: [1]
scenarios: [specfold-schema#config-loads-cleanly]
agent: implementer
```

- [ ] 2.1 Add `template/openspec/config.yaml` with schema, context, rules and operations
  - Done when: scenario config-loads-cleanly passes in `schema-config.test.ts`

## 3. Kit copy

```yaml
files: [openspec/schemas/specfold/**, openspec/config.yaml, .github/workflows/cli.yml]
depends: [1, 2]
scenarios: [specfold-schema#drifted-copy]
agent: implementer
```

- [ ] 3.1 Copy the schema into `openspec/schemas/specfold/` and add the CI copy check
  - Done when: `diff -r template/openspec/schemas/specfold openspec/schemas/specfold` exits 0 and fails after a one-byte change
- [ ] 3.2 Switch the kit's `openspec/config.yaml` to `schema: specfold` with the knowledge and tasks rules
  - Done when: `openspec validate --all --strict` passes and `openspec instructions proposal --change <tmp>` prints no warning

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Create the `specfold-schema` capability card, update the OpenSpec reference and add the log entry
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change in this PR, then point the capability card at the archived spec (`specfold sync` does not exist yet).
