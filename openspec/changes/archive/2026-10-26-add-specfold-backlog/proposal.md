# Proposal

## Why

Agents plan better when they see where the project is heading and what it has promised, not only what exists (`/vision/specfold.md`). The profile already lists the types `Vision`, `Deferred Commitment` and `Backlog Item`, but nothing checks their fields, nothing moves an item from idea to change, and nothing notices a promise that is due. This change gives them checked fields, commands, audit rules and a place in lookup and session start.

## What Changes

- Validate rules P12 (backlog items), P13 (deferred commitments) and P14 (vision): the fields (`state`, `priority`, `origin`, `change`, `trigger`, `committed_by`, `vision`, `reason`, `horizon`).
- `specfold new` fills the new keys; for a `Deferred Commitment` it writes `committed_by: human:<login>` only when a human runs it at a terminal.
- `specfold backlog add | list | promote | drop`: `promote` creates the change with `openspec new change`, sets `state: promoted` and `change:`, and prints the next step (sf-interview with the item as seed).
- `specfold commitments list | fulfill | withdraw`: `withdraw --reason` refuses agents like `verify` and adds the human `verified` entry.
- Audit rules A6 (overdue commitment), A7 (commitment without a vision link) and A8 (open backlog item untouched for `audit.backlog_untouched_days`, default 180).
- `specfold lookup` appends a block with the vision concepts and the open commitments matching the query.
- `specfold hook claude-session-start` prints one line with the number of open commitments due within 30 days.

## Capabilities

### New Capabilities
- `specfold-backlog`: backlog item commands.
- `specfold-commitments`: deferred commitment commands.

### Modified Capabilities
- `specfold-validate`: adds P12-P14.
- `specfold-new`: keys for the three types.
- `specfold-audit`: adds A6-A8.
- `specfold-lookup`: the vision and commitments block.
- `specfold-hooks`: the due-commitments line at session start.

## Out of scope

- G17 and the G7 check of `committed_by` (`add-commitment-gate`).
- GitHub Issues sync (`/backlog/github-issues-sync.md`).

## Open points

1. **`committed_by` missing** is a P13 warning, not an error, so agents can draft a commitment that a human then claims; an actor other than `human:<login>` is an error.
2. **Due date:** a commitment's `trigger` counts as a date when it parses as `YYYY-MM-DD` or ISO 8601; a condition such as "before 1.0" is never overdue, and A1 still covers `stale_after`.
3. **Withdrawing** keeps `status` as it is; the human `verified` entry and `reason` are what G17 checks.
4. **`backlog add --origin`** defaults to the actor `specfold new` would write, never to `human`.
5. **Promote** refuses an item whose `state` is not `open`, and exits with 2 when the `openspec` CLI is missing.

## Impact

- New modules `src/backlog/` and `src/commitments/`; P12-P14 in `src/validate/profile.ts`; A6-A8 in `src/audit/rules.ts`.
- Reuses the frontmatter editing of `specfold sync` and the login and agent guard of `specfold verify`.
- `specfold.yaml` gains `audit.backlog_untouched_days` (template and kit, commented).
