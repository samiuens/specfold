---
type: Decision
title: First specs are OpenSpec changes, not baseline specs
description: Specs for not-yet-built commands are written as OpenSpec changes and only reach openspec/specs/ when implemented and archived.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Milestones'"
---

# Decision

M0 writes the CLI contracts as changes (`add-specfold-validate`, `add-specfold-index`) with proposal and delta specs. The milestone that implements a change also archives it, which moves the requirements into `openspec/specs/`.

# Why

`openspec/specs/` describes behavior that exists. Specs for unbuilt behavior there would mislead agents that trust them.

# Rejected alternatives

- Baseline specs right away: specs/ would describe behavior that does not exist yet.

# Related

- [Self hosting](/decisions/self-hosting.md)
- [Specs vs knowledge](/decisions/specs-vs-knowledge.md)
