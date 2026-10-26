# Design

## Context

`specfold tasks check` already defines the finding shape with `file`, `group` and `task` (`src/tasks/rules.ts`) and resolves change folders (`changeDir` in `src/tasks/command.ts`). The profile already has an ISO 8601 offset check (`src/validate/profile.ts`).

## Goals / Non-Goals

**Goals:** brief and knowledge rules as plain functions over one change folder, so `specfold sync` can reuse the knowledge rules on an archived change.

**Non-Goals:** checking the meaning of the brief or the delta; editing either file.

## Decisions

- **Module `src/change/`:** `brief.ts` (B0-B4), `knowledge.ts` (K0-K6, with an `archived` option for sync), `command.ts` (`change check`, combining both with `checkChangeTasks`).
- **One finding shape** for all three rule sets: the tasks finding type, with `group` and `task` set to `null` outside tasks.
- **Markdown sections** are split at level-2 headings; HTML comments are removed first, so template placeholders count as empty.
- **Op line numbers** come from the YAML document's source ranges, offset by the fence's line, so each K finding points at its op.
- **Concept types** for K4 are read with the existing frontmatter parser from `knowledge/<path>`.
- **`isTimestamp`** in `profile.ts` is exported and reused for `confirmed_at`.

## Risks / Trade-offs

- [Markdown parsing by headings is loose] → the templates fix the headings, and every deviation is reported, never guessed.
