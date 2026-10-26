# Design

## Context

`AGENTS.md` is read every session by most tools, so it stays short (under 120 lines) and stable, with no dates or counters, so the prompt prefix stays cacheable. Claude Code reads `AGENTS.md` only through `@AGENTS.md` in `CLAUDE.md` (`/references/claude-code.md`).

## Decisions

- **Template files:** `AGENTS.md`, `CLAUDE.md` and `scripts/specfold.mjs`. The bundle is a byte-identical copy of the kit's, checked in CI.
- **Sample app:** gets the instruction files, the bundle, the sf skills, the planner and their links, all as CI-checked copies of `template/`. Kit-owned files are compared, user-owned ones (`specfold.yaml`, `knowledge/`, `openspec/config.yaml`) are not.
- **Runbook** (in the sample's README):
  1. Copy `examples/sample-app` to a temporary folder and run `git init`.
  2. Put the kit's pinned OpenSpec on `PATH`.
  3. Run `claude --agent planner --permission-mode plan`, then copy the new change folder back.

  A second section covers the opencode check.
- **Scope of the end-to-end check:** planning, from interview to plan approval to a brief and artifacts that pass `change check` and `openspec validate --strict`. Apply is covered by the M2 sample change.

## Risks / Trade-offs

- [The interactive check depends on the maintainer] → the change stays open until the run is done; its result is committed as the second sample change.
