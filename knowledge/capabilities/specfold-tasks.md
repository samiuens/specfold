---
type: Capability
title: specfold tasks
description: Why tasks.md is a checked breakdown of task groups, and where the contract for tasks check, status and resume lives.
status: draft
change: 2026-10-28-fix-parallel-run-findings
resource: ../../openspec/specs/specfold-tasks/spec.md
spec: openspec/specs/specfold-tasks/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T10:45:04+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-tasks
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-tasks/proposal.md
  - id: design-2026-10-26-add-specfold-tasks
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-tasks/design.md
  - id: proposal-2026-10-28-add-subagent-roles
    resource: ../../openspec/changes/archive/2026-10-28-add-subagent-roles/proposal.md
  - id: design-2026-10-28-add-subagent-roles
    resource: ../../openspec/changes/archive/2026-10-28-add-subagent-roles/design.md
  - id: proposal-2026-10-28-fix-parallel-run-findings
    resource: ../../openspec/changes/archive/2026-10-28-fix-parallel-run-findings/proposal.md
---

# Why

Subagents do their best work on small, bounded units: a group of tasks that owns its files, where each task has a check that says when it is done ([task breakdown](/decisions/task-breakdown.md)). `specfold tasks check` makes that shape a contract rather than a habit. `specfold status` and `specfold resume` read progress from the checkboxes and the `Task:` commit trailers. A fresh session or a new subagent can therefore pick up the next task without anyone re-explaining the change.

# Choices made while specifying and building

- **Packets come from the breakdown.** `tasks packet <change> <group>` prints one group's tasks, files, dependencies, scenario text (delta specs first, so a modified scenario shows its new wording), the brief's wish and decisions and the concepts the proposal links, plus the commit rules. Ticked tasks are marked `[done]`, so a re-dispatched group starts at its first open task; an implementer needs nothing else ([agent layer](/architecture/agent-layer.md)).
- **What blocks and what warns.** Rules that make task ids or parallel work unsafe are errors: metadata, numbering, cycles, overlap, unknown scenarios. Size limits, unknown roles, a missing Knowledge group and trailer mismatches only warn.
- **Overlap without listing every path.** Two groups count as overlapping when an existing file matches both, when a plain path of one matches the other, or when one group's `dir/**` covers the other's directory.
- **The change's own `tasks.md` is exempt** from the scope and size checks, because every task commit ticks it (found while dogfooding `add-specfold-validate`).
- **Rules T10 and T11 need `--base`,** because they read git history from the merge base. Without it, the check runs on the file alone, which suits editors and hooks. They read commit files relative to the folder holding `specfold.yaml`, so `files:` globs match in a Specfold root below the repository root, and files outside it count toward neither scope nor size (found in the pattern-2 run).
- **This change archives only what it builds.** `change check` including the tasks findings belongs to `add-specfold-change-check`, and gate rule G18 to the M4 gate change.

# Related

- [specfold schema](/capabilities/specfold-schema.md)
- [specfold CLI](/architecture/specfold-cli.md)
- [Write before, sync after](/decisions/write-knowledge-before-sync-after.md)
