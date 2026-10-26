---
type: Decision
title: Rather ask than assume
description: When a decision is open or something conflicts, agents ask the user through the native question UI instead of guessing.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Planning interview: rather ask than assume'"
---

# Decision

It is the first rule in `AGENTS.md` and in the OpenSpec context. Agents ask one decision per question with the recommended option first, using `AskUserQuestion` in Claude Code. A missing or timed-out answer is never consent; `askUserQuestionTimeout` is not set by the kit. Subagents never ask the user directly; they return the question to the orchestrator.

# Why

Guesses are the most expensive kind of mistake in agent work, because they look like decisions and surface late.

# Related

- [Claude code](/references/claude-code.md)
