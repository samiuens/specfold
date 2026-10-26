# Proposal

## Why

A deferred commitment is a promise (`/vision/specfold.md`): designs must not quietly break it, and only a human may take it back. `add-specfold-backlog` gives commitments their fields and commands; this change makes designs state how they treat them and lets the gate hold the line, using the same GitHub check that already guards `verified` and `confirmed_by` (`/decisions/humans-verify-only.md`).

## What Changes

- The `design` template ends with a `## Commitments` section; `config.yaml` gets a `design` rule that asks for it.
- G7 also checks every added `committed_by: human:<login>`.
- New gate rule G17: it warns when a touched change's design marks a commitment `blocked`, links to a missing or no longer open commitment, or lacks the section while open commitments exist; it blocks a change of a commitment to `withdrawn` that does not add a human `verified` entry.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-gate`: G7 covers `committed_by`; adds G17.
- `specfold-schema`: the design template section and the `design` rule.

## Out of scope

- The verifier agent's judgment about contradictions (M8).

## Open points

1. **Only designs of touched changes** are checked, so old designs are never re-judged against commitments made after them.
2. **`none`** is a valid section body; a design that touches no commitment says so explicitly.
3. **The kit** gets the same section in its own schema copy, and the changes of this milestone already write it once this change is archived.

## Impact

- `template/openspec/schemas/specfold/templates/design.md` and `schema.yaml` instruction, `template/openspec/config.yaml` (kit copies follow).
- `src/gate/claims.ts` (G7) and `src/gate/rules.ts` (G17).
