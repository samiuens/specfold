# Tasks

## 1. Estimates and budgets

```yaml
files: [tools/specfold/src/stats/stats.ts, tools/specfold/src/repo.ts, tools/specfold/test/stats.test.ts]
depends: []
scenarios: [specfold-stats#rounding, specfold-stats#import-counted-once, specfold-stats#skills-and-hook, specfold-stats#agents-md-too-long, specfold-stats#openspec-skill-exempt, specfold-stats#bundle-folders]
agent: implementer
```

- [x] 1.1 Read `stats.budget` from `specfold.yaml` with its defaults
  - Done when: `stats.test.ts` covers the defaults and a rejected non-integer budget
- [x] 1.2 Collect the always-loaded set, the overruns and the knowledge folders
  - Done when: scenarios rounding, import-counted-once, skills-and-hook, agents-md-too-long, openspec-skill-exempt and bundle-folders pass in `stats.test.ts`

## 2. Stats command

```yaml
files: [tools/specfold/src/stats/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/stats-command.test.ts]
depends: [1]
scenarios: [specfold-stats#within-budget, specfold-stats#named-files, specfold-stats#json-over-budget]
agent: implementer
```

- [x] 2.1 Add `specfold stats` with text and JSON output
  - Done when: scenarios within-budget, named-files and json-over-budget pass in `stats-command.test.ts`

## 3. Gate rule G11

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/test/gate-g11.test.ts]
depends: [1]
scenarios: [specfold-gate#agents-md-grows-past-its-budget, specfold-gate#set-untouched]
agent: implementer
```

- [x] 3.1 Warn per overrun when the diff touches the always-loaded set
  - Done when: scenarios agents-md-grows-past-its-budget and set-untouched pass in `gate-g11.test.ts`

## 4. Settings, skill and bundle

```yaml
files: [template/specfold.yaml, specfold.yaml, examples/sample-app/specfold.yaml, template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**, examples/sample-app/.agents/skills/sf-migrate/**, scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [2, 3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Add the `stats.budget` defaults to the template, kit and sample app settings
  - Done when: `node scripts/specfold.mjs stats` exits 0 in the kit, the template and the sample app
- [ ] 4.2 Run stats in `sf-migrate` step 8 and add it to the report template
  - Done when: the skill copies match the template and `check-skills.mjs` passes
- [ ] 4.3 Rebuild the bundle, its copies and the template manifest
  - Done when: the template and sample app copies equal `scripts/specfold.mjs` and `template-manifest.test.ts` passes

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-stats` and commit its result in the same PR.
