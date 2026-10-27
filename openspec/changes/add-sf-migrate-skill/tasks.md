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
- [ ] 1.2 Copy the skill to the kit and the sample app and link it for Claude Code
  - Done when: the copies equal the template and `agents sync --check` passes in the kit, the template and the sample app

## 2. Recorded runs

```yaml
files: [examples/migrations/**, examples/README.md]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 2.1 Migrate the ADR and docs fixture with the skill and record the run
  - Done when: `examples/migrations/adr-docs/` holds the approved `plan.md`, `report.md` and a README showing own branch, idempotent rerun, refusal on `main` and a passing validate
- [ ] 2.2 Migrate the Cursor rules and OpenSpec fixture with the skill and record the run
  - Done when: `examples/migrations/cursor-openspec/` holds the same, and the existing change still has its own schema

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-sf-migrate-skill` and commit its result in the same PR.
