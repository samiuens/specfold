---
type: Capability
title: specfold migrate
description: Why the mechanical steps of a migration are CLI code, and how install brings in the kit without overwriting a repository's own files.
status: draft
spec: openspec/specs/specfold-migrate/spec.md
resource: ../../openspec/specs/specfold-migrate/spec.md
change: 2026-11-02-fix-migration-findings
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
  - id: proposal-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/proposal.md
  - id: design-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/design.md
  - id: proposal-2026-10-28-add-token-recipes
    resource: ../../openspec/changes/archive/2026-10-28-add-token-recipes/proposal.md
  - id: design-2026-10-28-add-token-recipes
    resource: ../../openspec/changes/archive/2026-10-28-add-token-recipes/design.md
  - id: proposal-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/proposal.md
  - id: design-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/design.md
  - id: proposal-2026-10-28-fix-upgrade-follow-ups
    resource: ../../openspec/changes/archive/2026-10-28-fix-upgrade-follow-ups/proposal.md
  - id: proposal-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/proposal.md
  - id: design-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/design.md
  - id: proposal-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/proposal.md
  - id: design-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/design.md
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
- **Settings grow without overwriting.** The merge also adds each template settings key a repository lacks (such as `worktree.baseRef`) and each `env` variable not yet set; a value already there wins. `.gitattributes` and `.worktreeinclude` are managed blocks like `.gitignore`.
- **Read barriers arrive with the settings.** The settings merge also appends each of the template's `permissions.deny` rules that a repository's `.claude/settings.json` lacks, after its own; the list holds only generated files (lockfiles, `node_modules`, coverage, snapshots, minified and map files, the graph), because a Read deny rule also blocks editing the path.
- **A rerun is silent.** Every write compares first, and the YAML merge only reserializes after a real edit, because the `yaml` library reformats a file it rewrites (found while building).
- **The upgrader gets a base.** `.specfold/manifest.json` records a SHA-256 per kit-owned file and per managed block, the template's `kit_version` and the snapshot ref, with no timestamps, for M9's three-way upgrade.
- **The migration PR passes G4.** The gate treats a branch whose merge base has no `specfold.yaml` as an adoption PR ([specfold gate](/capabilities/specfold-gate.md)).
- **A conflict keeps its base.** When a kit file or block is in conflict on a later install, its manifest entry keeps the hash it was installed with, so the upgrader still knows the base (found in the first recorded run).
- **Next steps are passed on.** A hook manager's own step, such as `lefthook install`, appears after the summary as `then: ...` (found in the second recorded run).
- **The way in is `BOOTSTRAP.md`.** It fetches a pinned kit snapshot and hands the agent `sf-migrate` from the snapshot; a repository made from the template uses [specfold init](/capabilities/specfold-init.md) instead.
- **YAML rewrites keep long lines.** The OpenSpec config merge re-serializes the file only after a real edit, and then without folding: the `yaml` library would fold long lines at 80 characters by default, so every YAML rewrite in the CLI writes without folding (found in the sample app's upgrade to rc.2).
- **Upgrade PRs are opt-in here too.** `install --upgrade-workflow` turns on the weekly workflow like init does, and `sf-migrate` asks about it before install. A later install without the flag keeps a workflow that was turned on ([turn on upgrade PRs](/runbooks/turn-on-upgrade-prs.md)).
- **The skill drives it.** `sf-migrate` calls the subcommands in order and does the judgment between them; the recorded runs in `examples/migrations/` show both on the two fixtures.
- **State stays out of git.** `migrate start` writes `.specfold/migration/.gitignore` listing `state.json`. The CLAUDE.md managed block leaves out its `@AGENTS.md` import when the text outside the markers already has one.

# Related

- [Delivered as template repo, bootstrap prompt and migration skill](/decisions/delivery-template-bootstrap-migrate.md)
- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [specfold CLI](/architecture/specfold-cli.md)
