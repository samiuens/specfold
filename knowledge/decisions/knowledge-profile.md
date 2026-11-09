---
type: Decision
title: A knowledge-only profile
description: Specfold supports a knowledge-only profile, chosen by a named profile key, so repositories without behavior to spec can adopt it.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T08:59:49+01:00 }
sources:
  - id: brief-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/brief.md
  - id: proposal-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/proposal.md
  - id: design-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/design.md
---

# Decision

Specfold supports a knowledge-only setup next to the full one. A `profile` key in `specfold.yaml` takes `knowledge` or `full` (default `full`), set with `specfold init --profile knowledge` or `specfold migrate install --profile knowledge`. The knowledge profile installs the knowledge tooling, the gate and six skills (sf-lookup, sf-capture, sf-audit, sf-upgrade, sf-migrate, sf-interview) and the `scout` subagent, with no `openspec/` and no openspec binary. A new gate rule G19 keeps knowledge in step with code. Decided by the maintainer on 2026-11-09 (brief questions Q1 to Q9 of change `add-knowledge-profile`; Q1 to Q4 answered by the user, Q5 to Q9 delegated).

# Why

An infrastructure monorepo such as iac has no behavior to spec, yet today Specfold installs `openspec/`, needs the openspec CLI and blocks every source change that lacks an OpenSpec change (G4). Without changes there is no archive and sync to keep concepts current, so the knowledge profile asks that a diff touching `source_globs` also changes something under `knowledge/`, or carries the `no-knowledge` label with a reason ([blocking merge gate](/decisions/blocking-merge-gate.md)). A repository can later set `profile: full` and run an upgrade; the other direction is refused for now, because removing installed OpenSpec files, specs and changes needs its own design.

# Rejected alternatives

- **A `specs: false` boolean:** cannot grow a third profile.
- **Folding the name into `profile_version`:** a breaking schema change the upgrade would have to migrate.
- **One template payload per profile:** see [one template payload per profile](/decisions/template-payload-per-profile.md).
- **Profile sections inside one file with extra markers:** the markers would leak into user repositories and complicate the three-way merge, so the variants are separate files under `.specfold/profiles/knowledge/` ([managed blocks](/decisions/managed-blocks.md)).
- **Reusing `G4` with another message:** findings, docs and escape lines would mean different things per profile; G19 gets its own id and shares G4's code.
- **Per-file profile tags in the template manifest:** more moving parts than one filter for a two-value split.

# Related

- [specfold profile](/capabilities/specfold-profile.md)
- [Upgrade file classes](/decisions/upgrade-file-classes.md)
- [Where Specfold is heading](/vision/specfold.md)
- [Specs versus knowledge](/decisions/specs-vs-knowledge.md)
