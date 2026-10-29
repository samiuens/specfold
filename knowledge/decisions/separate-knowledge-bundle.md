---
type: Decision
title: Knowledge lives in its own OKF bundle
description: Project knowledge is an OKF v0.2 bundle in knowledge/, separate from openspec/, so both stay readable by their own tools.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Knowledge bundle profile'"
---

# Decision

`knowledge/` is a standalone OKF v0.2 bundle with a stricter Specfold profile on top. `openspec/` stays a plain OpenSpec tree. The two are connected by links and by the `knowledge` artifact of each change, not by nesting one inside the other.

# Why

Any OKF consumer can read the bundle and any OpenSpec tool can read the specs. Neither format has to be bent to hold the other.

# Related

- [Specs vs knowledge](/decisions/specs-vs-knowledge.md)
- [Okf](/references/okf.md)
