# Proposal

## Why

The CLI does the deterministic work, but agents still need to know when to call it and what to write around it. Short skills in `.agents/skills/` give every tool the same workflow (`docs/plan.md`, "Agent layer"), and the planning interview turns "rather ask than assume" into a repeatable procedure that ends with a confirmed brief (`/decisions/rather-ask-than-assume.md`).

## What Changes

- Skills in `template/.agents/skills/`, each a short `SKILL.md` with details in `references/`:
  - `sf-lookup`: `specfold lookup`, read the 1-3 best concepts, report trust and staleness.
  - `sf-capture`: `specfold new`, write the body and `sources`, `specfold validate`; a rejected proposal becomes a Decision with `decision: rejected`.
  - `sf-sync`: after archive, `specfold sync`, write bodies for stubs, `specfold validate`.
  - `sf-audit`: `specfold audit --json`, propose fixes as one change or PR.
  - `sf-interview`: ground first, build the design tree, ask in rounds with the native question UI, never treat a timeout as consent, record decisions, write `brief.md` only after approval.
  - `sf-plan`: the planner's instructions for tools without agent definitions.
- `template/.claude/agents/planner.md`: the planner role, in plan mode for the interview, approval through the tool's plan approval, then writing `brief.md` and the change artifacts.
- `agents.targets` links in the template (`.claude/skills/` via `specfold agents sync`).
- The kit repo gets the same skills as a CI-checked copy, linked into its `.claude/skills/`.

## Capabilities

### New Capabilities
- none (`skip_specs: true`: instructions for agents; the CLI behavior they call is specified elsewhere)

### Modified Capabilities
- none

## Out of scope

- Template `AGENTS.md` and `CLAUDE.md` (`add-agent-instructions`).
- Roles other than the planner (M8).

## Verify before building

- That `npx skills add samiuens/specfold --list` finds the sf-* skills in the kit's `.agents/skills/` (skills CLI compatibility, decided 2026-10-26), and that every `SKILL.md` has the `name` and `description` frontmatter it requires.

- The current Claude Code subagent frontmatter keys (`permissionMode`, `skills`, `model`, `tools`, `maxTurns`) and how `claude --agent` starts a main-session agent.
- The current `SKILL.md` frontmatter (`name`, `description`) for Claude Code and opencode, and where opencode reads skills.

## Impact

- New files under `template/.agents/skills/`, `template/.claude/`, and their kit copies.
- `.github/workflows/cli.yml` gets the skills copy check.
