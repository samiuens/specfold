---
type: Capability
title: specfold parallel
description: Why the subagent limit is a personal setting in files git ignores, and how init and agents set it.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:57:10+01:00 }
---

# Why

Parallel sessions and subagents multiply token use, and what is affordable depends on each person's subscription plan, not on the team. So the limit on subagents running at the same time is a personal setting: `specfold parallel set <n>` writes it to `.claude/settings.local.json` (`env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, which Claude Code reads) and to `.specfold/local.yaml` (`parallel.max_subagents`, for other tools), both ignored by git.

# Choices made while specifying and building

- **One source of truth per machine, shown with its source.** `parallel show` reads the environment variable first, then the local Claude Code settings, then `.specfold/local.yaml`; without any, Claude Code's own default (20) applies and the output says so.
- **Init asks nothing, agents ask once.** `specfold init` stays prompt-free ([specfold init](/capabilities/specfold-init.md)), so it sets 3 when no limit exists, or the value of `--max-subagents`; `sf-migrate` and the template README have the agent ask the user once and pass the number.
- **1 means sequential.** `parallel set 1` turns parallel work off; the orchestrator then runs task groups one after another, so the same breakdown works on every plan.
- **Edits keep the files' other content.** The JSON keeps its other keys, and the YAML is edited as a document, so comments survive.

# Related

- [specfold wt](/capabilities/specfold-wt.md)
