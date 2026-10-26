# Proposal

## Why

Skills are canonical in `.agents/skills/` so every tool reading that folder gets them, but Claude Code reads only `.claude/skills/` (`/references/claude-code.md`). Copying by hand drifts. `specfold agents sync` links each skill into the tool folders a repo lists, so one source serves all tools (`/decisions/deterministic-cli.md`).

## What Changes

- New command `specfold agents sync [--check] [--json]`.
- New `specfold.yaml` key `agents.targets` (default `[".claude/skills"]`): folders that receive one relative symlink per skill.
- It creates missing links, repairs links of its own that point to the wrong place, removes links whose skill is gone, and never touches real folders or foreign links (they are reported as kept).
- `--check` writes nothing and exits 1 when anything would change.

## Capabilities

### New Capabilities
- `specfold-agents-sync`: linking `.agents/skills/<name>` into the tool skill folders listed in `agents.targets`.

### Modified Capabilities
- none

## Out of scope

- The skills themselves (`add-sf-skills`).
- Windows symlink support checks in `doctor`.

## Confirmed in review

Confirmed by the maintainer on 2026-10-26, point by point:

1. **What counts as "own" link:** a symlink whose target resolves into `.agents/skills/`. Only those are repaired or removed; any other symlink is foreign and kept.
2. **No `.agents/skills/` folder** means nothing to link: exit 0 with "no skills to link".
3. **A missing target folder** (e.g. `.claude/skills/`) is created.
4. **Link targets are relative** (`../../.agents/skills/<name>`), so clones and worktrees keep working.
5. **Symlink creation failing** (for example missing permissions on Windows) is an environment error (exit 2) with a hint, and the run stops.

## Skills CLI compatibility

Decided on 2026-10-26: Specfold stays compatible with the skills CLI behind skills.sh (`npx skills`, package `skills`), which also installs into `.agents/skills/` and symlinks into `.claude/skills/`. A link it creates into `.agents/skills/` counts as an own link here, so both tools can work on the same repo. Whether the M9 upgrader uses `npx skills update` for skills is decided in M9 (`/backlog/skills-cli-for-skill-updates.md`).

## Impact

- New CLI module and fixtures; `specfold.yaml` (kit and template) gains `agents.targets`.
- Consumers: `add-sf-skills` (kit and template), `specfold init` and `specfold upgrade` later.
