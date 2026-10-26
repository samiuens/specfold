# Design

## Context

`log.md` has been edited by hand so far, and `specfold validate` (rule OKF-3) only reports mistakes after the fact. The CLI core (argument parsing, command registry, bundle-root resolution) already exists from `validate` and `index`.

## Goals / Non-Goals

**Goals:**
- `specfold log add` as specified, editing `log.md` with minimal changes, so diffs show exactly one entry.
- The kit's own log entries are written with the command from now on.

**Non-Goals:**
- Editing or deleting entries.
- Writing entries automatically from archives (`specfold sync`, M2).

## Decisions

**Confirmed open points:**
- The kind defaults to `Update`; any capitalized single word is allowed.
- The date is the machine's local date unless `--date` is given.
- An entry goes at the end of its date section.
- Whitespace in the message collapses to single spaces.

**Command shape:** `log` is a command group whose first positional argument is the subcommand. `add` is the only one for now; anything else is a usage error. That leaves room for `log list` later without breaking the interface.

**Insertion:**
- The file is handled as lines. Only `## YYYY-MM-DD` headings with valid dates count as date sections; other content is left exactly as it is.
- **Existing date:** the entry goes after the last non-empty line of that section.
- **New date:** a new section goes directly before the first older date heading. If there is none, it goes at the end of the file, after one blank line.
- The file ends with exactly one newline.

**Configuration:** the command resolves the bundle root like `validate` and `index`, but never reads `specfold.yaml`.

**Module:** `tools/specfold/src/log/command.ts`, registered in `src/commands.ts`.

## Risks / Trade-offs

- A hand-written log whose dates are out of order can produce an unexpected insertion point. `specfold validate` reports such logs (OKF-3), and `log add` does not try to repair them.
