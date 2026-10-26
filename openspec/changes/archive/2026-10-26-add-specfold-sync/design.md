# Design

## Context

`specfold new` renders concepts from templates, `specfold index` regenerates indexes, `specfold log add` inserts entries, and `checkKnowledge` (with `archived: true`) re-checks an archived delta. Sync combines them.

## Goals / Non-Goals

**Goals:** a pure planning step (ops → actions) separate from writing, so `--dry-run` and the real run share one code path; frontmatter edits that leave everything else untouched.

**Non-Goals:** predicting index content in `--dry-run`: the dry run lists op actions and the log entry, and indexes are regenerated only when writing.

## Decisions

- **Refactor:** `renderConcept` is extracted from the `new` command so sync writes byte-identical stubs, and `localDate` is exported from the `log` command.
- **Module `src/sync/`:**
  - `frontmatter.ts`: set keys and append sources through the `yaml` Document API with `lineWidth: 0`, so untouched keys, flow mappings and comments keep their text
  - `apply.ts`: plan and apply the actions per op
  - `command.ts`: resolving, checking, indexes, log, output
- **Resolving:** archived folders match `^\d{4}-\d{2}-\d{2}-<name>$`; the newest date wins. An argument that already matches the archived pattern is taken as an id.
- **Idempotence** comes from comparing before writing: a key is only set when it differs, a source only added when its resource is missing, the log entry only added when no line names the id, and a file only written when its text changed.
- **Actions** are `{ path, action }` with repository-relative paths and short verbs (`create stub`, `set status: deprecated`, `set spec`, `add source proposal-<id>`, `write index`, `add log entry`).

## Risks / Trade-offs

- [`yaml` may re-quote a key it rewrites] → only rewritten keys can change; tests pin that untouched keys and the body stay byte-identical.
