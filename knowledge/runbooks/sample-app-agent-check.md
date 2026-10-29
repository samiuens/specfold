---
type: Runbook
title: Sample app agent check
description: How to check the agent layer and the quality loops end to end on the sample app, in Claude Code and in opencode.
status: stable
stale_after: 2027-01-24T16:02:15+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T16:02:15+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T11:10:00+01:00 }
sources:
  - id: steps
    resource: ../../examples/sample-app/README.md
    title: "Sample app README, section 'Agent check'"
---

# When to use

After a change to the skills, the planner, `AGENTS.md`, `CLAUDE.md` or the schema templates, and before a release. It is the M3 proof that the agent layer works in a clean repository in Claude Code and in a second tool. The interactive part needs a human at the keyboard.

# Steps

For the parallel layer (M8), repeat the recorded pattern-2 run in `examples/runs/pattern-2/README.md`: plan a change with three groups on disjoint files, run `sf-apply`, and compare the timeline, merges and final messages with the record.


The exact commands are in the sample app's README (section "Agent check"), linked as the source, so they live in one place. In short:

1. Copy `examples/sample-app` outside the kit and `git init` it. Claude Code loads `CLAUDE.md` and skills from parent folders, so a run inside the kit would mix in the kit's own instructions.
2. Put the kit's pinned OpenSpec on `PATH`.
3. Run `claude --agent planner --permission-mode plan`, ask for a small change, and answer its questions.
4. Run `opencode` in the same copy, list the skills and do a lookup through `sf-lookup`.
5. Copy the new change folder back into `examples/sample-app/openspec/changes/`.
6. After a change to trace, drift, the backlog or the retro, run the README's "Quality loops check" in `examples/sample-app`.

# Verify

- **Before asking,** the planner looks things up (`specfold lookup`, `openspec list --specs`).
- **Questions** arrive as native multiple-choice questions, one decision each, with the recommended option first.
- **The plan** arrives through plan approval, and nothing is written before approval. A rejected plan starts another round.
- **Your login:** the planner asks you to state it for `confirmed_by`; it never copies one from earlier files.
- **The new change** passes `change check` (only the T7 warning for `knowledge-curator` until M8) and `openspec validate --strict`.
- **opencode** lists the six sf skills and answers the lookup from the right concept.
- **Quality loops:** trace has no dangling reference and covers every main-spec scenario; drift names the decision whose code `add-rename` touched; the backlog shows the promoted and the open item; `log.md` has the `Retro` entry.

# Related

- [Agent layer](/architecture/agent-layer.md)
