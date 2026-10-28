---
type: Capability
title: specfold wt
description: Why worktrees get their own commands, how wt plan batches changes, and why wt clean never forces a removal.
status: draft
spec: openspec/specs/specfold-wt/spec.md
resource: ../../openspec/specs/specfold-wt/spec.md
change: 2026-10-28-fix-parallel-run-findings
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T10:45:04+01:00 }
sources:
  - id: proposal-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/proposal.md
  - id: design-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/design.md
  - id: proposal-2026-10-28-fix-parallel-run-findings
    resource: ../../openspec/changes/archive/2026-10-28-fix-parallel-run-findings/proposal.md
---

# Why

Parallel work follows OpenSpec's boundaries: one change per worktree, and inside a change only task groups with disjoint files at once ([task breakdown](/decisions/task-breakdown.md)). Claude Code creates worktrees for sessions and subagents, but it does not know which changes collide, how a fresh checkout gets its dependencies, or which worktrees are safe to delete, and other tools have no worktrees at all ([tool-neutral first](/decisions/tool-neutral-first.md)). `specfold wt` covers that gap with deterministic commands ([deterministic CLI](/decisions/deterministic-cli.md)).

# Choices made while specifying and building

- **Plan by capability and files.** Two active changes conflict when their delta specs touch the same capability, when their groups own overlapping globs (the tasks check's T5 test, reused), or when one has no `tasks.md` yet. Batches are greedy in name order and never exceed the personal limit ([specfold parallel](/capabilities/specfold-parallel.md)).
- **The Knowledge group does not count.** Every change's last group owns `knowledge/**`, so counting it would make every pair conflict; concept edits rarely collide, and indexes are regenerated after each merge (found while building).
- **New worktrees start from HEAD.** `wt new` branches from the current commit, like Claude Code does with `worktree.baseRef: "head"`, which the template sets because the default would branch from the remote default branch and miss the change's own commits.
- **Setup is explicit.** `wt setup` installs from the lockfile with the package manager's shared cache and writes the worktree's position in `git worktree list` to `.specfold/wt-index`, so test configs can derive ports and database names without shared state. Implementers run it themselves, because SessionStart does not fire for subagents.
- **Clean never forces.** A worktree is removed only when it is clean, unlocked, on a branch, and `git cherry` finds no commit missing from the default branch, or from `--base <ref>`, which `sf-apply` sets to the change branch to clean merged worktrees during a run; `git cherry` also recognizes rebased commits, which matters for repositories that merge by rebase. Everything else is listed with its reason, and exit 1 says something was kept.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
