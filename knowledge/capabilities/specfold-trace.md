---
type: Capability
title: specfold trace
description: Why scenarios carry stable ids that tests cite, and where the contract for specfold trace lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T17:53:55+01:00 }
---

# Why

Scenarios are the testable part of the behavior contract ([specs vs. knowledge](/decisions/specs-vs-knowledge.md)), but nothing tied them to tests: a scenario could ship untested, and a test could keep naming a scenario that was renamed away. `specfold trace` gives every scenario a stable id, finds the tests that cite it, and reports both gaps; gate rule G15 enforces them on the changes a PR carries ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **One id rule.** An id is the capability folder path plus a slug of the scenario title (`checkout/guest-checkout#guest-pays-without-account`), the same rule `specfold tasks check` uses for task metadata, so task breakdowns and tests name scenarios the same way.
- **Tests opt in by naming the id.** A test cites a scenario with `spec: <id>` in any comment or test name, in any language. Only files matching `trace.test_globs` count; the defaults cover the usual test file names and folders, and the kit narrows them to its own test folder so fixture repositories don't count.
- **Changes count before they are archived.** Scenarios added or modified by an active change are known at once, and scenarios of a requirement a change removes stop counting at once, so a stale reference shows up in the PR that removes the scenario.
- **New work blocks, old gaps warn.** G15 blocks only for scenarios of changes with `tasks.md` that the PR touches or archives; a change still being planned has no tests yet. Uncovered scenarios elsewhere give one warning with their count, so migrated repositories can adopt traceability gradually ([a required CI check blocks merges](/decisions/blocking-merge-gate.md)).
- **Dangling references always block.** A reference to an unknown id is fixed by editing one comment, and no branch that passed the gate has one, so blocking them everywhere costs nothing.
- **The kit's own fixtures stay invisible.** Tests that put a reference into fixture text build the marker from parts, so the kit's scan never reads a fixture's reference as its own.

# Related

- [specfold tasks](/capabilities/specfold-tasks.md)
- [specfold CLI](/architecture/specfold-cli.md)
