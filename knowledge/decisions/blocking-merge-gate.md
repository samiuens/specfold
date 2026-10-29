---
type: Decision
title: A required CI check blocks merges
description: The specfold-gate CI check is required and blocks merges; local hooks only give early feedback.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T09:12:27+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Merge gate'"
---

# Decision

One required status check, `specfold-gate`, runs `openspec validate --all --strict` and `specfold gate`, and blocks the merge when a blocking rule fails. Git hooks and Claude Code hooks run the same checks earlier but are not the enforcement, because they can be skipped. The check is the job `specfold-gate` in `.github/workflows/specfold-gate.yml`, which the template ships and the kit runs on itself; `specfold-gate-comment.yml` posts its summary to the PR ([specfold gate](/capabilities/specfold-gate.md)).

The check enforces only once it is required on the default branch. `specfold gate require` makes it required through a ruleset of its own, named `specfold-gate`, with no bypass actors, so the `no-spec` label with a reason stays the only escape. `init --require-gate` runs it for a new repository, the sf-migrate report asks for it after the migration PR merges, and `specfold doctor` warns (D7) while the check isn't required. Specfold changes this GitHub setting only when someone runs `gate require` or passes the init flag; an upgrade never does.

# Why

Local hooks can be bypassed with `--no-verify`, and a Claude Code Stop hook gives up after 8 consecutive blocks. Only a required check on the server holds for every contributor and tool.

# Rejected alternatives

- Warnings only: the rules would erode under time pressure.

# Related

- [Built in git hooks](/decisions/built-in-git-hooks.md)
- [specfold gate](/capabilities/specfold-gate.md)
- [Github actions](/references/github-actions.md)
