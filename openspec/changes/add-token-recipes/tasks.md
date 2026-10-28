# Tasks

## 1. Stats exemption

```yaml
files: [tools/specfold/src/stats/stats.ts, tools/specfold/test/stats.test.ts]
depends: []
scenarios: [specfold-stats#graphify-skill-exempt]
agent: implementer
```

- [x] 1.1 Skip `graphify` in the per-skill budget
  - Done when: scenario graphify-skill-exempt passes in `stats.test.ts`

## 2. Deny list

```yaml
files: [tools/specfold/src/migrate/merge.ts, tools/specfold/test/migrate-merge.test.ts, template/.claude/settings.json, .claude/settings.json, examples/sample-app/.claude/settings.json]
depends: []
scenarios: [specfold-migrate#deny-rules-merged, specfold-migrate#existing-permissions]
agent: implementer
```

- [ ] 2.1 Merge missing deny rules into existing Claude Code settings
  - Done when: scenarios deny-rules-merged and existing-permissions pass in `migrate-merge.test.ts`
- [ ] 2.2 Ship the deny list in the template's settings and its copies
  - Done when: the kit's and the sample app's `.claude/settings.json` equal the template's and `npx vitest run` passes

## 3. Graphify setup

```yaml
files: [tools/specfold/src/graphify/**, tools/specfold/src/commands.ts, tools/specfold/test/graphify.test.ts]
depends: []
scenarios: [specfold-graphify#graphify-missing, specfold-graphify#fresh-repository, specfold-graphify#guard-added-once, specfold-graphify#first-build, specfold-graphify#rerun]
agent: implementer
```

- [ ] 3.1 Check for graphify and the settings before any write
  - Done when: scenario graphify-missing passes in `graphify.test.ts`
- [ ] 3.2 Install the skill, write `.graphifyignore`, add the guard and build the graph
  - Done when: scenarios fresh-repository, guard-added-once, first-build and rerun pass in `graphify.test.ts` with a stub `graphify` on the PATH

## 4. Template and bundle

```yaml
files: [template/.gitignore, template/knowledge/**, template/.specfold/manifest.json, scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [1, 2, 3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Ignore `graphify-out/` in the template and add the graphify runbook to its bundle
  - Done when: `node ../scripts/specfold.mjs validate` and `index --check` pass in `template/`
- [ ] 4.2 Rebuild the bundle, its copies and the template manifest
  - Done when: the copies equal `scripts/specfold.mjs` and `template-manifest.test.ts` passes
- [ ] 4.3 Run `graphify setup` with real graphify 0.9.97 on a scratch copy of the sample app
  - Done when: the setup writes the skill, ignore file, guard and graph, and a second run is up to date

## 5. Numbers and plan

```yaml
files: [examples/sample-app/README.md, docs/plan.md]
depends: [4]
scenarios: []
agent: implementer
```

- [ ] 5.1 Record `specfold stats` before and after setup, and the user's task run, in the sample app's README
  - Done when: the README's "Token numbers" section holds both sets of numbers
- [ ] 5.2 Correct the plan's advice on committing `graphify-out/`
  - Done when: `docs/plan.md` names only `graph.json` as shareable, with graphify's merge driver

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-token-recipes` and commit its result in the same PR.
