---
type: Decision
title: Specs are the contract, knowledge is context
description: Specs hold normative behavior, knowledge holds descriptive context, and nothing is written twice.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Decisions'"
---

# Decision

Normative behavior (requirements and scenarios) lives only in `openspec/specs/`. Rationale, domain terms, architecture and history live only in `knowledge/`. Knowledge contains no `SHALL`/`MUST` sentences; capability cards link to their spec instead of restating it.

# Why

Two copies of the same rule drift apart. Keeping each kind of statement in one place gives agents one source of truth per question type.

# Related

- [Separate knowledge bundle](/decisions/separate-knowledge-bundle.md)
