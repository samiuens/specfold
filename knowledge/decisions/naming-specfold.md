---
type: Decision
title: The framework is called Specfold
description: Specfold replaces the working names (kb, okf-openspec-kit); the CLI is specfold with alias sf, skills use the sf- prefix.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Naming'"
---

# Decision

Repo `specfold`, CLI `specfold` (alias `sf`), config `specfold.yaml` and `.specfold/`, skills `sf-*`, schema `specfold`, CI check `specfold-gate`, managed-block markers `specfold:start`/`specfold:end`. Subagent roles use plain names (`planner`, `scout`, `implementer`, `verifier`). `knowledge/` and `openspec/` keep their names.

# Why

Specs and knowledge folded into one workflow. Plain role names keep the `sf-` prefix unambiguous for skills.
