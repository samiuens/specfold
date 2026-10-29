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

The name is final. On 2026-10-26, npm `specfold` was free and a web search found no similar developer tool. On 2026-10-29 the user found no registered trademark for Specfold and locked in the name, which closed the backlog item [check the Specfold name before publishing](/backlog/name-and-trademark-check.md).

# Why

Specs and knowledge folded into one workflow. Plain role names keep the `sf-` prefix unambiguous for skills.
