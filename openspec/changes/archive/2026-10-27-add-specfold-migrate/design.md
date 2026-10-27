# Design

## Context

- **Commands** register themselves in `src/commands.ts`; `UsageError` and `EnvError` exit with 2, a refusal returns 1 (as in `backlog`).
- **`requireConfig`** needs `specfold.yaml`; migrate runs before it exists, so it works from the git root instead.
- **`installHooks`** (`src/hooks/install.ts`) and **`planLinks`/`applyLinks`** (`src/agents/sync.ts`) take a `Config`; install loads it once `specfold.yaml` exists. `writeIfChanged` already lives in `hooks/install.ts`.
- **YAML edits that keep comments** use `parseDocument` from `yaml`, as the hook manager adapters do.
- **`openspec init --tools agents,claude`** runs without prompts, writes `openspec/config.yaml` with `schema: spec-driven` and commented examples, and writes the OpenSpec skills (checked 2026-10-27 with 1.15.0).
- **The gate's diff** knows the merge base (`src/gate/diff.ts`); G4 lives in `src/gate/rules.ts`.

## Goals / Non-Goals

**Goals:**
- every refusal happens before the first write;
- a rerun with the same inputs writes nothing, so `git status` stays clean;
- detection is shared with `specfold init` (`add-bootstrap`).

**Non-Goals:** the skill (`add-sf-migrate-skill`); `init` and `BOOTSTRAP.md` (`add-bootstrap`); downloads and upgrades (M9).

## Decisions

- **Module `src/migrate/`:**
  - `repo.ts`: the git root of the working folder (`git rev-parse --show-toplevel`; outside git → `EnvError`), current branch, default branch, clean-tree check;
  - `state.ts`: `.specfold/migration/state.json` with `state_version: 1`, `default_branch`, `base`, `steps` (step → ISO time, the first run's time kept) and `inventory`; step order `start, inventory, plan, install, convert, seed, report`; `mark` takes only `plan`, `convert`, `seed`, `report`;
  - `detect.ts`: stack, package layout, CI system and source globs from root files and folders;
  - `inventory.ts`: classifies `git ls-files` output;
  - `blocks.ts`: managed blocks;
  - `merge.ts`: the `.claude/settings.json` and `openspec/config.yaml` merges;
  - `install.ts`: kit files, project files, the OpenSpec setup, links, hooks and the manifest;
  - `command.ts`: the five subcommands.
- **Branch rule:**
  - the current branch comes from `git symbolic-ref --short HEAD`; a detached HEAD is refused;
  - the default branch is `--default-branch`, else `refs/remotes/origin/HEAD`, else exactly one of `main` and `master`;
  - `start` creates the branch with `git checkout -b specfold/migration` or switches with `git checkout specfold/migration`;
  - `start` does not check the order of steps; the skill does (`status` first).
- **Clean tree:** `git status --porcelain --untracked-files=all` without the line for `.specfold/migration/state.json`.
- **Inventory kinds**, first match wins, for tracked files only:
  - `agent-rules`: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.cursor/rules/**`, `.github/copilot-instructions.md`;
  - `spec-tool`: `openspec/**`, `.specify/**`, `.kiro/specs/**`;
  - `adr`: Markdown in a folder named `adr`, `adrs`, `decisions` or `decision-records`;
  - `wiki`: Markdown under a folder named `wiki`;
  - `readme`: `README*`;
  - `contributing`: `CONTRIBUTING*`;
  - `docs`: `.md`, `.mdx`, `.rst`, `.adoc` or `.txt` under `docs/` or `doc/`.
  - Tokens are `ceil(characters / 4)`.
- **Detection:**
  - stack: `package.json` → Node.js, `tsconfig.json` → TypeScript, `pyproject.toml`/`requirements.txt`/`setup.py` → Python, `go.mod` → Go, `Cargo.toml` → Rust, `pom.xml`/`build.gradle(.kts)` → Java, `Gemfile` → Ruby, `composer.json` → PHP, `mix.exs` → Elixir, in that order, joined with `, `;
  - layout: `monorepo` when `package.json` has `workspaces`, or `pnpm-workspace.yaml` or `go.work` exists, else `single package`;
  - CI: `.github/workflows/` → GitHub Actions, `.gitlab-ci.yml` → GitLab CI, `.circleci/` → CircleCI, `Jenkinsfile` → Jenkins, `azure-pipelines.yml` → Azure Pipelines;
  - source globs: `src/**`, `lib/**`, `app/**`, `packages/*/src/**` for the folders present, else `["src/**"]` marked as a fallback.
- **Kit-owned files:** `scripts/specfold.mjs`, `openspec/schemas/specfold/**`, `.agents/skills/**`, `.github/workflows/specfold-gate.yml`, `.github/workflows/specfold-gate-comment.yml`, and with `claude` `.claude/agents/**`. The template's `.claude/skills/` links are never copied; `agents sync` creates them.
- **Managed blocks:**
  - the block is the template file's whole text;
  - Markdown files use `<!-- specfold:start -->` / `<!-- specfold:end -->` and get a new block at the top, followed by a blank line;
  - `.gitignore` and `CODEOWNERS` use `# specfold:start` / `# specfold:end` and get a new block at the end;
  - a start marker without an end marker is a conflict;
  - `CLAUDE.md` gets a block only with `claude`.
- **`.gitignore`:** the template's `.gitignore` gains `.specfold/migration/state.json`, so the block ignores the state.
- **Settings merge:** for each event in the template's `hooks`, a matcher group is added when none of its commands appears under that event; output is `JSON.stringify(…, null, 2)` plus a newline, written only when it changed.
- **OpenSpec:**
  - with `openspec/config.yaml`: `schema` is set to `specfold`; `context` is kept, and gets a `Stack: …` line when no line starts with `Stack:`; a missing `rules` key from the template is added; a missing `context` or `rules` is copied whole;
  - without it: `openspec init --tools <tools>` with `NO_COLOR=1`, using the binary from `openspecBinary`, then the template's `config.yaml` with the stack filled is written over the generated one;
  - a missing binary is exit 2, checked before any write.
- **`specfold.yaml`:** created from the template's text with `source_globs` set as a flow list, and with `agents.targets: []` for `--tools agents`; an existing one is left alone.
- **Knowledge skeleton:** each file of the template's `knowledge/` is copied only when it is missing; it is project-owned, so the manifest leaves it out.
- **Links and hooks:** after the files, the config is loaded, then `planLinks`/`applyLinks` and `installHooks` run; an `EnvError` from hooks (a foreign `core.hooksPath`) becomes a conflict.
- **Manifest:**
  - `{ manifest_version: 1, kit_version, ref?, files: { path: "sha256:<hex>" }, blocks: { path: "sha256:<hex>" } }`, with sorted keys and no time;
  - files in conflict are left out;
  - `writeIfChanged` keeps a rerun silent.
- **Output:** one `path: action` line per change (`write`, `block`, `merge`, `run openspec init`, `link`, hook actions), one `path: conflict: <reason>` line per conflict, then `migrate install: N changes, M conflicts` or `migrate install: everything is up to date`; `--json` gives `{ ok, actions, conflicts }`.
- **Gate:** `GateDiff.adoption` is true when `git cat-file -e <merge-base>:./specfold.yaml` fails. G4 returns nothing then. `renderGate` and `renderSummary` take notes, and the command passes `adoption PR: the base has no specfold.yaml, so G4 is skipped`; JSON adds `adoption`.

## Risks / Trade-offs

- [A repo's own `openspec init` skills already exist in `.claude/skills/` as folders] → `agents sync` keeps non-link entries, so nothing is lost.
- [Hash-comment markers in `CODEOWNERS` are ordinary comments] → GitHub ignores them; the block holds only commented examples until owners are filled in.
- [`start` refuses a dirty tree even on `specfold/migration`] → the skill commits after each step and resumes through `status`, not `start`.

## Commitments

none
