---
type: Decision
title: Only humans verify knowledge
description: Agents write concepts as draft; only a human adds verified entries, and the gate checks that the named human really approved.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Merge gate'"
---

# Decision

Agents always set `status: draft` and `generated` with their own actor. `specfold verify` or a `/specfold verify` PR comment adds `verified: human:<github-login>` for the acting person, and gate rule G7 checks that login against the PR author and approving reviewers.

# Why

A trust signal is worthless if an agent can forge it.

# Related

- [Blocking merge gate](/decisions/blocking-merge-gate.md)
