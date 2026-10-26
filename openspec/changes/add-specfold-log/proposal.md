# Proposal

## Why

`log.md` records every archived change and migration. Agents editing it by hand break OKF §9: headings that are not dates, wrong order, frontmatter, which `specfold validate` reports as OKF-3. `specfold log add` writes entries in the right place, so `sf-sync` and `sf-migrate` never touch the file directly. See `/references/okf.md`.

## What Changes

- New command `specfold log add [--kind <Kind>] [--date <YYYY-MM-DD>] [--bundle <dir>] <message...>`.
- Writes `* **<Kind>**: <message>` under the `## <date>` heading; the heading is created newest-first if missing, and so is `log.md` itself.

## Capabilities

### New Capabilities
- `specfold-log`: appending dated, OKF-conformant entries to a bundle's `log.md`.

### Modified Capabilities
- none

## Out of scope

- Editing or removing existing entries.
- Generating entries automatically from archives (`specfold sync`, M2).

## Open points for review

1. **Kind:** defaults to `Update`. Any single word starting with an uppercase letter is allowed (for example `Creation`, `Deprecation`, `Migration`), with no fixed list.
2. **Date:** the machine's local date unless `--date` is given.
3. **Position:** an entry goes at the end of its date section.
4. **Whitespace:** line breaks and runs of whitespace in the message collapse to single spaces.

## Impact

- New module in `tools/specfold/src/`.
