---
type: Decision
title: Kit content in repo-owned files lives in managed blocks
description: Specfold writes its part of AGENTS.md, CLAUDE.md and similar files between specfold markers, the only part upgrades rewrite.
status: draft
decision: accepted
change: 2026-10-27-add-specfold-migrate
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:00:29+01:00 }
sources:
  - id: brief
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/brief.md
    title: "Brief of add-specfold-migrate, decision Q4"
  - id: proposal-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/proposal.md
  - id: design-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/design.md
---

# Decision

When Specfold has to put its content into a file the repository already owns (`AGENTS.md`, `CLAUDE.md`, the PR template, `.gitignore`, `CODEOWNERS`), it writes the template file's text between `specfold:start` and `specfold:end` markers: HTML comments in Markdown, at the top; hash comments elsewhere, at the end. Text outside the markers is never changed, a rerun replaces only the block, and a start marker without an end is reported instead of guessed at.

A repository made from the template gets its markers from `specfold init`: a shared file still equal to the template's text, by the block hash in the template's own manifest, gets the markers around its whole text; an edited one gets none and stays out of the manifest.

An upgrade replaces a block whose content still matches its manifest hash. A block edited inside the markers is merged three ways against the installed release's block, and a block whose markers are gone is reported, not rewritten ([upgrade file classes](/decisions/upgrade-file-classes.md)).

# Why

A team's own instructions must survive the migration word for word, and M9's upgrader needs to know exactly which part of a shared file is Specfold's to rewrite. The block's hash in `.specfold/manifest.json` tells it whether someone edited the block since.

# Rejected alternatives

- Shipping the markers inside the template files: migrate would have to strip them before inserting its own block (rejected while planning `add-bootstrap`).
- Replacing the file with Specfold's and moving the old text into a section below: the team's text would move, and an upgrade could not tell kit text from team text.

# Knowledge profile variant

The blocks of `AGENTS.md`, `CLAUDE.md` and the PR template have a knowledge variant kept under `.specfold/profiles/knowledge/`, chosen by the profile; a missing variant falls back to the full text. Separate files were chosen over extra markers in one file, which would leak into user repositories ([a knowledge-only profile](/decisions/knowledge-profile.md)).

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [Versioning](/decisions/versioning.md)
- [specfold profile](/capabilities/specfold-profile.md)
