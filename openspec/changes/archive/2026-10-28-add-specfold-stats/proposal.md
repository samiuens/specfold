# Proposal

## Why

Every agent session starts by loading `AGENTS.md`, `CLAUDE.md`, the OpenSpec context, every skill's description and the SessionStart hook's output, before it reads a single file. That set grows quietly with each rule and skill, and nobody sees it until sessions get slow and expensive. The plan's token layer (M7) keeps it small by design ([deterministic CLI](/decisions/deterministic-cli.md)); `specfold stats` makes it visible and gate rule G11 warns when a PR grows it past a budget.

## What Changes

- **`specfold stats [<path>...] [--json]`:**
  - estimates tokens as characters / 4;
  - by default reports the always-loaded set per item and in total against the budgets, plus the knowledge bundle per folder;
  - with paths, estimates those files instead;
  - exits 1 when a budget is exceeded.
- **The set:** `AGENTS.md`, `CLAUDE.md` with the files it imports with `@`, the `context` of `openspec/config.yaml`, each skill's name and description in `.agents/skills/`, and the output of `specfold hook claude-session-start`.
- **`stats.budget` in `specfold.yaml`:** `agents_md: 2000`, `total: 4000`, `skill_description: 60`; the per-skill limit skips `openspec-*` skills, which count only toward the total. The template's `specfold.yaml` gets the block.
- **Gate rule G11:** a warning per exceeded budget, only when the branch changes a file of the set or `.claude/settings.json`.
- **`sf-migrate`:** step 8 runs `specfold stats`, and the report template gets the set's total and any overrun.

## Capabilities

### New Capabilities
- `specfold-stats`: the stats command and its budgets.

### Modified Capabilities
- `specfold-gate`: rule G11.

## Out of scope

- Cost per change for the subagent limit (M8).
- graphify, the deny list and the sample-app numbers (`add-token-recipes`).
- An exact tokenizer.

## Open points

1. **`@` imports** are followed transitively from `CLAUDE.md` and `AGENTS.md`, each file counted once, paths relative to the importing file; a missing import is listed with 0 tokens.
2. **The hook's output** is produced in-process, not by spawning Claude Code, so it is exactly what `hook claude-session-start` prints in that repository.
3. **The kit itself** stays within the defaults today (about 2,600 tokens, `AGENTS.md` about 1,200).

## Impact

- New module `src/stats/`, used by `src/gate/rules.ts` for G11.
- `template/specfold.yaml`, the kit's `specfold.yaml`, and `sf-migrate` with its report template.
- Capability card for stats, the gate card and the CLI architecture.
