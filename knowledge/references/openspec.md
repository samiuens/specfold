---
type: Reference
title: OpenSpec 1.15
description: How OpenSpec 1.15.0 init, custom schemas, config and archive behave, as tested hands-on on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: customization
    resource: https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md
  - id: cli
    resource: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
  - id: tools
    resource: https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md
  - id: changelog
    resource: https://github.com/Fission-AI/OpenSpec/blob/main/CHANGELOG.md
---

# Summary

Tested with `@fission-ai/openspec` 1.15.0 on Node 24. Node floor is 20.19; 1.15.0 also ships a standalone binary.[^changelog]

# Init

- `openspec init --tools agents,claude --language English` is valid.[^tools]
- `agents` writes skills only: `.agents/skills/openspec-{apply-change,archive-change,explore,propose,sync-specs,update-change}/SKILL.md`, invoked as `/openspec-propose`.
- `claude` writes the same skills to `.claude/skills/` plus `.claude/commands/opsx/*.md` (`/opsx:propose` and so on).
- `--language English` adds an English-only note to `context` in `openspec/config.yaml`.
- Default profile: propose, explore, apply, archive, sync, update. `verify`, `new`, `continue`, `ff`, `bulk-archive` and `onboard` are added with `openspec config profile`.

# Custom schema

- `openspec schema fork spec-driven <name>` (experimental) creates `openspec/schemas/<name>/schema.yaml` and `templates/`. The schema has a top-level `version: 1`, an `artifacts:` list (`id`, `generates`, `description`, `template`, `instruction`, `requires`) and an `apply:` block (`requires`, `tracks`, `instruction`).[^customization]
- `requires` is advisory: `status` shows artifacts as blocked, but `instructions` still renders them with a warning. An artifact counts as done once its file exists. The order of `artifacts:` breaks ties between ready artifacts.
- A custom first artifact (`brief`, `requires: []`) works; `proposal` then shows `blocked by: brief`.
- `openspec validate --strict` ignores custom artifacts.

# Config

- Keys: `schema`, `context`, `rules.<artifact-id>` (custom ids included and injected into `instructions`), `operations.{apply,archive}.guidance` (advisory).
- Unknown keys only warn: `rules.explore` and `operations.explore` are rejected, so explore cannot be pointed at a skill. Explore reads `context` and runs `openspec list`, `show` and `status`.

# Archive

- The CLI `archive` moves the whole change folder, extra files included, to `changes/archive/YYYY-MM-DD-<name>/`. It checks `tasks.md` checkboxes and non-strict delta validation, not schema artifacts.
- The `/opsx:archive` skill checks `openspec status --json` and asks before archiving incomplete artifacts.
- A scenario-drift check aborts archives whose MODIFIED requirements drop scenarios (since 1.7).

# Other

- `openspec show <spec> --type spec --json --no-scenarios` returns requirements without scenarios.[^cli]
- `openspec update` regenerates skills on version bumps (`--dry-run` since 1.15); hand edits to generated skills are overwritten.
- Strict mode fails on requirement texts over 500 characters.
- A change without deltas needs `skip_specs: true` in `.openspec.yaml`.
