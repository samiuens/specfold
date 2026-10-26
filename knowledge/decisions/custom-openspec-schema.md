---
type: Decision
title: Custom OpenSpec schema with brief and knowledge artifacts
description: Changes use the custom schema specfold, forked from spec-driven, with a first brief artifact and a knowledge artifact.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'OpenSpec setup'"
---

# Decision

The schema `specfold` is forked from `spec-driven`. It adds `brief` (first, `requires: []`, required by `proposal`) and `knowledge` (`requires: [proposal, specs]`, required by `tasks`). OpenSpec treats `requires` as advisory and does not check custom artifacts on validate or archive, so `specfold change check` and the merge gate enforce them.

# Why

The knowledge delta and the confirmed brief must be part of every change, in a shape a tool can check, without patching OpenSpec itself.

# Rejected alternatives

- Plain `spec-driven` with knowledge written afterwards: knowledge updates get forgotten.
- Patching OpenSpec: every upstream release would break the kit.

# Related

- [Openspec](/references/openspec.md)
- [Blocking merge gate](/decisions/blocking-merge-gate.md)
