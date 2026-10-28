# specfold-wt Specification

## Purpose
Defines `specfold wt`, which plans, creates, prepares and removes git worktrees for parallel changes and task groups in any agent tool.

## Requirements

### Requirement: Worktree command
The CLI SHALL provide `specfold wt plan | new <change> | setup | clean [--json]`, run inside a repository with `specfold.yaml`. It SHALL exit with 0 on success, 1 when `new` or `clean` refuses, and 2 on usage or environment errors.

#### Scenario: Unknown subcommand
- **WHEN** `specfold wt merge` runs
- **THEN** the command exits with 2 and names the four subcommands

### Requirement: Worktree plan
`wt plan` SHALL read the active changes in `openspec/changes/`, report each pair that shares a capability in its delta specs or whose task groups own overlapping file globs, and print batches of changes that may run in parallel, each no larger than the subagent limit (`specfold parallel show`). A change without `tasks.md` SHALL count as overlapping with every other change.

#### Scenario: Two independent changes
- **WHEN** `add-export` and `add-import` touch different capabilities and own disjoint files, and the limit is 3
- **THEN** `wt plan` prints one batch holding both

#### Scenario: Shared capability
- **WHEN** `add-export` and `fix-export` both have delta specs for `export`
- **THEN** `wt plan` names the shared capability and puts the two changes into different batches

### Requirement: New worktree
`wt new <change>` SHALL refuse a name that is not an active change or whose folder `.claude/worktrees/<change>/` exists. Otherwise it SHALL create that worktree from `HEAD` on a new branch `<change>`, copy every gitignored file that `.worktreeinclude` matches, and run `wt setup` inside it.

#### Scenario: Worktree for a change
- **WHEN** `specfold wt new add-export` runs and `.env` is gitignored and named in `.worktreeinclude`
- **THEN** `.claude/worktrees/add-export/` exists on branch `add-export` and holds a copy of `.env`

### Requirement: Worktree setup
`wt setup` SHALL install dependencies with the command matching the lockfile at the worktree root, preferring the package manager's shared cache, report when there is no lockfile, and write the worktree's position in `git worktree list` (the main checkout is 0) to `.specfold/wt-index`.

#### Scenario: npm worktree
- **WHEN** `wt setup` runs in the second linked worktree of a repository with `package-lock.json`
- **THEN** it runs `npm ci --prefer-offline` and `.specfold/wt-index` contains `2`

### Requirement: Worktree clean
`wt clean` SHALL remove each worktree under `.claude/worktrees/` that has no uncommitted or untracked changes and whose branch is merged into the default branch, delete that branch, and list every other worktree there with the reason it was kept. It SHALL never force a removal.

#### Scenario: Merged and unmerged
- **WHEN** `.claude/worktrees/` holds a clean worktree whose branch is merged and one with uncommitted changes
- **THEN** the first is removed with its branch and the second is listed as kept for its changes
