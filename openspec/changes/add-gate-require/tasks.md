# Tasks

## 1. Require command

```yaml
files: [tools/specfold/src/gate/require.ts, tools/specfold/src/gate/command.ts, tools/specfold/test/gate-require.test.ts]
depends: []
scenarios: [specfold-gate#created, specfold-gate#dry-run, specfold-gate#already-in-place, specfold-gate#ruleset-changed-by-hand, specfold-gate#other-rulesets-kept, specfold-gate#no-admin-rights]
agent: implementer
```

- [x] 1.1 Find, compare and write the `specfold-gate` ruleset through a gh runner
  - Done when: `requireGate` creates, updates or leaves the ruleset as the scenarios say, refusals carry GitHub's message and the manual steps, and `npx vitest run test/gate-require.test.ts` passes
- [x] 1.2 Route `specfold gate require [--dry-run] [--json]` inside the gate command
  - Done when: `gate require` exits 0 or 2 as specified, `--base` is still required for the plain gate, and mixing the two option sets is a usage error

## 2. Init flag

```yaml
files: [tools/specfold/src/init/command.ts, tools/specfold/test/init.test.ts]
depends: [1]
scenarios: [specfold-init#gate-made-required, specfold-init#cannot-set-it]
agent: implementer
```

- [x] 2.1 Add `--require-gate` to init
  - Done when: init runs the require step after setup, reports a refusal as skipped with the manual steps and exits 0, lists the step in `--dry-run`, and touches no GitHub setting without the flag

## 3. Doctor check

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/test/doctor-checks.test.ts, tools/specfold/test/doctor.test.ts]
depends: []
scenarios: [specfold-doctor#not-required, specfold-doctor#offline, specfold-doctor#json-result, specfold-doctor#only-warnings, specfold-doctor#a-failure]
agent: implementer
```

- [x] 3.1 Add D7 for the required gate
  - Done when: D7 warns with `gate require` as the fix when no active rule requires `specfold-gate`, is `ok` when one does, is `ok` with "skipped" when gh fails, and the doctor tests pass with seven checks

## 4. Bundle and docs

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, docs/commands.md, docs/getting-started.md]
depends: [1, 2, 3]
scenarios: []
agent: implementer
```

- [x] 4.1 Rebuild the bundle and copy it to the template
  - Done when: `npm run build -w specfold` leaves no diff and `template/scripts/specfold.mjs` matches
- [x] 4.2 Regenerate the command reference and describe the required check in getting started
  - Done when: `node tools/specfold/docs.mjs --check` passes and `docs/getting-started.md` names `init --require-gate` and `gate require` instead of the manual setting

## 5. Agents and upgrade notes

```yaml
files: [BOOTSTRAP.md, template/.agents/skills/sf-migrate/SKILL.md, .agents/skills/sf-migrate/SKILL.md, upgrade/notes/0.2.0.md, template/.specfold/manifest.json]
depends: [4]
scenarios: []
agent: implementer
```

- [x] 5.1 Ask about the required gate in BOOTSTRAP.md and the sf-migrate report
  - Done when: BOOTSTRAP.md asks the user (recommending yes) and passes `--require-gate`, sf-migrate's report step tells the user to run `gate require` after the migration PR merges, the kit's skill copy matches, and the template manifest test passes
- [ ] 5.2 Write the upgrade notes for the next release
  - Done when: `upgrade/notes/0.2.0.md` tells the agent to ask the user and run `node scripts/specfold.mjs gate require`

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2, 3, 4, 5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `index --check` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-gate-require` and commit its result in the same PR.
- After merging, the release PR for 0.2.0 opens; check that `upgrade/notes/0.2.0.md` matches its version before merging it.
