---
type: Backlog Item
title: Fix the parallel run findings
description: "Eight kit gaps found by the pattern-2 run: packets, branch names, the gate in a nested root, the verifier's base and sf-apply wording."
status: draft
state: open
priority: high
origin: implementation
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T10:32:31+01:00 }
---

# Idea

The recorded pattern-2 run (`examples/runs/pattern-2/README.md`) met M8's done-when and found eight gaps in the kit, to fix in one change, `fix-parallel-run-findings`:

1. Roles: the final message comes only after the last command succeeds (two subagents handed back `placeholder` and `pending`).
2. `specfold tasks packet` marks finished tasks, or lists only open ones.
3. Implementer branch names stay unique across rounds, or `sf-apply` removes merged worktrees before re-dispatching; `wt clean` could take the change branch as its base.
4. The gate's task-scope rules (G18, T10, T11) match files when `specfold.yaml` sits in a subfolder of the git repository.
5. The verifier runs `specfold gate --local --base <default branch>`.
6. `sf-apply` says that background subagents working on the change branch (the curator) own it until they report.
7. `sf-apply` step 9: the orchestrator runs sf-sync's retro, since subagents cannot ask the user.
8. Worktrees under `.claude/worktrees/` make Claude Code list their copies of skills in the main session.

Decided with the user after the run (2026-10-28): finish the proof PR first, then this change.

# Related

- [Agent layer](/architecture/agent-layer.md)
