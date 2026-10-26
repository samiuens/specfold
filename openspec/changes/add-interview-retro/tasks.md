# Tasks

## 1. Skills

```yaml
files: [template/.agents/skills/sf-sync/**, template/.agents/skills/sf-interview/**, template/.agents/skills/sf-lookup/**, .agents/skills/sf-sync/**, .agents/skills/sf-interview/**, .agents/skills/sf-lookup/**, examples/sample-app/.agents/skills/**]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add the retro and the commitment fulfillment to sf-sync
  - Done when: `node scripts/check-skills.mjs .agents/skills template/.agents/skills` passes and the kit and sample copies equal the template
- [x] 1.2 Load the checklist and offer backlog items and commitments in sf-interview
  - Done when: the skill names both steps and the copies equal the template
- [x] 1.3 Report drift and the vision and commitments block in sf-lookup
  - Done when: the skill lists the `drift` flag and the copies equal the template

## 2. Sample promotion

```yaml
files: [examples/sample-app/knowledge/**, examples/sample-app/openspec/changes/add-rename/**, examples/sample-app/openspec/changes/archive/**, examples/sample-app/openspec/specs/**, examples/sample-app/src/**, examples/sample-app/test/**]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Add the backlog item "Rename an item" and promote it to `add-rename`
  - Done when: the item has `state: promoted` and `change: add-rename`, and the change folder exists without a brief
- [x] 2.2 Run the interview with the user and write the confirmed brief
  - Done when: `specfold change check add-rename` reports no brief errors
- [ ] 2.3 Write the proposal, delta spec, knowledge and tasks
  - Done when: `openspec validate add-rename --strict` and `specfold tasks check add-rename` pass
- [ ] 2.4 Implement the change with `spec:` references in its tests
  - Done when: `npm test` passes and `specfold trace --change add-rename` reports every scenario covered
- [ ] 2.5 Archive, sync and run the retro for `add-rename`
  - Done when: `specfold sync add-rename --dry-run` reports nothing to change, `specfold validate` passes, and `log.md` has the Retro entry
- [ ] 2.6 Check trace and drift on the sample app
  - Done when: `specfold trace` reports 0 uncovered and 0 dangling, and `specfold drift` runs without error

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, run `node scripts/specfold.mjs sync add-interview-retro` and commit its result in the same PR; then run the retro from sf-sync for this change.
