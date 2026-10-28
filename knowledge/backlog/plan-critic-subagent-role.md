---
type: Backlog Item
title: Plan-critic subagent role
description: A read-only subagent on a different model that reviews a brief, specs and task breakdown before the user approves the plan.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:19:45+01:00 }
---

# Idea

The plan names an optional `plan-critic` subagent: read-only, on a different model than the planner. Before the user approves a plan it reviews the brief, specs and execution plan for missing scenarios, hidden assumptions, overlapping file ownership, groups that cannot really run in parallel, groups too big for one subagent, tasks without `Done when:` and hidden dependencies. Its findings go back to the planner, which turns open points into interview questions instead of guessing.

# Why it waits

M8 ships five roles; for now `specfold tasks check` covers the mechanical part of the review (metadata, overlaps, cycles, size limits), and the planner reviews the rest itself. A critic on a second model pays off once plans regularly miss things the checks cannot see.

Decided in M8's planning interview (2026-10-28).

# Related

- [Every change is broken down into task groups](/decisions/task-breakdown.md)
- [Rather ask than assume](/decisions/rather-ask-than-assume.md)
