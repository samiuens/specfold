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

## Verified before building (2026-10-26)

- **Claude Code agents** (code.claude.com/docs/en/sub-agents):
  - The frontmatter supports `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode` (including `plan`), `maxTurns`, `skills` (preloaded), `effort` and `initialPrompt`.
  - `claude --agent <name>` runs a definition as the main session; it takes the agent's tools and model, and CLAUDE.md still loads.
  - AskUserQuestion is always removed from subagents, and ExitPlanMode unless `permissionMode: plan`.
  - The docs do not say whether `permissionMode: plan` applies under `--agent`. The runbook therefore starts the planner with `claude --agent planner --permission-mode plan`.
- **Claude Code skills** (code.claude.com/docs/en/skills):
  - `.claude/skills/<name>/SKILL.md`, with symlinked skill folders followed.
  - Supporting files are linked from `SKILL.md`.
  - `description` plus `when_to_use` is cut off at 1,536 characters.
- **opencode skills** (opencode.ai/docs/skills):
  - It reads `.agents/skills/`, `.claude/skills/` and `.opencode/skills/`.
  - `name` must match the folder name and `^[a-z0-9]+(-[a-z0-9]+)*$`; `description` is 1–1024 characters.
  - The docs don't say whether symlinked folders work; opencode reads `.agents/skills/` directly anyway.
- **Skills CLI:** running `npx skills` here was blocked by the agent's permission rules (it downloads and executes a package). A kit check script enforces the shared frontmatter rules instead (name matches the folder, description of 1–1024 characters). The `npx skills add ./ --list` check is left to the maintainer.

## Impact

- New files under `template/.agents/skills/`, `template/.claude/`, and their kit copies.
- `.github/workflows/cli.yml` gets the skills copy check.
