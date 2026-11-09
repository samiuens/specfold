---
type: Capability
title: specfold init
description: Why a repository made from the template needs init, and how it fills detected values and sets up OpenSpec, markers and the manifest without prompts.
status: draft
spec: openspec/specs/specfold-init/spec.md
resource: ../../openspec/specs/specfold-init/spec.md
change: 2026-11-09-add-knowledge-profile
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:00:29+01:00 }
sources:
  - id: proposal-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/proposal.md
  - id: design-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/design.md
  - id: proposal-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/proposal.md
  - id: design-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/design.md
  - id: proposal-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/proposal.md
  - id: design-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/design.md
  - id: proposal-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/proposal.md
  - id: design-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/design.md
  - id: proposal-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/proposal.md
  - id: design-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/design.md
  - id: proposal-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/proposal.md
  - id: design-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/design.md
  - id: proposal-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/proposal.md
  - id: design-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/design.md
---

# Why

A repository made with "Use this template" holds every kit file but still has placeholders: no stack in the OpenSpec context, the template's `src/**` as source globs, no OpenSpec skills, no skill links for those, no git hooks and no markers around the kit's text in `AGENTS.md` and the other shared files. `specfold init` finishes that setup in one command, so the template path ends in the same state as a migration ([delivery](/decisions/delivery-template-bootstrap-migrate.md)). It asks nothing: agents ask the user and pass flags, which keeps the command deterministic ([deterministic CLI](/decisions/deterministic-cli.md)).

# Choices made while specifying and building

- **Detected, then overridable.** Stack and source globs come from the same detection as `migrate inventory`; `--stack`, `--source-glob` and `--tools` win, and each value is printed with where it came from (detected, flag, kept, fallback).
- **Earlier values stay.** A filled `Stack:` line and source globs other than the template's `src/**` are kept on a rerun unless a flag sets them again, so init is idempotent and a second run reports "everything is up to date".
- **The template ships its manifest.** `template/.specfold/manifest.json` is what an install into an empty repository records, kept current by a vitest file snapshot. Init compares the shared files against its block hashes: an untouched file gets the [managed block](/decisions/managed-blocks.md) markers around its whole text, an edited one is reported as skipped and left out of the manifest, so an upgrade never treats the user's text as kit text. Its file hashes stay as the upgrade base.
- **OpenSpec only when missing.** `openspec init` runs only while the OpenSpec skills are absent; it keeps the template's `config.yaml` (checked with 1.15.0), and init restores the file anyway if a run changed it.
- **Never stops halfway on a known issue.** A foreign `core.hooksPath` or an edited block file is reported as skipped with exit 0; only a repository without the template files or a missing OpenSpec is exit 2, before any write.
- **A default subagent limit.** Init sets the personal limit to 3 when none exists, or to `--max-subagents`; a limit someone already set stays ([specfold parallel](/capabilities/specfold-parallel.md)).
- **`--dry-run` writes nothing** and lists the values and every step it would take.
- **Upgrade PRs are opt-in.** `--upgrade-workflow` copies the inactive `.specfold/workflows/specfold-upgrade.yml` to `.github/workflows/`, records it in the manifest so upgrades keep it current, and prints the `SPECFOLD_TOKEN` setup. A plain template copy never runs it ([turn on upgrade PRs](/runbooks/turn-on-upgrade-prs.md)).
- **Required gate is opt-in, and a refusal doesn't fail init.** `--require-gate` runs the step of `gate require` after setup. Without admin rights or rulesets, the repository is still set up; only the GitHub setting is missing. So init reports the step as skipped, prints the manual steps and exits 0. `--dry-run` lists the step without asking GitHub anything.
- **Permissions rendered.** Init runs `permissions sync` after `agents sync`, and `--dry-run` lists it. The template already ships the rendered default rules, so a fresh repository usually has nothing to change; an invalid `permissions` setting is reported as skipped ([specfold permissions sync](/capabilities/specfold-permissions.md), change `add-agent-permissions`).
- **Workspace-aware globs.** Source globs come from `package.json` `workspaces` and `pnpm-workspace.yaml` (`<pattern>/src/**`, negations skipped) before the fixed folder list, which now includes `apps`.
- **A profile at init.** `--profile knowledge` skips `openspec init` and the `config.yaml` requirement, and removes the template's OpenSpec files that are still unchanged, comparing manifest hashes (and `leftovers.json` for files without one, such as `openspec/config.yaml`); edited ones are kept and reported. A repository counts as already set up once the OpenSpec skills from `openspec init` exist, because the template's own manifest records `profile: full` and cannot tell a fresh template from a finished full init. Switching a full repository to `knowledge` is refused ([a knowledge-only profile](/decisions/knowledge-profile.md)).

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [Cut a release](/runbooks/cut-a-release.md)
- [specfold profile](/capabilities/specfold-profile.md)
