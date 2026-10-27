# Tasks

## 1. Skill

```yaml
files: [template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**, examples/sample-app/.agents/skills/sf-migrate/**, template/.claude/skills/sf-migrate, .claude/skills/sf-migrate, examples/sample-app/.claude/skills/sf-migrate]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Write `sf-migrate` with its plan, conversion and report references
  - Done when: `node scripts/check-skills.mjs .agents/skills template/.agents/skills` passes
- [x] 1.2 Copy the skill to the kit and the sample app and link it for Claude Code
  - Done when: the copies equal the template and `agents sync --check` passes in the kit, the template and the sample app

## 2. Recorded runs

```yaml
files: [examples/migrations/**, examples/README.md]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Migrate the ADR and docs fixture with the skill and record the run
  - Done when: `examples/migrations/adr-docs/` holds the approved `plan.md`, `report.md` and a README showing own branch, idempotent rerun, refusal on `main` and a passing validate
- [x] 2.2 Migrate the Cursor rules and OpenSpec fixture with the skill and record the run
  - Done when: `examples/migrations/cursor-openspec/` holds the same, and the existing change still has its own schema

## 3. Install manifest

```yaml
files: [tools/specfold/src/migrate/install.ts, tools/specfold/src/migrate/command.ts, tools/specfold/test/migrate-install.test.ts, tools/specfold/test/migrate.test.ts, scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: []
scenarios: []
agent: implementer
```

- [x] 3.1 Keep the installed hash of a kit file or block that is in conflict on a later install
  - Done when: `migrate-install.test.ts` covers a conflicting file and block keeping their manifest entries, and the bundle and its copies are rebuilt
- [x] 3.2 Pass the hook manager's next step through `migrate install`
  - Done when: `migrate-install.test.ts` and `migrate.test.ts` show `run lefthook install` for a lefthook repository

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [2, 3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-sf-migrate-skill` and commit its result in the same PR.
