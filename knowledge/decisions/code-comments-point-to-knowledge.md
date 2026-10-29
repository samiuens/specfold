---
type: Decision
title: Code comments point to knowledge
description: Code comments stay short; rationale lives in knowledge and the comment only references it with see knowledge:.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Convention: code comments point to knowledge'"
---

# Decision

Comments carry one line on a non-obvious mechanism, TODOs with an id, or required API docs. Rationale, business rules and history go to `knowledge/`, referenced with `// see knowledge: /decisions/x.md`. `specfold index` lists those references per concept, and gate rule G14 blocks references to missing concepts.

# Why

Rationale in comments goes stale silently and cannot be found from the knowledge side.

# Related

- [Specs vs knowledge](/decisions/specs-vs-knowledge.md)
