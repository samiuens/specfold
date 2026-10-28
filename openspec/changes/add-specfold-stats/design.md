# Design

## Context

- **Config** is read by `loadConfig` (`src/repo.ts`); integer settings go through `positiveInt`, as for `tasks.*` and `audit.*`.
- **The SessionStart hook** is `sessionStart({ config, io })` in `src/hooks/claude.ts`; it prints to an `Io`, so its output can be captured in-process.
- **Gate rules** are `GateRule` functions over `ctx.diff.files` in `src/gate/rules.ts`, registered in `RULES`; G16 is the closest model (a changed-file condition plus a computed check).
- **Estimates elsewhere:** `migrate inventory` already estimates tokens as `ceil(characters / 4)`.
- **Today's sets:** template about 1,760 tokens (`AGENTS.md` 866), kit about 2,600 (`AGENTS.md` 1,184, the largest OpenSpec skill description about 110).

## Goals / Non-Goals

**Goals:** one deterministic number per item that agents, hooks and CI agree on; budgets a repository can change; no warning about text nobody touched.

**Non-Goals:** cost per change (M8); exact tokenization; budgets for the knowledge bundle.

## Decisions

- **Module `src/stats/`:**
  - `stats.ts`: `estimate(text)`, `alwaysLoaded(config)`, `overBudget(set, budget)`, `knowledgeFolders(bundleRoot)`, `estimateFiles(root, paths)`;
  - `command.ts`: the command and its output.
- **Config:** `Config.statsBudget = { agentsMd, total, skillDescription }` from `stats.budget.agents_md`, `.total` and `.skill_description` (defaults 2000, 4000 and 60), each through `positiveInt`.
- **`@` imports:**
  - a token `@<path>` at the start of a line or after whitespace, outside code fences and inline code, whose path contains `.` or `/`, so `@samiuens` or `noreply@anthropic.com` never count;
  - resolved relative to the importing file, followed transitively from `CLAUDE.md` and `AGENTS.md`;
  - each file counted once, in the order first reached;
  - a path outside the repository is ignored.
- **Set items** in this order:
  - `AGENTS.md`, `CLAUDE.md`, then their imports, each as `{ kind: "file", path }`;
  - `openspec/config.yaml` `context` as `{ kind: "context" }`;
  - one `{ kind: "skill", name }` per folder in `.agents/skills/` with a `SKILL.md`, counting `name` plus `description`;
  - `{ kind: "hook" }` for the SessionStart output.

  Missing files count 0 with `missing: true`.
- **Budget check:**
  - `AGENTS.md` against `agents_md`;
  - each skill whose folder does not start with `openspec-` against `skill_description`;
  - the sum against `total`.

  Each overrun is `{ budget, item, tokens, limit }`.
- **Knowledge:** tokens of every file under the bundle root, grouped by top-level folder, plus `(root)` for files at the root (`index.md`, `log.md`).
- **Output:**
  - a heading line saying the numbers are estimates (characters / 4), then one item per line with right-aligned tokens;
  - the knowledge folders;
  - one `over budget:` line per overrun;
  - finally `stats: <total> tokens always loaded, <n> budgets exceeded`;
  - with paths, one line per file and `stats: <total> tokens in <n> files`.
- **G11:** fires when a changed file is `AGENTS.md`, `CLAUDE.md`, an import of either, `openspec/config.yaml`, `.agents/skills/*/SKILL.md` or `.claude/settings.json`. It then reports one `warn` finding per overrun: the item's path (the skill's `SKILL.md` for skills, `null` for the total), with tokens, limit and budget key.
- **Template and kit settings:** `stats.budget` with the three defaults and a comment in `template/specfold.yaml`, the kit's `specfold.yaml` and the sample app's.
- **`sf-migrate`:** step 8 adds `node scripts/specfold.mjs stats`. `references/report.md` gets a line `- Always loaded: <n> tokens (estimate); budgets exceeded: <none or list>` under Result.

## Risks / Trade-offs

- [Characters / 4 undercounts code-heavy text and overcounts prose] → the output says "estimate", and budgets have headroom over today's sets.
- [Running the hook in-process imports the gate module from stats, which G11 imports back] → the cycle only involves functions called at runtime, never top-level values; a test runs G11 through the gate.

## Commitments

none
