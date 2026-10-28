---
type: Backlog Item
title: Integrator subagent role
description: A cheap subagent that merges implementer branches in order, resolves only generated-file conflicts and escalates real ones.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:19:45+01:00 }
---

# Idea

The plan names an optional `integrator` subagent (sonnet, low effort; Bash for git and Read, in the change worktree). It merges the implementers' branches in dependency order, resolves only conflicts in generated files (`knowledge/**/index.md`, `log.md`) and escalates every real conflict to the orchestrator.

# Why it waits

M8 ships five roles; the orchestrator merges implementer branches itself, which keeps the merge visible in the main session and needs no extra hand-off. An integrator pays off once changes routinely have many parallel groups, or when merging starts to crowd the orchestrator's context.

Decided in M8's planning interview (2026-10-28).

# Related

- [Every change is broken down into task groups](/decisions/task-breakdown.md)
