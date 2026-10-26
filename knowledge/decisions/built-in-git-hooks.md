---
type: Decision
title: Built-in git hooks with adapters instead of lefthook
description: Specfold installs its own git hooks via core.hooksPath and adds one entry to an existing hook manager instead of requiring lefthook.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Agent layer'"
---

# Decision

`specfold hooks install` sets `core.hooksPath` to `.specfold/hooks/`, whose scripts each call `specfold hook <name>`. The CLI finds staged files and applies globs itself. If a repo already uses lefthook, husky or pre-commit/prek, Specfold adds one entry per hook to that manager and leaves `core.hooksPath` alone. Project-specific commands go into `specfold.yaml` under `hooks.extra`.

# Why

The CLI already does all real work, so a hook manager adds a dependency without adding value. lefthook's default glob matcher does not match `knowledge/index.md` with `knowledge/**/*.md`, and its npm shim breaks across git worktrees (lefthook issue #1398), which collides with parallel worktrees. Git config is shared across worktrees, so `core.hooksPath` works in all of them.

# Rejected alternatives

- lefthook as npm dev dependency (original plan): worktree bugs.
- lefthook as system binary: still an extra tool and a second glob syntax.
- pre-commit or prek: needs Python or an extra binary for checks the CLI already runs.

# Related

- [Git hooks](/references/git-hooks.md)
- [Blocking merge gate](/decisions/blocking-merge-gate.md)
