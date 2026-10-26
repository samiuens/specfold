# Design

## Context

Skills are Markdown read by agents; the CLI they call is specified elsewhere. Claude Code, opencode and the skills CLI share one frontmatter core: `name` (the folder name, kebab-case) and `description` (at most 1024 characters for opencode).

## Goals / Non-Goals

**Goals:** short `SKILL.md` files (trigger, steps, rules), with details in `references/`. Every deterministic step calls `specfold`; skills never re-implement a check.

**Non-Goals:** M8 roles and task packets; Claude Code hooks (M4).

## Decisions

- **Layout:** `template/.agents/skills/sf-<name>/SKILL.md` plus `references/*.md`; `template/.claude/agents/planner.md`; `template/.claude/skills/` holds only links made by `specfold agents sync`.
- **Kit copy:** `.agents/skills/sf-*` and `.claude/agents/planner.md` are byte-identical copies, checked in CI like the schema; `agents sync --check` runs in the kit and the template.
- **Frontmatter check:** `scripts/check-skills.mjs` (kit only) checks every `SKILL.md` in the given folders. `name` must equal the folder name and match `^[a-z0-9]+(-[a-z0-9]+)*$`, `description` must have 1-1024 characters, and every relative link must point to an existing file.
- **Planner:**
  - `model: opus`, `effort: high`, `permissionMode: plan`, `skills: [sf-interview, sf-lookup]`.
  - Tools: Read, Grep, Glob, Bash, Write, Edit, AskUserQuestion, ExitPlanMode.
  - Writes are limited to `openspec/changes/**` by instruction, because `tools` cannot scope paths.
  - Started with `--permission-mode plan` as well, until the frontmatter's effect under `--agent` is proven.

## Risks / Trade-offs

- [opencode lists a skill from both `.agents/skills/` and the `.claude/skills/` link] → it is the same name and file; the M3 opencode run shows whether this causes duplicates, and if so the template drops `.claude/skills` for opencode users via `agents.targets`.
