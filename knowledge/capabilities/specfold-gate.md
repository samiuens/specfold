---
type: Capability
title: specfold gate
description: Why specfold gate gives one merge verdict, and where the contract for its rules lives.
status: draft
spec: openspec/specs/specfold-gate/spec.md
resource: ../../openspec/specs/specfold-gate/spec.md
change: 2026-10-26-add-gate-workflow
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T17:21:50+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-gate
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-gate/proposal.md
  - id: design-2026-10-26-add-specfold-gate
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-gate/design.md
  - id: proposal-2026-10-26-add-gate-github
    resource: ../../openspec/changes/archive/2026-10-26-add-gate-github/proposal.md
  - id: design-2026-10-26-add-gate-github
    resource: ../../openspec/changes/archive/2026-10-26-add-gate-github/design.md
  - id: proposal-2026-10-26-add-gate-workflow
    resource: ../../openspec/changes/archive/2026-10-26-add-gate-workflow/proposal.md
  - id: design-2026-10-26-add-gate-workflow
    resource: ../../openspec/changes/archive/2026-10-26-add-gate-workflow/design.md
---

# Why

The checks that keep knowledge and specs honest exist as separate commands (`validate`, `index --check`, `change check`, `tasks check`, `sync --dry-run`, `audit`, `openspec validate`). Nobody runs all of them on every branch, so nothing stops a merge. `specfold gate` runs them together on what a branch changes and gives one verdict, the same in CI, in the pre-push hook and in Claude Code's Stop hook ([a required CI check blocks merges](/decisions/blocking-merge-gate.md), [deterministic CLI](/decisions/deterministic-cli.md)).

# Choices made while specifying and building

- **The diff decides what is touched.** A change counts as part of the branch when the diff touches its folder; an archived change counts when its archive folder is new since the merge base. Rules about concepts (G8, G9) look at changed concepts only, so nobody gets blocked by decay they didn't cause; G12 still reports old drafts and stale concepts bundle-wide as warnings.
- **Changes being planned pass.** G5 and G18 skip a touched change until it has `tasks.md`, so a planning PR can stop after the proposal. G13 still applies, because a brief is confirmed when the user approves it, not at the end.
- **Skipping the spec needs a reason.** Source changes without a change pass only with the escape label (default `no-spec`) plus a `No-spec reason:` line in the PR body. Locally the label isn't known, so G4 only warns there.
- **CI never passes silently.** Without OpenSpec installed, the gate stops with exit 2 in CI and only warns with `--local`, so hooks still work on machines without it.
- **Human claims are checked against GitHub.** G7 compares every `human:<login>` a branch adds (to a concept's `verified` or a brief's `confirmed_by`) with the PR author and the approving reviewers ([humans verify only](/decisions/humans-verify-only.md)). Only claims missing from the merge-base version count, so existing claims never need a fresh approval. A reviewer's latest review decides, but comment reviews are skipped, as on GitHub itself ([GitHub Actions](/references/github-actions.md)). API errors stop the gate with exit 2 instead of passing; without `--pr`, G7 only warns that CI will check.
- **One required job, one summary.** The template's `specfold-gate` workflow runs on PR events, reviews and the merge queue, with no `paths:` filter, so the check always reports. `--summary` writes one Markdown table that goes into the job summary; a separate `workflow_run` workflow posts it as one PR comment, because fork PRs only get a read-only token ([GitHub Actions](/references/github-actions.md)). In a merge queue there is no PR, so the job runs with `--local`: G4 and G7 warn there, after the PR's own run enforced them.
- **Tests follow scenarios.** G15 blocks a scenario that a touched or archived change with `tasks.md` adds or modifies when no test cites it, and every test reference to a scenario that no longer exists; untested scenarios elsewhere warn once with their count ([specfold trace](/capabilities/specfold-trace.md)).
- **Existing rules, new ids.** Validate, change, tasks and audit findings keep their own rule id at the start of the message (for example `T5 ...`) under the gate rule that runs them.
- **What must be fixed comes first.** Blocking findings come first, then warnings, each sorted by rule number; JSON `counts` gives totals per effect and per rule for the workflow summary.

# Related

- [specfold change check](/capabilities/specfold-change-check.md)
- [specfold tasks](/capabilities/specfold-tasks.md)
- [specfold audit](/capabilities/specfold-audit.md)
- [specfold trace](/capabilities/specfold-trace.md)
- [specfold CLI](/architecture/specfold-cli.md)
