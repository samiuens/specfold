---
type: Decision
title: Specfold is built with Specfold
description: Every feature, fix and release of the kit runs through the kit's own workflow, switched on piece by piece as it is built.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Self-hosting: Specfold is built with Specfold'"
---

# Decision

The kit repo uses its own knowledge bundle, specs, backlog and vision from M0, its CLI from M1, its schema from M2, its skills from M3 and its gate from M4. After `v0.1.0` there is no separate maintenance process: bug reports become backlog items or changes, and releases are archived changes.

# Why

If something in the workflow hurts, it hurts the maintainers first. Building the kit is the first real test of the kit.

# Related

- [Dogfooding split](/decisions/dogfooding-split.md)
- [Specs start as changes](/decisions/specs-start-as-changes.md)
