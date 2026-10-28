# Spec Delta

## MODIFIED Requirements

### Requirement: Worktree command
The CLI SHALL provide `specfold wt plan | new <change> | setup | clean [--base <ref>] [--json]`, run inside a repository with `specfold.yaml`. It SHALL exit with 0 on success, 1 when `new` or `clean` refuses, and 2 on usage or environment errors.

#### Scenario: Unknown subcommand
- **WHEN** `specfold wt merge` runs
- **THEN** the command exits with 2 and names the four subcommands

### Requirement: Worktree clean
`wt clean` SHALL remove each worktree under `.claude/worktrees/` that has no uncommitted or untracked changes and whose branch is merged into the default branch, or into `<ref>` when `--base <ref>` is given, delete that branch, and list every other worktree there with the reason it was kept. An unknown `<ref>` SHALL exit with 2 and remove nothing. It SHALL never force a removal.

#### Scenario: Merged and unmerged
- **WHEN** `.claude/worktrees/` holds a clean worktree whose branch is merged and one with uncommitted changes
- **THEN** the first is removed with its branch and the second is listed as kept for its changes

#### Scenario: Merged into the change branch
- **WHEN** `wt clean --base add-exports` runs and a clean worktree's branch is merged into `add-exports` but not into the default branch
- **THEN** that worktree is removed with its branch

#### Scenario: Unknown base
- **WHEN** `wt clean --base no-such-branch` runs
- **THEN** the command exits with 2 and removes nothing
