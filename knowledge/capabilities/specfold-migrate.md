---
type: Capability
title: specfold migrate
description: Why the mechanical steps of a migration are CLI code, and how install brings in the kit without overwriting a repository's own files.
status: draft
spec: openspec/specs/specfold-migrate/spec.md
resource: ../../openspec/specs/specfold-migrate/spec.md
change: 2026-10-27-add-sf-migrate-skill
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-27T12:25:39+01:00 }
sources:
  - id: proposal-2026-10-27-add-specfold-migrate
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/proposal.md
  - id: design-2026-10-27-add-specfold-migrate
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/design.md
  - id: proposal-2026-10-27-add-sf-migrate-skill
    resource: ../../openspec/changes/archive/2026-10-27-add-sf-migrate-skill/proposal.md
  - id: design-2026-10-27-add-sf-migrate-skill
    resource: ../../openspec/changes/archive/2026-10-27-add-sf-migrate-skill/design.md
---

# Why

Bringing an existing repository into the kit touches many files at once ([migration on own branch](/decisions/migration-on-own-branch.md)). The parts that must come out the same every time are mechanical: never writing on the default branch, resuming where the last run stopped, finding the docs that already exist, and installing kit files without overwriting the repository's own. `specfold migrate` does them as deterministic code ([deterministic CLI](/decisions/deterministic-cli.md)), so every agent gets the same result and tests can prove the rules. The judgment (what each source becomes, which domains exist) stays with the `sf-migrate` skill and the user's approval of its plan.

# Choices made while specifying and building

- **Runs before Specfold exists.** The command works from the git root without `specfold.yaml`; only `install` creates it.
- **One branch, refusals first.** `start` refuses a dirty tree, a detached HEAD and every branch except the default branch and `specfold/migration`; `inventory`, `install` and `mark` refuse off `specfold/migration`. All refusals happen before the first write, and nothing is ever pushed.
- **Resumable without guessing.** `.specfold/migration/state.json` records each step with the time of its first run; the CLI records `start`, `inventory` and `install`, and `migrate mark` records the steps only the skill can judge (plan approval, convert, seed, report). The file stays out of git through the template's `.gitignore`.
- **Default branch from git, not from a guess.** `origin/HEAD` wins; without a remote, `main` or `master` count only when exactly one exists, otherwise `--default-branch` is required.
- **Inventory reads tracked files only.** `git ls-files` keeps ignored and generated files out; kinds follow a fixed first-match order (agent rules, spec tools, ADRs, wiki, README, CONTRIBUTING, docs), and tokens are estimated as characters / 4 until `specfold stats` arrives in M7.
- **Never overwrite.** Kit-owned files that are missing get written, identical ones skipped, differing ones reported as conflicts (exit 1) while the rest installs. Files the repository owns get a [managed block](/decisions/managed-blocks.md), Claude Code settings get Specfold's hooks merged into their JSON, and an existing `openspec/` keeps its context, rules, specs and active changes while `specfold` becomes the default schema for new changes.
- **A rerun is silent.** Every write compares first, and the YAML merge only reserializes after a real edit, because the `yaml` library reformats a file it rewrites (found while building).
- **The upgrader gets a base.** `.specfold/manifest.json` records a SHA-256 per kit-owned file and per managed block, the template's `kit_version` and the snapshot ref, with no timestamps, for M9's three-way upgrade.
- **The migration PR passes G4.** The gate treats a branch whose merge base has no `specfold.yaml` as an adoption PR ([specfold gate](/capabilities/specfold-gate.md)).
- **A conflict keeps its base.** When a kit file or block is in conflict on a later install, its manifest entry keeps the hash it was installed with, so the upgrader still knows the base (found in the first recorded run).
- **Next steps are passed on.** A hook manager's own step, such as `lefthook install`, appears after the summary as `then: ...` (found in the second recorded run).
- **The skill drives it.** `sf-migrate` calls the subcommands in order and does the judgment between them; the recorded runs in `examples/migrations/` show both on the two fixtures.

# Related

- [Delivered as template repo, bootstrap prompt and migration skill](/decisions/delivery-template-bootstrap-migrate.md)
- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [specfold CLI](/architecture/specfold-cli.md)
