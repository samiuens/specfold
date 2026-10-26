# Tasks

## 1. Brief rules

```yaml
files: [tools/specfold/src/change/brief.ts, tools/specfold/src/validate/profile.ts, tools/specfold/test/change-brief.test.ts]
depends: []
scenarios: [specfold-change-check#missing-brief, specfold-change-check#empty-wish, specfold-change-check#agent-confirmation, specfold-change-check#timestamp-without-offset, specfold-change-check#unowned-question, specfold-change-check#owned-question, specfold-change-check#unknown-knowledge-source, specfold-change-check#short-brief-for-tooling]
agent: implementer
```

- [x] 1.1 Add rules B0 to B4 with the short brief for `skip_specs` changes
  - Done when: the eight scenarios of this group pass in `change-brief.test.ts`

## 2. Knowledge rules

```yaml
files: [tools/specfold/src/change/knowledge.ts, tools/specfold/test/change-knowledge.test.ts]
depends: []
scenarios: [specfold-change-check#missing-knowledge-delta, specfold-change-check#broken-yaml, specfold-change-check#unknown-op, specfold-change-check#empty-delta-without-reason, specfold-change-check#update-of-a-missing-concept, specfold-change-check#concept-written-before-archive, specfold-change-check#new-capability-without-card, specfold-change-check#duplicate-path]
agent: implementer
```

- [ ] 2.1 Add rules K0 to K6 with an option for archived changes
  - Done when: the eight scenarios of this group pass in `change-knowledge.test.ts`

## 3. Change check command

```yaml
files: [tools/specfold/src/change/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/change-check.test.ts, tools/specfold/test/fixtures/change/**]
depends: [1, 2]
scenarios: [specfold-change-check#clean-change, specfold-change-check#unknown-change, specfold-change-check#json-output, specfold-change-check#tasks-error-fails-change-check]
agent: implementer
```

- [ ] 3.1 Add `specfold change check <change> [--json]` combining brief, knowledge and tasks findings
  - Done when: the four scenarios of this group pass in `change-check.test.ts`

## 4. Bundle

```yaml
files: [scripts/specfold.mjs]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Rebuild the bundled CLI
  - Done when: `npm run build -w specfold` leaves no diff and `node scripts/specfold.mjs change check add-specfold-change-check` reports only the open B2 confirmation

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change in this PR, then point the capability card at the archived spec by hand (`specfold sync` does not exist yet).
