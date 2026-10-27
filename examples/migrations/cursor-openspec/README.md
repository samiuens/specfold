# Recorded migration: Cursor rules and an existing OpenSpec

`sf-migrate` run on a copy of the fixture `tools/specfold/test/fixtures/migrate/cursor-openspec`, in a scratch git repository on 2026-10-27. The fixture is an accounts service with:

- two Cursor rules and a team `AGENTS.md`;
- `lefthook.yml` and Claude Code settings holding only permissions;
- `openspec/` with one spec and one active change on the `spec-driven` schema.

The agent followed the skill step by step and installed from the kit's `template/` folder; the user approved the plan in the question UI.

- [plan.md](plan.md): the approved plan, as committed on the migration branch
- [report.md](report.md): the report written at the end

## Steps and outcomes

| Step | Command | Outcome |
| --- | --- | --- |
| 0 | `migrate status` | every step open; next: start |
| 1 | `migrate start`, `doctor` | `created specfold/migration from main`; D1 and D3 pass |
| 2 | `migrate inventory` | 10 sources (3 agent-rules, 1 readme, 6 spec-tool), about 307 tokens; stack Node.js, TypeScript, globs `src/**` |
| 3 | plan, approval, `migrate mark plan` | approved as `human:samiuens`; committed |
| 4 | `migrate install --from <kit>/template --source-glob 'src/**' --stack "Node.js, TypeScript"`, `doctor` | 57 changes, 0 conflicts; no `openspec init`, because `openspec/` existed; doctor passes, with D4 warning until `lefthook install` runs |
| 5 | `specfold new` per mapping row, `migrate mark convert` | 4 concepts: 2 conventions, 1 business rule, 1 capability card for the existing `login` spec |
| 6 | seed, `migrate mark seed` | 1 concept: the interface `login(email)` |
| 8 | `index`, `validate`, `openspec validate --all --strict`, report, `log add --kind Migration`, `migrate mark report` | all pass after the spec fix below; `migrate status`: all migration steps are done |

What install did to the files the repository already had:

- `AGENTS.md`: one Specfold block at the top, with the team rules unchanged below it.
- `.claude/settings.json`: the `permissions` block kept; Specfold's `SessionStart`, `PostToolUse` and `Stop` hooks added.
- `lefthook.yml`: a `specfold` command under `pre-commit` (next to the team's `test` command), plus `pre-push`, `post-checkout` and `post-merge`; `core.hooksPath` untouched.
- `openspec/config.yaml`: `schema: specfold`, with the team's comment, context and `proposal` rule kept, a `Stack:` line added and Specfold's other rules keys added.
- `openspec/changes/add-logout/.openspec.yaml`: unchanged, still `schema: spec-driven`.

## M6 checks

- **Own branch:** seven commits on `specfold/migration`; `main` is unchanged.
- **Idempotent rerun:** a second `migrate install` with the same flags prints `migrate install: everything is up to date` and leaves `git status` clean.
- **Refusal on the default branch:** `migrate inventory` on `main` exits with 1 (`not on specfold/migration: run specfold migrate start first; nothing was written`).
- **Gate:** `specfold gate --base main` passes as an adoption PR. Its one warning is G15 for the existing `login` scenario, which has no test reference; old gaps only warn.

## Found in this run

- **A pre-existing invalid spec:** the team's `login` spec already failed `openspec validate --strict` on `main` (Purpose under 50 characters), which would block G3 on the adoption PR. The skill now never edits such a spec on its own and asks first. Here the user chose to fix it in this PR, so the Purpose was lengthened in its own commit, without touching a requirement.
- **The hook manager's next step:** `migrate install` swallowed the `run lefthook install` hint of `hooks install`. It now prints `then: run lefthook install`.
- **Kit refresh:** as in the first run, kit fixes made during the run changed installed kit files. One commit refreshed them from the kit before the rerun above.
