# Design

## Context

- **Profile rules** live in `src/validate/profile.ts`; each returns findings with a key's line.
- **`renderConcept`** (`src/new/command.ts`) writes the built-in frontmatter for `specfold new` and for `sync` stubs.
- **`editFrontmatter`** (`src/sync/frontmatter.ts`) edits single keys line by line.
- **`verify`:**
  - the agent guard is a private function in `src/verify/command.ts`;
  - the login lives in `src/verify/login.ts`;
  - `verifyText` always sets `status: stable`.
- **Audit** walks the bundle once (`src/audit/rules.ts`).
- **Lookup** ranks hits whose every query word matches (`src/lookup/search.ts`).
- **The session-start hook** prints the root index sections and the active changes (`src/hooks/claude.ts`).

## Goals / Non-Goals

**Goals:**
- one module that knows the future-facing types (folders, states, due dates) for the commands, audit, lookup and the hook;
- every write goes through line-level frontmatter edits;
- the human guard is the one `verify` uses.

**Non-Goals:** G17 and the G7 extension (`add-commitment-gate`); the skill changes (`add-interview-retro`).

## Decisions

- **Module `src/future/items.ts`:**
  - the folder and type of each kind (`backlog/` with `Backlog Item`, `commitments/` with `Deferred Commitment`);
  - `listItems(bundleRoot, kind)` reads every concept of that type in its folder;
  - `findItem(bundleRoot, kind, arg)` resolves `dark-mode`, `dark-mode.md`, `backlog/dark-mode.md` or `knowledge/backlog/dark-mode.md`; an unknown item is a usage error;
  - `dueDate(trigger)` parses `YYYY-MM-DD` (start of that day, local time) or a full ISO 8601 timestamp; anything else is a condition with no date;
  - `setKeys(abs, keys)` wraps `editFrontmatter`.
- **Concept keys:** `ConceptFields` gains optional `origin` and `committedBy`.
  - `renderConcept` writes `state: open`, `priority: medium` and `origin: <origin ?? by>` for a `Backlog Item`, and `state: open`, `trigger: ""` and `committed_by` (only when given) for a `Deferred Commitment`, all before `generated`.
  - `specfold new` passes `committedBy` only when the guard finds no agent and a login resolves; a missing login just leaves the key out.
  - `sync` stubs never get `committed_by`.
- **Shared guard:** `agentReason()` moves to `src/verify/login.ts` and is exported. `verifyText` gets an option to keep `status`; `commitments withdraw` uses it.
- **P12-P14** are three rule functions next to P11, with findings on the offending key's line. The missing `committed_by` is the only warning.
- **`backlog add`:**
  - the file name is the title in kebab case, and an existing file means exit 1;
  - the actor is the one `new` would write, with `process:specfold-backlog` instead of `process:specfold-new`;
  - indexes are regenerated like `specfold index` does.
- **`backlog promote`:**
  - checks the name (kebab case, no existing `openspec/changes/<name>/`, exit 1) and the item's state;
  - runs `openspec new change <name>` with the binary from `openspecBinary`, where a missing binary or a failure is exit 2 with nothing written;
  - then sets `state` and `change`.
- **Output:**
  - `list` prints aligned columns and, with `--json`, `{"items": [...]}` holding path, title, state and the type's keys;
  - writes print one line per changed file, plus the next step for `promote`.
- **Audit:** A6 and A7 come from `listItems(commitments)`. A8 uses `git log -1 --format=%cI` per open backlog item and is skipped outside a git repository. `audit.backlog_untouched_days` becomes `Config.backlogUntouchedDays` (default 180).
- **Lookup context:** `contextConcepts(bundleRoot, query, exclude)` in `search.ts` returns every `Vision` and every open `Deferred Commitment` where at least one query word prefix-matches a frontmatter word, as entries of the result shape without `score`. The command adds the drift flag to them too, and prints the block after the results, or after `no matches`.
- **Session start:** one line `Commitments due within 30 days: <n> (specfold commitments list)` before the 40-line cut, only when `n > 0`.

## Risks / Trade-offs

- [A `sync` stub of a `Deferred Commitment` has an empty `trigger` and fails P13 until filled] → intended: a promise without a trigger is not finished; the agent fills it in the same PR.
- [Override templates in `.agents/skills/sf-capture/templates/` skip the new keys] → same as for `Decision` today; the profile rules catch a template that forgets them.
- [`specfold new` calls `gh api user` for commitments at a terminal] → only for that type, with the 10-second timeout `verify` already uses.

## Commitments

none
