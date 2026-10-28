# Proposal

## Why

The plan's token layer (M7) recommends graphify for "where in the code" questions, and keeps agents away from files that only cost tokens: lockfiles, build output, snapshots. Today both are advice in the plan. Setting graphify up by hand takes several commands and a settings edit, and its own installers write a second instruction block into `CLAUDE.md` or `AGENTS.md` ([graphify code only](/decisions/graphify-code-only.md)). `specfold graphify setup` does it in one idempotent step. The template ships the read barriers, and the sample app shows with numbers what the layer saves.

## What Changes

- **`specfold graphify setup [--json]`:**
  - refuses without graphify;
  - installs graphify's skill into `.agents/skills/graphify/` and links it;
  - writes `.graphifyignore` when missing;
  - with Claude Code, adds graphify's PreToolUse guard to `.claude/settings.json`;
  - builds the graph code-only (`GRAPHIFY_BACKEND=none`) when none exists;
  - a rerun changes nothing.
- **`graphify-out/`** is ignored in the template's `.gitignore`. Specfold's hooks already refresh an existing graph after checkout and merge.
- **Deny list:** `permissions.deny` Read rules in `template/.claude/settings.json` for lockfiles, `node_modules`, build output, coverage, snapshots and `graphify-out/graph.json`. `migrate install` adds the missing rules to an existing settings file.
- **Runbook** `runbooks/graphify.md` in the template's bundle: setup, refresh, and graphify's commit-with-code option for teams that want to share `graph.json`.
- **Sample app numbers:**
  - `specfold stats` before and after;
  - one task run in Claude Code with and without graphify, which the user runs and reads;
  - both recorded in its README.
- **Plan correction:** the plan's "teams may commit `GRAPH_REPORT.md`" becomes graphify's own advice (share only `graph.json`).

## Capabilities

### New Capabilities
- `specfold-graphify`: the graphify setup command.

### Modified Capabilities
- `specfold-migrate`: the settings merge also adds missing deny rules.

## Out of scope

- Ignore or permission files of agents other than Claude Code (backlog item `read-barriers-for-other-agents`).
- graphify's semantic pass and its LLM backends.

## Open points

1. **graphify's commands changed:** 0.9.97's help lists no `install --project` and no `hook-guard`, which `/decisions/graphify-code-only.md` names. The design checks how the current release installs a project-level skill for `.agents/skills` and which PreToolUse command `graphify claude install` writes, and the decision is updated to match.
2. **The deny rules** use Claude Code's `Read(<gitignore-style pattern>)` form; the exact list is fixed in the design.
3. **Claude Code is detected** by `.claude/skills` in `agents.targets`, as for skill links.

## Impact

- New module `src/graphify/`; `src/migrate/merge.ts` for deny rules.
- `template/.claude/settings.json`, `template/.gitignore`, the template manifest, the template's `knowledge/runbooks/`.
- `docs/plan.md`, `examples/sample-app/README.md`, the graphify decision, a capability card for graphify setup.
