---
type: Backlog Item
title: Skills CLI for skill updates
description: Decide in M9 whether specfold upgrade uses the skills CLI (npx skills update) to keep shipped and third-party skills current.
status: draft
state: open
origin: human
priority: medium
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:05:01+01:00 }
sources:
  - id: skills-cli
    resource: https://github.com/vercel-labs/skills
    title: vercel-labs/skills, the CLI behind skills.sh
---

# Idea

The skills CLI behind skills.sh (`npx skills`, npm package `skills`) installs skills from git repositories into `.agents/skills/`. It symlinks them into `.claude/skills/` and other agent folders, and updates them with `npx skills update`. Raised by the maintainer on 2026-10-26.

Decided for M3: Specfold stays compatible. `specfold agents sync` treats links into `.agents/skills/` as its own, whichever tool created them, and the kit's skills are meant to be installable with `npx skills add samiuens/specfold`.

Open for M9: should `specfold upgrade` hand the skills part to `npx skills update`, instead of its own three-way update for kit-owned files? The same question applies to keeping third-party skills current, which nothing in Specfold covers today. To check then: how the CLI detects new versions, whether it keeps a lock file, and how it treats locally modified skills.

# Related

- [Self-hosting](/decisions/self-hosting.md)
