---
type: Decision
title: A required CI check blocks merges
description: The specfold-gate CI check is required and blocks merges; local hooks only give early feedback.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Merge gate'"
---

# Decision

One required status check, `specfold-gate`, runs `openspec validate --all --strict` and `specfold gate`, and blocks the merge when a blocking rule fails. Git hooks and Claude Code hooks run the same checks earlier but are not the enforcement, because they can be skipped.

# Why

Local hooks can be bypassed with `--no-verify`, and a Claude Code Stop hook gives up after 8 consecutive blocks. Only a required check on the server holds for every contributor and tool.

# Rejected alternatives

- Warnings only: the rules would erode under time pressure.

# Related

- [Built in git hooks](/decisions/built-in-git-hooks.md)
- [Github actions](/references/github-actions.md)
