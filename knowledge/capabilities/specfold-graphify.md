---
type: Capability
title: specfold graphify setup
description: Why graphify setup is one CLI step, code-only, with a guard that never fails for teammates who don't have graphify installed.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:11:59+01:00 }
---

# Why

graphify answers "where is it in the code, what calls what" from a local graph instead of grep plus many file reads. Set up by hand it takes several commands and a settings edit, and graphify's own platform installers write a second instruction block into `CLAUDE.md` or `AGENTS.md` ([graphify code only](/decisions/graphify-code-only.md)). `specfold graphify setup` does the kit's way in one idempotent step, as deterministic code ([deterministic CLI](/decisions/deterministic-cli.md)).

# Choices made while specifying and building

- **Every check before the first write.** A missing `graphify`, or Claude Code settings the merge cannot handle, stops the command with exit 2 and nothing written.
- **Only graphify's project skill.** Setup runs `graphify install --project --platform agents`, which writes nothing but `.agents/skills/graphify/`, then links it like every other skill ([skills symlinked for Claude](/decisions/skills-symlinked-for-claude.md)). The `--project` flag is missing from graphify's top-level help but listed by `graphify install --help` (checked with 0.9.97).
- **A guard that is safe to commit.** graphify's two PreToolUse entries (`hook-guard search` on `Bash|Grep`, `hook-guard read` on `Read|Glob`) are wrapped in `if command -v graphify ...`, so a teammate without graphify gets no hook error on every read, and graphify's own exit status still passes through.
- **No LLM, no upload.** The first build is `graphify extract . --code-only` plus `graphify cluster-only . --no-label`, both with `GRAPHIFY_BACKEND=none`; the second writes `GRAPH_REPORT.md`, which `sf-migrate` reads for its seed step.
- **The graph stays local.** The template's `.gitignore` ignores `graphify-out/`, and Specfold's own hooks refresh an existing graph; graphify's commit-with-code option is in the template's runbook for teams that want it.
- **Its skill does not trip the budget.** graphify's skill description is about 91 tokens; like OpenSpec's skills it counts only toward the always-loaded total ([specfold stats](/capabilities/specfold-stats.md)).
- **Measured, not promised.** On the sample app setup adds 91 always-loaded tokens (1,729 to 1,820); the task run that would show the savings is still open ([backlog](/backlog/measure-a-task-run-with-and-without-graphify.md)).

# Related

- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold CLI](/architecture/specfold-cli.md)
