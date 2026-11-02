---
type: Backlog Item
title: Council mode for review
description: At verify or plan approval, several reviewers on different models check a change independently; their findings are merged and deduplicated.
status: draft
state: open
priority: medium
origin: human
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T11:34:25+01:00 }
sources: []
---

# Idea

A council mode for the review steps. At verify, and optionally before plan approval, several reviewers check the same change independently, each on a different model or with a different focus (correctness, specs and scenarios, knowledge). Their findings are then merged and deduplicated, and a finding several reviewers raise counts as stronger, before anything reaches the user or goes back to a task group as a packet. A single reviewer tends to confirm what it is pointed at and misses what its model misses. In `fix-migration-findings`, the verifier needed three rounds to find the flow-style refusal, the CRLF line endings and the `.mdx` path boundary, one round at a time.

Open points: which models and how many reviewers, how findings are matched for deduplication, what a council costs per change compared with one verifier, and whether it is opt-in per change or a setting in `specfold.yaml`.

# Why it waits

Recorded at the user's request on 2026-11-02, after the `fix-migration-findings` verify rounds. It overlaps with the [plan-critic role](/backlog/plan-critic-subagent-role.md), a single critic on a different model before plan approval. Both are best planned together.

# Related

- [Agent layer](/architecture/agent-layer.md)
- [Plan-critic subagent role](/backlog/plan-critic-subagent-role.md)
- [Cost per change in stats](/backlog/cost-per-change-in-stats.md)
