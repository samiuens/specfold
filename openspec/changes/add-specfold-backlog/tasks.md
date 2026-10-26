# Tasks

## 1. Setting

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Read `audit.backlog_untouched_days` with its default
  - Done when: `repo.test.ts` covers the default 180 and a configured value

## 2. Profile rules

```yaml
files: [tools/specfold/src/validate/profile.ts, tools/specfold/src/validate/index.ts, tools/specfold/test/profile.test.ts]
depends: []
scenarios: [specfold-validate#promoted-without-change, specfold-validate#unknown-priority, specfold-validate#commitment-claimed-by-an-agent, specfold-validate#agent-draft-of-a-commitment, specfold-validate#numeric-horizon]
agent: implementer
```

- [x] 2.1 Add P12 for backlog item keys
  - Done when: scenarios promoted-without-change and unknown-priority pass in `profile.test.ts`
- [x] 2.2 Add P13 for commitment keys and P14 for the vision horizon
  - Done when: scenarios commitment-claimed-by-an-agent, agent-draft-of-a-commitment and numeric-horizon pass in `profile.test.ts`

## 3. Concept keys and the human guard

```yaml
files: [tools/specfold/src/new/command.ts, tools/specfold/src/verify/login.ts, tools/specfold/src/verify/command.ts, tools/specfold/src/verify/apply.ts, tools/specfold/test/new.test.ts, tools/specfold/test/verify-apply.test.ts]
depends: []
scenarios: [specfold-new#commitment-drafted-by-an-agent, specfold-new#commitment-written-by-a-human]
agent: implementer
```

- [x] 3.1 Share the agent guard and let `verifyText` keep the status
  - Done when: `verify-apply.test.ts` covers an entry added without changing `status`, and the verify tests still pass
- [x] 3.2 Write the backlog item and commitment keys in new concepts
  - Done when: scenarios commitment-drafted-by-an-agent and commitment-written-by-a-human pass in `new.test.ts`

## 4. Future-facing items

```yaml
files: [tools/specfold/src/future/items.ts, tools/specfold/test/future-items.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [ ] 4.1 List and find backlog items and commitments, and parse due dates
  - Done when: `future-items.test.ts` covers lookup by name and path, unknown items, and date and condition triggers

## 5. Backlog command

```yaml
files: [tools/specfold/src/backlog/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/backlog.test.ts]
depends: [3, 4]
scenarios: [specfold-backlog#unknown-item, specfold-backlog#idea-from-an-interview, specfold-backlog#open-items-only, specfold-backlog#item-promoted, specfold-backlog#already-promoted, specfold-backlog#idea-dropped]
agent: implementer
```

- [ ] 5.1 Add `backlog add` and `backlog list`
  - Done when: scenarios unknown-item, idea-from-an-interview and open-items-only pass in `backlog.test.ts`
- [ ] 5.2 Add `backlog promote` and `backlog drop`
  - Done when: scenarios item-promoted, already-promoted and idea-dropped pass in `backlog.test.ts`

## 6. Commitments command

```yaml
files: [tools/specfold/src/commitments/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/commitments.test.ts]
depends: [5]
scenarios: [specfold-commitments#missing-reason, specfold-commitments#due-first, specfold-commitments#kept-by-a-change, specfold-commitments#withdrawn-by-a-human, specfold-commitments#withdrawn-by-an-agent]
agent: implementer
```

- [ ] 6.1 Add `commitments list` and `commitments fulfill`
  - Done when: scenarios missing-reason, due-first and kept-by-a-change pass in `commitments.test.ts`
- [ ] 6.2 Add `commitments withdraw` for humans only
  - Done when: scenarios withdrawn-by-a-human and withdrawn-by-an-agent pass in `commitments.test.ts`

## 7. Audit rules

```yaml
files: [tools/specfold/src/audit/rules.ts, tools/specfold/src/audit/command.ts, tools/specfold/test/audit-rules.test.ts]
depends: [1, 4]
scenarios: [specfold-audit#promise-past-due, specfold-audit#condition-trigger, specfold-audit#unanchored-promise, specfold-audit#old-idea]
agent: implementer
```

- [ ] 7.1 Add A6, A7 and A8
  - Done when: scenarios promise-past-due, condition-trigger, unanchored-promise and old-idea pass in `audit-rules.test.ts`

## 8. Lookup context

```yaml
files: [tools/specfold/src/lookup/search.ts, tools/specfold/src/lookup/command.ts, tools/specfold/test/lookup.test.ts]
depends: [4]
scenarios: [specfold-lookup#vision-always-shown, specfold-lookup#matching-commitment, specfold-lookup#machine-readable-hits]
agent: implementer
```

- [ ] 8.1 Append the vision and open commitments to lookup
  - Done when: scenarios vision-always-shown, matching-commitment and machine-readable-hits pass in `lookup.test.ts`

## 9. Session start

```yaml
files: [tools/specfold/src/hooks/claude.ts, tools/specfold/test/hooks-claude.test.ts]
depends: [4]
scenarios: [specfold-hooks#commitments-due]
agent: implementer
```

- [ ] 9.1 Print the number of commitments due within 30 days
  - Done when: scenario commitments-due passes in `hooks-claude.test.ts`

## 10. Settings files

```yaml
files: [specfold.yaml, template/specfold.yaml]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 10.1 Document `audit.backlog_untouched_days` in the kit and template settings
  - Done when: both files list the setting with its default and `specfold validate` still passes in both

## 11. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [2, 6, 7, 8, 9]
scenarios: []
agent: implementer
```

- [ ] 11.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 12. Knowledge

```yaml
files: [knowledge/**]
depends: [10, 11]
scenarios: []
agent: knowledge-curator
```

- [ ] 12.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-backlog` and commit its result in the same PR.
