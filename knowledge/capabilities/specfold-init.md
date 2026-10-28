---
type: Capability
title: specfold init
description: Why a repository made from the template needs init, and how it fills detected values and sets up OpenSpec, markers and the manifest without prompts.
status: draft
spec: openspec/specs/specfold-init/spec.md
resource: ../../openspec/specs/specfold-init/spec.md
change: 2026-10-28-add-specfold-wt
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T08:14:46+01:00 }
sources:
  - id: proposal-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/proposal.md
  - id: design-2026-10-28-add-bootstrap
    resource: ../../openspec/changes/archive/2026-10-28-add-bootstrap/design.md
  - id: proposal-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/proposal.md
  - id: design-2026-10-28-add-specfold-wt
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-wt/design.md
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

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [Move the bootstrap pin](/runbooks/move-bootstrap-pin.md)
