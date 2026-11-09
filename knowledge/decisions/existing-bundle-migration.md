---
type: Decision
title: A migration rewrites an existing OKF bundle
description: A migration rewrites an existing OKF bundle into Specfold types and folders, removes the originals and rewrites references to them.
status: draft
decision: accepted
change: 2026-11-09-add-okf-bundle-migration
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:58:22+01:00 }
sources:
  - id: brief-2026-11-09-add-okf-bundle-migration
    resource: ../../openspec/changes/archive/2026-11-09-add-okf-bundle-migration/brief.md
---

# Decision

When `knowledge/` already holds an OKF bundle, the migration rewrites it into Specfold's types and folders instead of adopting it as it is. Types with a clear equivalent are mapped (ADR to Decision, Playbook to Runbook, Domain Concept to Term, App to Component); a type without one is decided per file in the plan. Each original becomes a new concept with its full rationale and a `sources` permalink to the original at the migration's base commit, and the original is removed in the migration PR. References to moved concepts are rewritten in every tracked file, hand-written indexes are regenerated with their intro text moved into concepts or folder descriptions, tooling that Specfold replaces is removed, and team AGENTS.md rules are sorted into removed, Convention and kept. Decided by the maintainer on 2026-11-09 in the planning interview of change `add-okf-bundle-migration` (brief questions Q1 to Q16).

# Why

A bundle adopted as it is keeps its own types, folder layout and validator, so Specfold's type rules (such as `decision:` on a Decision), its lookup by folder and its own checks would not apply, and two validators would disagree. Rewriting once, in a reviewable PR, leaves one bundle in one shape. The permalinks keep every original one click away, so removing the files loses nothing. The first real migration (on v0.2.1) showed that leaving originals and references behind costs more later than rewriting them during the migration.

While the rewrite runs, links break and originals fail Specfold's rules until they are replaced. The hooks, including the Claude stop hook, only warn about broken links and about files still equal to the base commit until `migrate mark convert`; pre-push and the CI gate stay strict, so the PR still has to be clean ([plan-aware link relief](/decisions/plan-aware-link-relief.md) was the rejected alternative).

# Rejected alternatives

- **Keeping the bundle's types by default and mapping on request:** less churn, but Specfold's type rules would not apply to most concepts.
- **Keeping concepts in place and fixing only what validate reports:** the bundle would keep a second folder layout next to Specfold's.
- **Keeping the originals until the user opts in to removing them:** two copies of every concept would drift; the commitment's opt-in wording was changed to make removal the default.

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [Migrate a repository that already has an OKF bundle](/commitments/migrate-an-existing-okf-bundle.md)
- [A knowledge-only profile](/decisions/knowledge-profile.md)
- [Migration only ever happens on its own branch](/decisions/migration-on-own-branch.md)
