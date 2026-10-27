# Migration report: accounts

## Result

- Branch: specfold/migration (from main at 409084d)
- Kit: 0.0.0 from the kit's template folder (no release yet)
- Concepts written: 5 (2 Convention, 1 Business Rule, 1 Capability, 1 Interface), all draft
- Seeded from code: 1 of the cap 30
- Checks: specfold validate, specfold index --check and openspec validate --all --strict pass

## Needs human verification

- knowledge/domain/no-email-addresses-in-logs.md (from AGENTS.md)
- knowledge/conventions/code-style.md (from .cursor/rules/style.mdc)
- knowledge/conventions/unit-tests.md (from .cursor/rules/testing.mdc and AGENTS.md)
- knowledge/capabilities/login.md (card for the existing spec openspec/specs/login/)
- knowledge/architecture/login-function.md (seeded from src/login.ts)

## Install conflicts

none

## Migration candidates

none: the repository already uses OpenSpec. `openspec/config.yaml` now defaults to the `specfold` schema and kept its context and rule; the active change `add-logout` stays on `spec-driven` and finishes there.

## Rationale comments in code

none

## Left out

- README.md: kept as the entry point for humans.
- AGENTS.md and the Cursor rule files stay in place; Cursor and the team keep reading them.

## Open questions

- The existing spec `login` failed `openspec validate --strict` (Purpose under 50 characters) before the migration. On the user's decision its Purpose was lengthened in its own commit, without changing a requirement.
- The hooks were added to `lefthook.yml`; run `lefthook install` once after merging.
