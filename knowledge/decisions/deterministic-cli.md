---
type: Decision
title: Everything that must be correct is deterministic code
description: Validation, indexing and gate checks live in the specfold CLI; skills call it and never re-implement its checks.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'specfold CLI'"
---

# Decision

The `specfold` CLI (TypeScript, Node >= 20.19, one runtime dependency, bundled into `scripts/specfold.mjs`) does every check and every generated file. It prints human text by default and JSON with `--json`, and exits 0 (ok), 1 (findings) or 2 (usage or environment error).

# Why

Every agent, hook and CI job gets the same answer, deterministic work costs no model tokens, and nothing that must be correct depends on an LLM.

# Related

- [Tool neutral first](/decisions/tool-neutral-first.md)
