# Proposal

## Why

Agents writing knowledge by hand get the frontmatter wrong: a missing `status`, a timestamp without offset, a `generated` actor in the wrong shape. `specfold new` creates a concept from a per-type template with the profile's required fields already filled, so `sf-capture` (M3) only writes the body. See `/decisions/deterministic-cli.md` and `/decisions/humans-verify-only.md`.

## What Changes

- New command `specfold new <type> <path> [--title <text>] [--description <text>] [--by <actor>] [--json]`.
- Built-in templates for every default type. A template file at `.agents/skills/sf-capture/templates/<type-kebab>.md` overrides the built-in one, so M3 only adds files.
- Writes `status: draft` and `generated` with the actor and the current time with offset. It refuses `human:` actors.

## Capabilities

### New Capabilities
- `specfold-new`: creating a concept file from a per-type template with profile-conformant frontmatter.

### Modified Capabilities
- none

## Out of scope

- Writing the body content (the `sf-capture` skill).
- Updating indexes: the agent runs `specfold index` afterwards.

## Decisions

Confirmed by the maintainer on 2026-10-26, each point as proposed:

1. **Default actor** when `--by` is missing: `<actors.agent_prefix><SPECFOLD_MODEL>` if the environment variable `SPECFOLD_MODEL` is set, otherwise `process:specfold-new`.
2. **Empty description:** without `--description`, the concept gets `description: ""`, so `specfold validate` fails until it is filled. No placeholder text can slip through.
3. **Type-specific keys:**
   - `Decision` gets `decision: accepted` and an empty `sources: []`, which `validate` reports until filled.
   - `Runbook` and `Interface` get `stale_after` 90 days from now.
4. **An existing file** is never overwritten: exit 1.
5. **Template placeholders** in override files: `{{type}}`, `{{title}}`, `{{description}}`, `{{by}}`, `{{now}}`.

## Impact

- New module and built-in templates in `tools/specfold/src/`.
