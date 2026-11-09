---
type: Capability
title: specfold gate
description: Why specfold gate gives one merge verdict, and where the contract for its rules lives.
status: draft
spec: openspec/specs/specfold-gate/spec.md
resource: ../../openspec/specs/specfold-gate/spec.md
change: 2026-10-29-add-gate-require
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:00:29+01:00 }
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
  - id: proposal-2026-10-26-add-specfold-trace
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-trace/proposal.md
  - id: design-2026-10-26-add-specfold-trace
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-trace/design.md
  - id: proposal-2026-10-26-add-specfold-drift
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-drift/proposal.md
  - id: design-2026-10-26-add-specfold-drift
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-drift/design.md
  - id: proposal-2026-10-26-add-commitment-gate
    resource: ../../openspec/changes/archive/2026-10-26-add-commitment-gate/proposal.md
  - id: design-2026-10-26-add-commitment-gate
    resource: ../../openspec/changes/archive/2026-10-26-add-commitment-gate/design.md
  - id: proposal-2026-10-27-add-specfold-migrate
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/proposal.md
  - id: design-2026-10-27-add-specfold-migrate
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/design.md
  - id: proposal-2026-10-28-add-specfold-stats
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-stats/proposal.md
  - id: design-2026-10-28-add-specfold-stats
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-stats/design.md
  - id: proposal-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/proposal.md
  - id: design-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/design.md
  - id: proposal-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/proposal.md
  - id: design-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/design.md
---

# Why

The checks that keep knowledge and specs honest exist as separate commands (`validate`, `index --check`, `change check`, `tasks check`, `sync --dry-run`, `audit`, `openspec validate`). Nobody runs all of them on every branch, so nothing stops a merge. `specfold gate` runs them together on what a branch changes and gives one verdict, the same in CI, in the pre-push hook and in Claude Code's Stop hook ([a required CI check blocks merges](/decisions/blocking-merge-gate.md), [deterministic CLI](/decisions/deterministic-cli.md)).

# Choices made while specifying and building

- **The diff decides what is touched.** A change counts as part of the branch when the diff touches its folder; an archived change counts when its archive folder is new since the merge base. Rules about concepts (G8, G9) look at changed concepts only, so nobody gets blocked by decay they didn't cause; G12 still reports old drafts and stale concepts bundle-wide as warnings.
- **Changes being planned pass.** G5 and G18 skip a touched change until it has `tasks.md`, so a planning PR can stop after the proposal. G13 still applies, because a brief is confirmed when the user approves it, not at the end.
- **Skipping the spec needs a reason.** Source changes without a change pass only with the escape label (default `no-spec`) plus a `No-spec reason:` line in the PR body. Locally the label isn't known, so G4 only warns there.
- **Adopting Specfold is not a change.** When the merge base has no `specfold.yaml`, the branch is the PR that brings Specfold in (usually the migration PR from [specfold migrate](/capabilities/specfold-migrate.md)); G4 is skipped and the output and summary say so, while every other rule runs. G4 applies from the next PR on.
- **CI never passes silently.** Without OpenSpec installed, the gate stops with exit 2 in CI and only warns with `--local`, so hooks still work on machines without it.
- **Human claims are checked against GitHub.** G7 compares every `human:<login>` a branch adds (to a concept's `verified`, a commitment's `committed_by` or a brief's `confirmed_by`) with the PR author and the approving reviewers ([humans verify only](/decisions/humans-verify-only.md)). Only claims missing from the merge-base version count, so existing claims never need a fresh approval. A reviewer's latest review decides, but comment reviews are skipped, as on GitHub itself ([GitHub Actions](/references/github-actions.md)). API errors stop the gate with exit 2 instead of passing; without `--pr`, G7 only warns that CI will check.
- **One required job, one summary.** The template's `specfold-gate` workflow runs on PR events, reviews and the merge queue, with no `paths:` filter, so the check always reports. `--summary` writes one Markdown table that goes into the job summary; a separate `workflow_run` workflow posts it as one PR comment, because fork PRs only get a read-only token ([GitHub Actions](/references/github-actions.md)). In a merge queue there is no PR, so the job runs with `--local`: G4 and G7 warn there, after the PR's own run enforced them.
- **The always-loaded set stays small.** G11 warns per budget `specfold stats` reports as exceeded, only when the branch touches a file of that set ([specfold stats](/capabilities/specfold-stats.md)).
- **Tests follow scenarios.** G15 blocks a scenario that a touched or archived change with `tasks.md` adds or modifies when no test cites it, and every test reference to a scenario that no longer exists; untested scenarios elsewhere warn once with their count ([specfold trace](/capabilities/specfold-trace.md)).
- **Code changes name their knowledge.** G16 warns when a branch changes a file that a concept depends on (its resource, sources or `see knowledge:` code) and leaves the concept untouched; it blocks only with `gate.block_on_drift: true` ([specfold drift](/capabilities/specfold-drift.md)).
- **Promises are stated, and only humans take them back.** G17 warns when a touched change's design marks an open commitment `blocked`, links something that is not an open commitment, or has no `## Commitments` section while commitments are open; a design can keep a promise in letter only, so this stays a warning for the reviewer and, later, the verifier. A commitment set to `withdrawn` blocks unless the branch also adds a human `verified` entry, which G7 then checks against the PR ([specfold commitments](/capabilities/specfold-commitments.md)).
- **Existing rules, new ids.** Validate, change, tasks and audit findings keep their own rule id at the start of the message (for example `T5 ...`) under the gate rule that runs them.
- **Making the check required is part of the gate.** `gate require` writes one ruleset named `specfold-gate`, targeting `~DEFAULT_BRANCH`, requiring the check from GitHub Actions only, with no bypass. It goes through `gh`, so it uses the user's login and admin rights and reads no token from the environment. It finds its own ruleset by name and source, compares only the fields it sets, and writes nothing when they match, so it is safe to run again and puts back a ruleset someone changed. Other rulesets are never read beyond their names. When GitHub refuses (no admin rights, or a private repository on a free plan), GitHub's message and fixed manual steps are printed, with exit 2 ([blocking merge gate](/decisions/blocking-merge-gate.md)).
- **What must be fixed comes first.** Blocking findings come first, then warnings, each sorted by rule number; JSON `counts` gives totals per effect and per rule for the workflow summary.
- **The knowledge profile has fewer rules.** G3, G4, G5, G6, G13, G15, G18 and the design part of G17 are skipped before OpenSpec is called, so the gate runs without the openspec binary. G19 takes G4's place: a diff touching `source_globs` needs a change under `knowledge/`, or the escape label (`no-knowledge` by default) and a `No-knowledge reason:` line. It shares G4's glob match, adoption-PR exemption and label check, and warns instead of blocking with `--local` ([a knowledge-only profile](/decisions/knowledge-profile.md)).

# Related

- [specfold change check](/capabilities/specfold-change-check.md)
- [specfold tasks](/capabilities/specfold-tasks.md)
- [specfold audit](/capabilities/specfold-audit.md)
- [specfold trace](/capabilities/specfold-trace.md)
- [specfold drift](/capabilities/specfold-drift.md)
- [specfold CLI](/architecture/specfold-cli.md)
- [specfold profile](/capabilities/specfold-profile.md)
