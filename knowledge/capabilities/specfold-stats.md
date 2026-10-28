---
type: Capability
title: specfold stats
description: Why the always-loaded set is measured, what counts in it, and why OpenSpec's own skills count only toward the total.
status: draft
spec: openspec/specs/specfold-stats/spec.md
resource: ../../openspec/specs/specfold-stats/spec.md
change: 2026-10-28-add-token-recipes
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T08:50:07+01:00 }
sources:
  - id: proposal-2026-10-28-add-specfold-stats
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-stats/proposal.md
  - id: design-2026-10-28-add-specfold-stats
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-stats/design.md
  - id: proposal-2026-10-28-add-token-recipes
    resource: ../../openspec/changes/archive/2026-10-28-add-token-recipes/proposal.md
  - id: design-2026-10-28-add-token-recipes
    resource: ../../openspec/changes/archive/2026-10-28-add-token-recipes/design.md
---

# Why

Every agent session pays for the same text before it reads a single file: `AGENTS.md`, `CLAUDE.md` and what it imports, the OpenSpec context, the name and description of every skill, and the SessionStart hook's output. That set grows a rule and a skill at a time, and nobody notices until sessions get slow and expensive. The plan's token layer keeps it small by design; `specfold stats` makes it a number that agents, hooks and CI agree on ([deterministic CLI](/decisions/deterministic-cli.md)), and gate rule G11 turns the budget into a warning on the PR that grows it ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **An estimate, said out loud.** Tokens are characters / 4, the same estimate `migrate inventory` uses, so the CLI keeps its single runtime dependency. The output says "estimated", and the default budgets leave headroom over today's sets (template about 1,700 tokens, the kit about 2,500).
- **What Claude Code loads, not what a file list says.** `@` imports are followed from `CLAUDE.md` and `AGENTS.md`, transitively and each file once, but only outside code and only for paths with a `.` or `/`, so an email address or a GitHub handle never counts. The SessionStart output is produced in-process, so it is exactly what the hook prints in that repository.
- **Budgets a repository owns.** `stats.budget` in `specfold.yaml` sets `agents_md` (2000), `total` (4000) and `skill_description` (60); the template, the kit and the sample app carry the defaults.
- **No warnings about text nobody can change.** OpenSpec's own skills (`openspec-*`, written by `openspec init`) and graphify's skill (about 91 tokens, added in `add-token-recipes`) count toward the total but not against the per-skill budget.
- **G11 only when the set is touched.** The rule warns per exceeded budget, and only when the branch changes a file of the set or `.claude/settings.json`, so an old overrun does not repeat on every PR. It never blocks ([versioning](/decisions/versioning.md): new rules warn first).
- **The bundle is shown, not budgeted.** Stats also lists the knowledge bundle per folder, because those tokens load only on demand.
- **Migrations report it.** `sf-migrate` runs stats in its last step and puts the total and any overrun into the migration report ([specfold migrate](/capabilities/specfold-migrate.md)).

# Related
