# Proposal

## Why

Agents answer "why and what" questions cheapest from frontmatter: a path and one line per concept, then they read one to three files. Today they grep or read indexes in full. `specfold lookup` is the first step of the lookup order in `AGENTS.md` and the engine behind the `sf-lookup` skill (M3). See `/decisions/deterministic-cli.md`.

## What Changes

- New command `specfold lookup <query...> [--type <type>] [--limit <n>] [--bundle <dir>] [--json]`.
- Case-insensitive word-prefix matching over `title`, `tags`, `description` and `type`, weighted title 3, tags 2, description 1, type 1. Every query word has to match; ties are broken by path.
- Each hit shows its trust tier: `deprecated`, `stale` (`stale_after` passed) or `unverified` (no `verified` entry).

## Capabilities

### New Capabilities
- `specfold-lookup`: frontmatter search over a knowledge bundle with deterministic ranking and trust flags.

### Modified Capabilities
- none

## Out of scope

- Always returning the vision and matching open commitments (M5, with those types).
- The drift flag (`specfold drift`, M5).
- Full-text search of concept bodies: the plan keeps lookup to frontmatter on purpose.

## Open points for review

1. **Prefix matching:** `verif` matches `verified`. Words are split on anything that is not a letter or digit.
2. **Paths** are printed relative to the repository root (`knowledge/decisions/x.md`), so agents can open them directly.
3. **No hits is not an error:** exit 0 with `no matches`. Exit codes stay 0 (ok) and 2 (usage).
4. **Limit:** `--limit` defaults to 10 and takes a positive integer.
5. **No configuration needed:** lookup does not read `specfold.yaml`. It only uses the repository root to find `knowledge/`, or `--bundle`.

## Impact

- New module in `tools/specfold/src/`; reuses the bundle walk and frontmatter parser.
