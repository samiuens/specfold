---
type: Decision
title: Migration only ever happens on its own branch
description: sf-migrate refuses to run on the default branch or an unrelated feature branch and works on specfold/migration.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Migration assistant and bootstrap prompt'"
---

# Decision

Before writing anything, `sf-migrate` checks for a clean working tree and creates `specfold/migration` from the default branch, or resumes there. It never pushes, merges or force-pushes without approval. Undoing a migration is deleting the branch.

# Why

A migration touches many files at once; a dedicated branch keeps it reviewable and trivially reversible.

# Related

- [Delivery template bootstrap migrate](/decisions/delivery-template-bootstrap-migrate.md)
