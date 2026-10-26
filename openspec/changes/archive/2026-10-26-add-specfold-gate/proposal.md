# Proposal

## Why

The rules that keep knowledge and specs honest exist as separate commands (`validate`, `index --check`, `change check`, `tasks check`, `sync --dry-run`, `audit`, `openspec validate`). Nothing runs them together on what a PR actually changes, and nothing blocks a merge (`/decisions/blocking-merge-gate.md`). `specfold gate` is that single verdict, the same in CI, in git hooks and in Claude Code's Stop hook (`/decisions/deterministic-cli.md`).

## What Changes

- New command `specfold gate --base <ref> [--local] [--label <name>]... [--pr-body <file>] [--json]`.
- Rules G1-G6, G8-G10, G12-G14 and G18, each with its effect (block or warn), computed on the diff from the merge base of `<ref>` and `HEAD`. With `--local`, uncommitted and untracked files count too.
- Exit 1 when any blocking rule fails.

## Capabilities

### New Capabilities
- `specfold-gate`: the merge gate command, the diff it judges, and rules G1-G6, G8-G10, G12-G14 and G18.

### Modified Capabilities
- none

## Out of scope

- G7, which needs the GitHub API (`add-gate-github`).
- G11 (M7) and G15-G17 (M5), each added by its milestone.
- The workflow, its summary comment and branch protection (`add-gate-workflow`).

## Confirmed in review

1. **Changes in the PR** are the active change folders with any changed file under `openspec/changes/<name>/`; **archived in the PR** are the folders under `openspec/changes/archive/` that the diff adds.
2. **G1 and G10 split `validate`:** G1 reports every validate error except the link rules; G10 reports L1 and L2, blocking only when `gate.block_on_broken_links` is true (default) and warning otherwise.
3. **G3 without OpenSpec installed** is an environment error in CI mode and a warning with `--local`, so hooks still work on machines without OpenSpec.
4. **G4 counts as satisfied** when the diff touches any file under an active change folder or adds an archived one, or when `--label no-spec` is given and the PR body has a non-empty `No-spec reason:` line. With `--local`, an unsatisfied G4 only warns.
5. **G8 and G9 look at changed concepts only;** G9 blocks unless `gate.block_on_stale_touched` is false, then it warns.
6. **G12 is bundle-wide** and reuses audit rules A1 and A2 as warnings.
7. **Rule order in the output** is by rule number, then path and line.
8. **JSON `counts`** holds `block`, `warn` and `rules` (findings per rule id).
9. **Changes being planned:** G5 and G18 skip a touched change until it has `tasks.md`; G13 still applies, because a brief is confirmed when the user approves it.

## Impact

- New CLI module `src/gate/`, reusing the existing rule functions; fixture-based integration tests with temporary git repositories.
- Consumers: `specfold hook pre-push` and the Claude Code Stop hook (`add-specfold-hooks`), the CI workflow (`add-gate-workflow`).
