---
type: Backlog Item
title: Delete merged omp task branches in sf-apply
description: "sf-apply in omp merged an isolated task's omp/task/<id> branch but left it behind, though its In omp section says to delete it."
status: draft
state: open
priority: low
origin: verify
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:18:35+01:00 }
sources:
  - id: omp-run
    resource: ../../examples/runs/omp/README.md
    title: "omp run, section 'Findings'"
---

# Idea

In the recorded omp run, the orchestrator merged `omp/task/AddPrioritiesGroup1` with `--no-ff` but did not delete the branch, although sf-apply's "In omp" section says to run `git branch -d` after the merge. Over several rounds these branches pile up. Claude Code worktrees don't have this problem, because `specfold wt clean` removes them per round.

Possible ways: make the deletion its own numbered step in the "In omp" section so it is harder to skip, or let `specfold wt clean --base <change branch>` also remove merged `omp/task/*` branches, so both tools end a round with the same command.

Found in the omp run of `add-omp-support`.

# Related

- [Agent layer](/architecture/agent-layer.md)
- [omp features Specfold relies on](/references/omp.md)
