---
type: Vision
title: Where Specfold is heading
description: Goals, non-goals and principles for Specfold up to its first stable release; a draft written by an agent for the maintainer to verify.
status: stable
horizon: "2027"
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:22:28+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:55:52+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: Specfold build plan
---

> Draft for review. Vision concepts count only once a human has verified them.

# Goals

- Any repo, new or existing, gets one agent workflow where specs carry the behavior contract and an OKF knowledge bundle carries the context, with nothing written twice.
- Agents ask before they assume: every change starts from a brief the user confirmed.
- Everything that must be correct is checked by deterministic code and a required CI gate, the same for every agent and every human.
- The workflow works with any agent that reads `AGENTS.md` and `.agents/skills/`; Claude Code gets extra automation on top.
- Upgrades are one command or one PR and never touch project content.
- Specfold is built and maintained with Specfold.

# Non-goals

- Replacing OpenSpec or OKF; Specfold builds on both and stays compatible with their own tools.
- Back-filling specs for existing behavior; specs grow with real changes.
- Requiring any particular code-navigation tool, hook manager or agent.

# Principles

- Rather ask than assume.
- Small always-loaded context, details on demand.
- Trust signals come from humans, never from agents.
- New gate rules warn first and block only in the next major.

# Related

- [Self-hosting](/decisions/self-hosting.md)
- [Rather ask than assume](/decisions/rather-ask-than-assume.md)
- [The framework is called Specfold](/decisions/naming-specfold.md)
- [English only](/decisions/english-only.md)
- [One product version](/decisions/versioning.md)
