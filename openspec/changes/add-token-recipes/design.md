# Design

## Context

- **graphify 0.9.97** (checked 2026-10-28 with `uvx --from graphifyy==0.9.97` in a scratch repository):
  - `graphify install --project --platform agents` writes only `.agents/skills/graphify/` (`SKILL.md`, `references/`, `.graphify_version`); `--project` is missing from the top-level help but listed by `graphify install --help`;
  - `graphify install --project --platform claude` also writes a `## graphify` section into `CLAUDE.md` and `.claude/CLAUDE.md`, so it stays unused;
  - its Claude Code guard is two PreToolUse groups: matcher `Bash|Grep` with `graphify hook-guard search`, and matcher `Read|Glob` with `graphify hook-guard read`, each with `timeout: 10`;
  - `graphify extract . --code-only` with `GRAPHIFY_BACKEND=none` writes `graphify-out/graph.json` without any API key; `graphify cluster-only . --no-label` then writes `GRAPH_REPORT.md` and `graph.html` without an LLM;
  - the skill's name plus description is about 91 tokens.
- **Claude Code permissions** (docs checked 2026-10-28):
  - `Read(<pattern>)` uses gitignore syntax; a pattern without a leading slash is relative to the working directory, so nested files need `**/`, and `/path` anchors at the project root for project settings;
  - a Read deny rule also blocks Edit and Write on the same path and applies to `cat`, `head`, `tail` and `sed` in Bash.
- **The settings merge** is `mergeSettings` in `src/migrate/merge.ts`; it adds hook groups by command and keeps every other key.
- **The sample app's `.agents/skills/`** must stay equal to the template's (CI), so graphify cannot be set up there in a commit.

## Goals / Non-Goals

**Goals:** graphify set up with one command and no LLM; nothing that breaks for a teammate without graphify; read barriers that never block editing a source file.

**Non-Goals:** other agents' ignore files (backlog); graphify's semantic pass; committing the graph.

## Decisions

- **Module `src/graphify/`:**
  - `setup.ts`: `setupGraphify(config)`, with every check before the first write;
  - `command.ts`: the command `graphify` with the single subcommand `setup`.
- **Preflight** (exit 2): `graphify --version` fails → "graphify is not installed: install it with `uv tool install graphifyy`, then run setup again". With Claude Code, an existing `.claude/settings.json` that `mergeSettings` reports as a conflict is an error too.
- **Steps, in order:**
  1. **Skill:** `graphify install --project --platform agents` when `.agents/skills/graphify/SKILL.md` is missing, then `planLinks`/`applyLinks` for `agents.targets`.
  2. **`.graphifyignore`** when missing:
     - `knowledge/` and `openspec/`, which Specfold already serves;
     - `.specfold/`, `scripts/specfold.mjs` (the generated bundle) and `graphify-out/`;
     - `node_modules/`, `dist/`, `build/` and `coverage/`.
  3. **Guard**, when `agents.targets` includes `.claude/skills`: the two PreToolUse groups merged through `mergeSettings`. Each command is wrapped as `if command -v graphify >/dev/null 2>&1; then graphify hook-guard <mode>; fi`, so a teammate without graphify gets no hook error, and graphify's own exit status passes through.
  4. **Build**, when `graphify-out/graph.json` is missing: `graphify extract . --code-only`, then `graphify cluster-only . --no-label`, both with `GRAPHIFY_BACKEND=none`. A failing run is an `EnvError` with graphify's last stderr line.
- **Output:** `path: action` lines (`run graphify install`, `link`, `write`, `merge`, `run graphify extract --code-only`), then `graphify setup: N changes` or `graphify setup: everything is up to date`; `--json` gives `{ ok, actions }`.
- **Stats:** the per-skill budget skips folders named `graphify` as well as `openspec-*`.
- **Deny list** in `template/.claude/settings.json` under `permissions.deny`:
  - lockfiles: `Read(**/package-lock.json)`, `Read(**/pnpm-lock.yaml)`, `Read(**/yarn.lock)`, `Read(**/bun.lockb)`, `Read(**/Cargo.lock)`, `Read(**/poetry.lock)`, `Read(**/uv.lock)`, `Read(**/go.sum)`, `Read(**/composer.lock)`, `Read(**/Gemfile.lock)`;
  - generated output: `Read(**/node_modules/**)`, `Read(**/coverage/**)`, `Read(**/__snapshots__/**)`, `Read(**/*.min.js)`, `Read(**/*.map)`;
  - the graph: `Read(/graphify-out/graph.json)` and `Read(/graphify-out/cache/**)`.

  `dist/` and `build/` stay out, because some repositories keep sources there and the rule would block editing them. `GRAPH_REPORT.md` stays readable.
- **Merge:** `mergeSettings` appends each template deny rule that is missing, after the existing ones. A `permissions` value that is not an object, or a `deny` that is not a list, is a conflict. The kit's and the sample app's `.claude/settings.json` stay byte copies of the template's.
- **`.gitignore`:** the template's file (a managed block) gains `graphify-out/`; the template manifest is regenerated.
- **Runbook** `template/knowledge/runbooks/graphify.md` (type `Runbook`):
  - install with `uv tool install graphifyy`, then `node scripts/specfold.mjs graphify setup`;
  - queries, and the hooks' refresh;
  - graphify's commit-with-code option (only `graph.json`, with its merge driver) for teams that want to share the graph.

  The template's indexes are regenerated.
- **Sample app numbers:**
  - measured on a scratch copy of `examples/sample-app` (nothing of graphify is committed there);
  - `specfold stats` before and after `graphify setup`;
  - one Claude Code task the user runs twice, without and with graphify, reading the session's token use from `/cost` or the status line;
  - the README gets a "Token numbers" section with both.
- **Plan:** the line "teams may commit `GRAPH_REPORT.md` only" becomes graphify's advice: share only `graph.json`, with graphify's merge driver.

## Risks / Trade-offs

- [graphify changes its commands again] → setup calls only `install --project --platform agents`, `extract --code-only`, `cluster-only --no-label` and the guard. The runbook names the version checked, and the decision records it.
- [A deny rule hides a file an agent needs] → the list holds only generated files, and a team removes a rule in its own settings; migrate never re-adds a rule that is already present, but it does re-add a missing one. The runbook says so.

## Commitments

none
