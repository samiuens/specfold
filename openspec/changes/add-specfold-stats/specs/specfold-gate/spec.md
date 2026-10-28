# Spec Delta

## ADDED Requirements

### Requirement: G11 always-loaded budget
When the diff changes `AGENTS.md`, `CLAUDE.md`, a file either imports with `@`, `openspec/config.yaml`, a `SKILL.md` in `.agents/skills/` or `.claude/settings.json`, the gate SHALL warn with rule `G11` for each budget `specfold stats` reports as exceeded at the head. G11 SHALL never block.

#### Scenario: AGENTS.md grows past its budget
- **WHEN** a PR adds text that brings `AGENTS.md` to 2300 tokens
- **THEN** a `G11` warning names `AGENTS.md`, 2300 tokens and the budget 2000, and the gate still passes

#### Scenario: Set untouched
- **WHEN** `AGENTS.md` is already over its budget and a PR changes only `src/app.ts`
- **THEN** no `G11` finding is reported
