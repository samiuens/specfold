---
type: Decision
title: English only
description: Knowledge, specs, skills and docs are written in English.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T11:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Decisions'"
---

# Decision

All kit content and all content the kit generates is English. The template's OpenSpec context starts with `Language: English.`, so every artifact OpenSpec writes follows it; `specfold init` and `migrate install` keep that context and pass no `--language` flag to `openspec init`. A migrated repository keeps its own context.

# Why

One language keeps the always-loaded context small and lets every agent and contributor read every file.
