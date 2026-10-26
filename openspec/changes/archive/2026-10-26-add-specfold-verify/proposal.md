# Proposal

## Why

Trust in the bundle rests on humans verifying what agents drafted (`/decisions/humans-verify-only.md`). Writing `verified` by hand is error-prone and invites agents to do it. `specfold verify` writes the entry for the person at the keyboard, under their GitHub login, which G7 then checks against the PR.

## What Changes

- New command `specfold verify <path>... [--json]` for concepts in the bundle.
- It sets `status: stable` and records `verified: { by: human:<login>, at: <now> }`.
- The login comes from `gh api user`, else from `actors.github_login` in `.specfold/local.yaml`, which is gitignored.
- It refuses when it detects an agent: `CLAUDECODE` or `SPECFOLD_MODEL` set, or no terminal on stdin.

## Capabilities

### New Capabilities
- `specfold-verify`: human verification of concepts.

### Modified Capabilities
- none

## Out of scope

- The PR comment command `/specfold verify` (not planned for M4).

## Confirmed in review

1. **Paths** may be bundle-relative (`decisions/x.md`) or repository-relative (`knowledge/decisions/x.md`); `index.md`, `log.md` and files outside the bundle are refused.
2. **An existing `verified`** becomes a list, with the new entry appended; a second verification by the same login replaces that login's entry.
3. **Deprecated concepts** are refused: verifying something deprecated is a contradiction.
4. **No partial writes:** every path is checked first; if any fails, nothing is written (exit 1).
5. **Agent detection** is a guard, not security: G7 in CI is the real check.

## Impact

- New module `src/verify/`; reuses the line-level frontmatter editing from `specfold sync`.
- `.specfold/local.yaml` documented as a personal, gitignored settings file; the template's `.gitignore` lists it.
