# Proposal

## Why

Skills only help when agents know the ground rules: where knowledge and specs live, what goes where, which order to look things up in, and that they must ask instead of assume. `AGENTS.md` is read by most tools every session, so it stays short and stable (`docs/plan.md`, "Agent layer" and "Token efficiency"); `CLAUDE.md` imports it (`/references/claude-code.md`).

## What Changes

- `template/AGENTS.md` (target under 120 lines, no volatile text):
  1. rather ask than assume
  2. map
  3. core rule
  4. lookup order
  5. workflow with command names per tool
  6. when OpenSpec is not needed
  7. knowledge rules, linking `/conventions/code-comments.md`
- `template/CLAUDE.md`: `@AGENTS.md` plus slash commands, the planner (`claude --agent planner`), skills location and the native question and plan-approval tools.
- `examples/sample-app` gets both files (CI copy check), and a second sample change is planned with the planner in Claude Code and checked in opencode.

## Capabilities

### New Capabilities
- none (`skip_specs: true`)

### Modified Capabilities
- none

## Out of scope

- Hooks and permissions (M4, M7).

## Confirmed in review

Confirmed by the maintainer on 2026-10-26, point by point:

1. **The end-to-end run in Claude Code is interactive** (native questions, plan approval), so it needs you at the keyboard: I prepare the sample and a short runbook, you run `claude --agent planner` in `examples/sample-app`, and we commit the result. The opencode check I can run myself.

## Impact

- New files under `template/` and `examples/sample-app/`; CI copy check extended.
