## Wish

The mechanical half of a migration is deterministic CLI code: `specfold migrate` enforces the own-branch rule, keeps resumable state, inventories existing knowledge sources with token estimates, and installs the kit files from an unpacked template folder without overwriting anything the repo already has. The gate lets the migration PR itself through G4.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M6 split? | Three changes: `add-specfold-migrate` (CLI), `add-sf-migrate-skill` (skill and fixture runs), `add-bootstrap` (`BOOTSTRAP.md` and `specfold init`) | user |
| Q2 | What is CLI and what is skill? | CLI: `specfold migrate` with `start`, `inventory`, `install` and `status` (clean tree and branch rule, `state.json`, inventory with token estimates, copying kit files, merging existing files). Skill: plan, convert, seed, report | user |
| Q3 | Where do kit files come from before releases exist? | `install --from <dir>`, an unpacked template folder; `BOOTSTRAP.md` fetches it, M9 switches to the release asset | user |
| Q4 | How are an existing `AGENTS.md` and `CLAUDE.md` merged? | The user's text stays; Specfold's sections go into a managed block between `<!-- specfold:start -->` and `<!-- specfold:end -->` at the top, the only part M9's upgrader rewrites | user |
| Q5 | What happens to an existing `openspec/`? | The specfold schema is added and becomes the default for new changes; their context, rules, specs and active changes stay; Specfold rules are added only where they have none | user |
| Q6 | Is `.specfold/manifest.json` written now? | Yes: install records each kit-owned file with its hash and the kit version, as the base for M9's three-way upgrade | user |
| Q7 | How does the gate treat the migration PR? | When the base has no `specfold.yaml`, G4 is skipped and the summary calls it an adoption PR; every other rule runs | user |
| Q8 | What does install do with other existing files? | Merges per file type and never overwrites: `.claude/settings.json` gets Specfold's hooks added to its JSON; PR template, `.gitignore` and `CODEOWNERS` get a managed block; anything it cannot merge is reported | user |
| Q9 | What is committed from `.specfold/migration/`? | `plan.md` and `report.md`; `state.json` goes into `.gitignore` | user |
| Q10 | How is the default branch found? | `origin/HEAD`; without a remote, `main` or `master` if exactly one exists; otherwise exit 2 asking for `--default-branch <name>` | user |
| Q11 | Which agent tools are set up by default? | `agents` and `claude` (`.agents/skills` plus `.claude/` skills links, planner and settings); `--tools agents` leaves out the Claude Code files | user |
| Q12 | Is the separate worktree option part of M6? | No, it comes with `specfold wt` in M8 | user |

## Out of scope

- The `sf-migrate` skill, plan and report templates, and the fixture runs (`add-sf-migrate-skill`).
- `BOOTSTRAP.md` and `specfold init` (`add-bootstrap`).
- Downloading releases and upgrading (M9); worktrees (M8); `specfold stats` (M7).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-27T11:55:33+01:00
