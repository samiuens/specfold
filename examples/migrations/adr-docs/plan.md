# Migration plan: orders-service

## Repository

- Default branch: main
- Stack: Node.js
- Layout: single package
- CI: none
- Source globs: src/**
- Agent tools: agents, claude

## Capability domains

- orders: storing and listing customer orders in PostgreSQL
- sessions: how a signed-in customer stays signed in

## Mapping

| Source | Becomes | Target | Note |
| --- | --- | --- | --- |
| README.md | keep | | entry point for humans |
| CONTRIBUTING.md | Convention | knowledge/conventions/contributing.md | tests per endpoint and the ADR habit are rules agents must follow |
| docs/adr/0001-use-postgres.md | Decision | knowledge/decisions/use-postgresql.md | accepted |
| docs/adr/0002-session-tokens.md | Decision | knowledge/decisions/session-tokens-in-local-storage.md | superseded by 0003, so deprecated |
| docs/adr/0003-session-cookies.md | Decision | knowledge/decisions/signed-session-cookies.md | accepted |
| docs/architecture.md | Data Flow | knowledge/architecture/request-flow.md | |
| docs/setup.md | Runbook | knowledge/runbooks/local-setup.md | |

## Seed from code

- Cap: 30 concepts
- From: src/** (no graphify-out/)

## Gate

- This PR is the adoption PR: G4 is skipped, every other rule runs.
- From the next PR on, source changes need an OpenSpec change (G4).

## Open questions

none

## Approval

approved_by: human:samiuens
approved_at: 2026-10-27T12:33:21+01:00
