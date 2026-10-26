---
type: Decision
title: Knowledge is written before archive and synced after
description: The Knowledge task group writes concept bodies before archive; specfold sync fills keys, stubs, index and log after archive, in the same PR.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T12:37:48+01:00 }
sources:
  - id: sync-proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-sync/proposal.md
    title: add-specfold-sync proposal
---

# Decision

A change applies its knowledge delta in two steps, both in the change's own PR:

1. **Before archive:** the last task group, "Knowledge", writes or updates the bodies of the concepts listed in `knowledge.md`. Its tasks are ticked like any other.
2. **After archive:** `specfold sync <change>` runs as a `## Workflow follow-up` step. It finds the archived change, adds stubs for concepts still missing, sets `status: deprecated`, the capability card's `spec`, `resource` and `change` keys and its sources, then regenerates indexes and adds the log entry. It is idempotent.

# Why

`openspec archive` refuses while any task is unticked, so a tracked Knowledge group cannot wait for archive. At the same time, the capability card's `change` key needs the archived id (`<date>-<name>`), which only exists after archive. Splitting prose (before) from mechanical keys (after) satisfies both. Decided by the maintainer on 2026-10-26.

# Rejected alternatives

- Knowledge only as untracked follow-up after archive: knowledge work becomes invisible to `specfold status` and easy to forget.
- `specfold sync` before archive, predicting the archive id from today's date: wrong whenever archive happens on another day.

# Related

- [Custom OpenSpec schema](/decisions/custom-openspec-schema.md)
- [Task breakdown](/decisions/task-breakdown.md)
- [Deterministic CLI](/decisions/deterministic-cli.md)
