# Migration plan: accounts

## Repository

- Default branch: main
- Stack: Node.js, TypeScript
- Layout: single package
- CI: none
- Source globs: src/**
- Agent tools: agents, claude

## Capability domains

- login: signing in with an email address
- sessions: ending a session (planned in the active change add-logout)

## Mapping

| Source | Becomes | Target | Note |
| --- | --- | --- | --- |
| README.md | keep | | entry point for humans |
| AGENTS.md | Business Rule | knowledge/domain/no-email-addresses-in-logs.md | the file stays below the Specfold block; its test rule goes into conventions/unit-tests.md |
| .cursor/rules/style.mdc | Convention | knowledge/conventions/code-style.md | Cursor keeps reading the rule file |
| .cursor/rules/testing.mdc | Convention | knowledge/conventions/unit-tests.md | together with the test rule from AGENTS.md |
| openspec/config.yaml | keep | | install switches the default schema to specfold and keeps context and rules |
| openspec/specs/login/ | Capability | knowledge/capabilities/login.md | existing main spec; the card links it, nothing is converted |
| openspec/changes/add-logout/ | keep | | active change on spec-driven; it finishes on its own schema |

## Seed from code

- Cap: 30 concepts
- From: src/** (no graphify-out/)

## Gate

- This PR is the adoption PR: G4 is skipped, every other rule runs.
- From the next PR on, source changes need an OpenSpec change (G4).
- Hooks go into the existing lefthook.yml; run `lefthook install` after merging.

## Open questions

none

## Approval

approved_by: human:samiuens
approved_at: 2026-10-27T12:37:47+01:00
