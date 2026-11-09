---
type: Deferred Commitment
title: Migrate a repository that already has an OKF bundle
description: sf-migrate gets a path for repositories whose knowledge/ already holds an OKF bundle, found in the first real migration.
status: draft
state: fulfilled
trigger: "before Specfold migrates another repository that already has an OKF bundle in knowledge/"
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:58:22+01:00 }
---

# Commitment

The first real migration (on v0.2.1) brought in a repository whose `knowledge/` already was a valid OKF v0.2 bundle with its own types, hand-written indexes and tooling. sf-migrate assumes the docs live outside `knowledge/`, so most of that run went beyond the skill. The path to build:

- an inventory kind for OKF concepts, keyed by their `type`, and plan rows for existing knowledge tooling (skills, validators, hook steps) and rule files under `.agents/skills/`;
- every type from `specfold.yaml` allowed in the plan template, plus an optional "After conversion" section (delete originals, rewrite references, remove old tooling);
- replacing the originals, with `sources` as permalinks to the migration's base commit and conversion that keeps full rationale (built as the default rather than an opt-in);
- broken links to planned targets and the hooks' findings in files the plan deletes treated as expected while a migration is active;
- the plan checkpoint asking which Deferred Commitments the user stands behind, so P13 can pass;
- a "Deviations" section in the report template, and one rule for a team's AGENTS.md rules in `conversion.md` and `plan.md`.

The knowledge profile ([a knowledge-only profile](/decisions/knowledge-profile.md)) gives this path a target: the follow-up migration can install it, as iac will need, since that repository has an OKF bundle and no specs.

Fulfilled by change `add-okf-bundle-migration` (2026-11-09): the inventory lists an existing bundle's concepts by type, install takes its types and folders into `specfold.yaml`, the hooks relieve expected findings while the conversion runs, and `sf-migrate` carries the plan, conversion and report parts ([a migration rewrites an existing OKF bundle](/decisions/existing-bundle-migration.md)).

# Trigger

Before Specfold migrates another repository that already has an OKF bundle in `knowledge/`.

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [specfold profile](/capabilities/specfold-profile.md)
- [Rewrite old decision references in code](/backlog/rewrite-old-decision-references-in-code.md)
- [A migration rewrites an existing OKF bundle](/decisions/existing-bundle-migration.md)
