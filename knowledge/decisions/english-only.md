---
type: Decision
title: English only
description: Knowledge, specs, skills and docs are written in English.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Decisions'"
---

# Decision

All kit content and all content the kit generates is English. `openspec init --language English` adds a matching line to the OpenSpec context.

# Why

One language keeps the always-loaded context small and lets every agent and contributor read every file.
