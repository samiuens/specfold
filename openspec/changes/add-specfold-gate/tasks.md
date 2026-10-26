# Tasks

## 1. Shared helpers

```yaml
files: [tools/specfold/src/git.ts, tools/specfold/src/tasks/git.ts, tools/specfold/src/openspec.ts, tools/specfold/src/doctor/checks.ts, tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/src/sync/command.ts, tools/specfold/src/sync/plan.ts, specfold.yaml, template/specfold.yaml]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Move the git runner to `src/git.ts`
  - Done when: `npm test -w specfold` passes with the tasks git tests unchanged
- [ ] 1.2 Share the OpenSpec binary lookup between doctor and gate
  - Done when: `npm test -w specfold` passes with the doctor tests unchanged
- [ ] 1.3 Read the gate settings with their defaults
  - Done when: `repo.test.ts` covers the defaults and configured values
- [ ] 1.4 Extract the sync planning step as `planSync`
  - Done when: `npm test -w specfold` passes with the sync tests unchanged

## 2. Diff

```yaml
files: [tools/specfold/src/gate/diff.ts, tools/specfold/test/gate-diff.test.ts, tools/specfold/test/gate-helpers.ts]
depends: [1]
scenarios: [specfold-gate#uncommitted-file-counts-locally]
agent: implementer
```

- [ ] 2.1 Compute changed files, touched changes and archived changes against a base
  - Done when: scenario uncommitted-file-counts-locally passes in `gate-diff.test.ts`

## 3. Rules

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/src/gate/openspec.ts, tools/specfold/test/gate-rules.test.ts]
depends: [2]
scenarios: [specfold-gate#missing-frontmatter-key, specfold-gate#stale-index, specfold-gate#broken-link, specfold-gate#invalid-delta-spec, specfold-gate#code-without-change, specfold-gate#escape-with-reason, specfold-gate#missing-knowledge-delta, specfold-gate#archived-without-sync, specfold-gate#unconfirmed-brief, specfold-gate#overlapping-parallel-groups, specfold-gate#agent-claims-a-human, specfold-gate#edited-stale-reference, specfold-gate#old-draft-elsewhere, specfold-gate#new-dangling-reference, specfold-gate#old-dangling-reference]
agent: implementer
```

- [ ] 3.1 Add G1, G2 and G10 over validate and the index check
  - Done when: scenarios missing-frontmatter-key, stale-index and broken-link pass in `gate-rules.test.ts`
- [ ] 3.2 Add G3 over `openspec validate`
  - Done when: scenario invalid-delta-spec passes in `gate-rules.test.ts`
- [ ] 3.3 Add G4 with the escape label and reason
  - Done when: scenarios code-without-change and escape-with-reason pass in `gate-rules.test.ts`
- [ ] 3.4 Add G5, G6, G13 and G18 over touched and archived changes
  - Done when: scenarios missing-knowledge-delta, archived-without-sync, unconfirmed-brief and overlapping-parallel-groups pass in `gate-rules.test.ts`
- [ ] 3.5 Add G8, G9, G12 and G14 over concepts and code references
  - Done when: scenarios agent-claims-a-human, edited-stale-reference, old-draft-elsewhere, new-dangling-reference and old-dangling-reference pass in `gate-rules.test.ts`

## 4. Gate command

```yaml
files: [tools/specfold/src/gate/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/gate-command.test.ts]
depends: [3]
scenarios: [specfold-gate#clean-branch, specfold-gate#unknown-base, specfold-gate#json-verdict]
agent: implementer
```

- [ ] 4.1 Add `specfold gate` with output, ordering and exit codes
  - Done when: scenarios clean-branch, unknown-base and json-verdict pass in `gate-command.test.ts`

## 5. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [4]
scenarios: []
agent: implementer
```

- [ ] 5.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-gate` and commit its result in the same PR.
