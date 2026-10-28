# Design

## Context

- **Claude Code worktrees** (checked 2026-10-28 with 2.1.310):
  - sessions and subagents create worktrees under `.claude/worktrees/`, from the remote default branch unless `worktree.baseRef` is `"head"`;
  - `.worktreeinclude` copies gitignored files that match it;
  - Claude Code holds a `git worktree lock` on a running agent's worktree;
  - permission approvals go to the main checkout's `.claude/settings.local.json`;
  - `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` defaults to 20.
- **Existing code:**
  - `sharedFiles` and `parseTasks` (`src/tasks/`) decide glob overlap between task groups (T5);
  - `defaultBranch` (`src/migrate/repo.ts`) finds the default branch;
  - `LOCAL_FILE` (`src/verify/login.ts`) is `.specfold/local.yaml`;
  - `mergeSettings` (`src/migrate/merge.ts`) merges hooks and deny rules;
  - `BLOCK_FILES` (`src/migrate/install.ts`) lists the managed-block files.
- **This repository merges by rebase**, so a merged branch's commits are not ancestors of `main`.

## Goals / Non-Goals

**Goals:** nothing is removed or overwritten without proof that it is safe; the limit is personal; every command works the same with or without Claude Code.

**Non-Goals:** agent definitions and `sf-apply` (`add-subagent-roles`); cost per change (backlog); worktrees outside `.claude/worktrees/`.

## Decisions

- **Modules:**
  - `src/parallel/limit.ts` and `src/parallel/command.ts`;
  - `src/wt/plan.ts`, `src/wt/worktrees.ts` (list, new, setup, clean) and `src/wt/command.ts`.
- **Limit:**
  - `readLimit(root)` returns `{ value, source }` from the environment variable, then `.claude/settings.local.json` `env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, then `.specfold/local.yaml` `parallel.max_subagents`, else `{ value: undefined, source: "tool default" }`;
  - `writeLimit(root, n)` updates both files: the JSON with two-space indentation and a trailing newline, the YAML through `parseDocument`, so comments and other keys stay;
  - the env value is a string, as Claude Code's `env` requires.
- **`wt plan`:**
  - active changes are the folders in `openspec/changes/` except `archive`; a change's capabilities are its `specs/<capability>/` folders, and its files are the union of its groups' `files` without the "Knowledge" group, whose `knowledge/**` every change owns; concept edits rarely collide, and indexes are regenerated after each merge (found while building);
  - pairs conflict on a shared capability, on `sharedFiles`, or when either change has no `tasks.md`;
  - batches are built greedily in name order, each change going into the first batch without a conflict and below the limit; with no limit set, Claude Code's default of 20 is used and named in the output.
- **`wt new <change>`:**
  - refuses an unknown change, an existing folder or an existing branch;
  - runs `git worktree add -b <change> .claude/worktrees/<change> HEAD`;
  - copies the gitignored files (`git ls-files --others --ignored --exclude-standard`) that match `.worktreeinclude`:
    - a pattern ending in `/` matches everything below that folder;
    - a pattern without `/` matches the base name at any depth;
    - other patterns are globs from the root;
  - then runs setup with the new folder as its working directory.
- **`wt setup`:**
  - the first lockfile found picks the command: `package-lock.json` → `npm ci --prefer-offline`, `pnpm-lock.yaml` → `pnpm install --frozen-lockfile --prefer-offline`, `yarn.lock` → `yarn install --frozen-lockfile`, `bun.lock` or `bun.lockb` → `bun install --frozen-lockfile`;
  - output streams to stderr;
  - a failing install is an `EnvError` with the command named;
  - the index is the position of the current top level (`git rev-parse --show-toplevel`) in `git worktree list --porcelain`, main checkout 0, written with `writeIfChanged`.
- **`wt clean`:**
  - candidates are the worktrees under `<root>/.claude/worktrees/`;
  - it keeps a worktree with output from `git status --porcelain` ("uncommitted changes"), a locked one ("locked, probably by a running agent"), a detached one ("no branch"), and one whose branch has commits that `git cherry <default> <branch>` marks `+` ("not merged"); `git cherry` also treats rebased commits as merged;
  - otherwise it runs `git worktree remove <path>` without `--force`, then `git branch -D <branch>`, which is safe after the cherry check;
  - exit 1 when anything was kept.
- **Init:** `--max-subagents <n>` (a positive whole number) calls `writeLimit`; without it, `writeLimit(root, 3)` runs only when `readLimit` finds nothing. `--dry-run` reports it as `would set the subagent limit`. The output line is `.claude/settings.local.json: set subagent limit to <n>`.
- **Settings merge:** `mergeSettings` adds each template top-level key the file lacks, except `hooks` and `permissions`, which keep their rules. For `env`, it adds each variable the file lacks and keeps the values that are set.
- **Managed blocks:** `BLOCK_FILES` gains `.gitattributes` and `.worktreeinclude` (hash comments, block at the end).
- **Template:**
  - `.claude/settings.json` gains `"worktree": { "baseRef": "head" }`;
  - `.gitattributes`: a comment line plus `knowledge/log.md merge=union`;
  - `.worktreeinclude`: `.env`, `.env.*`, `.specfold/local.yaml`, `graphify-out/`;
  - `.gitignore` gains `.claude/settings.local.json` and `.specfold/wt-index`;
  - the manifest is regenerated; the kit's and sample app's `.claude/settings.json` stay copies.
- **Agents:** `sf-migrate` step 4 asks the user once for the limit, with a short note on token cost, and runs `node scripts/specfold.mjs parallel set <n>`; the template README names `init --max-subagents` and `parallel set`.

## Risks / Trade-offs

- [`git cherry` misses a branch whose commits were squashed into one] → such a worktree is kept as "not merged", and the user removes it; nothing is lost.
- [`npm ci` deletes `node_modules` before installing] → it runs only in the worktree it is called in, never in the main checkout through `wt new`.

## Commitments

none
