# Proposal

## Why

Parallel work follows OpenSpec's boundaries: one change per worktree, and inside a change only task groups with disjoint files run at once ([task breakdown](/decisions/task-breakdown.md)). Claude Code creates worktrees for sessions and subagents, but by default from the remote default branch, so an implementer would not see the change's own commits. And it knows nothing about dependencies, test ports or which changes collide. Other tools have no worktree support at all ([tool-neutral first](/decisions/tool-neutral-first.md)). How many subagents may run at once depends on each person's subscription, so it has to be a personal setting, not a team one.

## What Changes

- **`specfold wt`**, for every tool:
  - **`plan`** reads the active changes, finds pairs that share a capability or whose task groups own overlapping files, and prints batches that may run in parallel, none larger than the subagent limit;
  - **`new <change>`** creates `.claude/worktrees/<change>/` on a branch named after the change, copies the files `.worktreeinclude` names, and runs setup there;
  - **`setup`** installs dependencies from the lockfile with the package manager's shared cache, and writes the worktree's index (main checkout 0) to `.specfold/wt-index` for test configs to derive ports and database names from;
  - **`clean`** removes worktrees under `.claude/worktrees/` that are clean and whose branch is merged.
- **`specfold parallel`:**
  - **`set <n>`** writes the personal subagent limit to `.claude/settings.local.json` (`env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) and to `.specfold/local.yaml` (`parallel.max_subagents`), both ignored by git; `set 1` means one group at a time;
  - **`show`** prints the value and where it comes from.
- **`specfold init --max-subagents <n>`** (default 3) sets the limit when none is set yet. `sf-migrate` and the template README tell the agent to ask the user once and pass the number.
- **Template settings and files:**
  - `worktree.baseRef: "head"` in `.claude/settings.json`;
  - `.worktreeinclude` with `.env`, `.env.*`, `.specfold/local.yaml` and `graphify-out/`;
  - `.gitattributes` with `knowledge/log.md merge=union`;
  - `.gitignore` gains `.claude/settings.local.json` and `.specfold/wt-index`;
  - `.worktreeinclude` and `.gitattributes` become managed blocks.
- **`migrate install`** adds the template's settings keys a repository lacks (such as `worktree`) and missing `env` entries.

## Capabilities

### New Capabilities
- `specfold-wt`: the worktree commands.
- `specfold-parallel`: the personal subagent limit.

### Modified Capabilities
- `specfold-init`: `--max-subagents`.
- `specfold-migrate`: two more managed-block files; the settings merge adds missing top-level keys and `env` entries.

## Out of scope

- Agent definitions, `sf-apply` and task packets (`add-subagent-roles`).
- The proof run (`add-pattern-2-run`).
- Cost per change in `specfold stats` (backlog item `cost-per-change-in-stats`).

## Open points

1. **Overlap** reuses the tasks check's glob-overlap test (T5) across changes; a change without `tasks.md` counts as overlapping with everything, so it is never batched blindly.
2. **Package managers:** `package-lock.json` → `npm ci --prefer-offline`, `pnpm-lock.yaml` → `pnpm install --frozen-lockfile --prefer-offline`, `yarn.lock` → `yarn install --frozen-lockfile`, `bun.lock`/`bun.lockb` → `bun install --frozen-lockfile`; no lockfile installs nothing and says so.
3. **The index** is the worktree's position in `git worktree list --porcelain`, so it needs no shared state.

## Impact

- New modules `src/wt/` and `src/parallel/`; `src/init/`; `src/migrate/install.ts` and `merge.ts`.
- `template/.claude/settings.json`, `template/.worktreeinclude`, `template/.gitattributes`, `template/.gitignore`, the template manifest, `template/README.md`, `sf-migrate`.
- Capability cards for wt and parallel, the init and migrate cards, the CLI architecture.
