## Wish

An agent can bring an existing repo into the kit in one reviewable PR: the `sf-migrate` skill runs preflight, inventory, a plan the user approves, install, conversion of existing docs into draft concepts, a capped seed from code, validation and a report, using `specfold migrate` for every mechanical step. Two fixture repos prove it end to end.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is the M6 "done when" proven? | Two fixture folders under `tools/specfold/test/fixtures/migrate/`; CLI tests cover branch refusal, resume and idempotent install (in `add-specfold-migrate`); sf-migrate is run on both in temporary repos and the resulting `plan.md` and `report.md` are committed under `examples/migrations/` | user |
| Q2 | What do the fixtures contain? | Fixture 1: README, CONTRIBUTING, `docs/`, `docs/adr/` with 3 ADRs, a small `src/`. Fixture 2: `.cursor/rules/*.mdc`, an existing `AGENTS.md` and `lefthook.yml`, `openspec/` with one spec and one active change | user |
| Q3 | How are `specfold stats` and the seed cap handled? | No stats until M7 adds it to the skill; the seed from code is capped at 30 concepts, which the user can change at the plan checkpoint; graphify's report is used when present | user |
| Q4 | Where does sf-migrate live? | In the template with the other skills; `BOOTSTRAP.md` copies it from the downloaded template, install keeps it so a resumed run works; its description stays one sentence | user |
| Q5 | Is the separate worktree option part of M6? | No, it comes with `specfold wt` in M8 | user |

## Out of scope

- Bulk conversion of other spec tools (`.specify/`, `.kiro/specs/`, an existing `openspec/`): they get capability cards pointing at them and are listed as migration candidates, as the plan says.
- Retroactive specs (OpenSpec advises against back-filling).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-27T11:55:33+01:00
