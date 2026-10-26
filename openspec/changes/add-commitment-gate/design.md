# Design

## Context

- **G7** (`src/gate/claims.ts`) finds `human:` claims that a branch adds: in concepts' `verified` and in briefs' `confirmed_by`, compared with the merge-base version of each file.
- **`src/future/items.ts`** lists commitments and their states (from `add-specfold-backlog`).
- **The schema's `design` artifact** has a template and an instruction. `config.yaml` has no `design` rule yet.
- **The kit's schema copy and the sample app's copy** must equal the template's; CI checks both.

## Goals / Non-Goals

**Goals:** a design section that the gate can read without guessing; G17's withdrawal block built on G7's claim detection, so a withdrawal names a real approver.

**Non-Goals:** judging whether a design really keeps a commitment (the verifier in M8); checking designs of changes the branch doesn't touch.

## Decisions

- **Template:** `design.md` ends with `## Commitments`, holding a comment that explains the entry format `- [Title](/commitments/x.md): kept` or `: blocked: <reason>`, and `none`. The `design` instruction gains one paragraph saying the same and pointing to `specfold commitments list`.
- **Config rule:** `rules.design` in the template's `config.yaml` (and the kit's own config): "Look up the open deferred commitments this change touches (`specfold commitments list`, `specfold lookup`) and record each in `## Commitments` as kept or blocked; write `none` when none is touched."
- **G7:** `verifiedClaims` also reads `committed_by` when it is a `human:` string; claims carry the key `committed_by`. The comparison with the merge base is unchanged, so an existing `committed_by` never needs a fresh approval.
- **G17 for designs**, run on every touched active change with a `design.md`:
  - the section runs from `## Commitments` to the next level-2 heading;
  - each list item must hold one bundle-absolute link to a concept (as a Markdown link target or in backticks), followed by `: kept` or `: blocked` with an optional reason;
  - warnings are reported at the item's line for a `blocked` entry, for an entry that is neither, and for a link to a missing concept or to a commitment that isn't open;
  - a missing section is reported at the design file when `listItems(commitments)` holds at least one open commitment;
  - a section body of `none` is valid.
- **G17 for withdrawals:**
  - every changed `Deferred Commitment` whose `state` is `withdrawn` now but not at the merge base (or that is new) blocks;
  - unless `addedClaims` holds a `verified` claim for that file;
  - G7 then checks that claim's login against the PR.
  - `baseVersion` is exported from `claims.ts` for this.

## Risks / Trade-offs

- [A design can mark a commitment `kept` while breaking it] → accepted: the section makes the author state it, the reviewer reads it, and the M8 verifier will judge it.
- [Old designs without the section] → only touched changes are checked, so archived designs never warn.

## Commitments

none
