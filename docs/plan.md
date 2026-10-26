# Implementation Plan: Specfold

Oct 26, 2026 · @Sami Arda Ünsay

## Decisions

This plan is the build brief for Claude Code. It turns the earlier concept (an OKF v0.2 knowledge bundle plus OpenSpec, connected by agents) into a buildable kit. These decisions are fixed:

| Topic | Decision |
| --- | --- |
| Delivery | Template repo **and** bootstrap prompt, plus a migration assistant skill for existing projects |
| Agents | Tool-neutral first (`AGENTS.md`, `.agents/skills/`, CLI, CI); Claude Code extras on top (hooks, subagent, `.claude/skills/`) |
| Target | New projects (template) and existing codebases (migration) |
| Strictness | A required CI check **blocks merges**; local hooks give early feedback |
| OpenSpec schema | Custom schema `specfold` with a mandatory `knowledge` artifact |
| Language | English only: knowledge, specs, skills, docs |
| Repo | None yet. This document is the plan`. The framework is named Specfold (see Naming)`. The kit repo will be private on GitHub at first, so every install, bootstrap and upgrade path must work with authentication (see Updating); M9 tests upgrades from a private source |

Core rule carried over from the concept: **specs are the normative behavior contract, knowledge is descriptive context, nothing is written twice.**

### Self-hosting: Specfold is built with Specfold

**Specfold is built, extended and maintained with Specfold itself.** Every feature, fix and release of the framework goes through its own workflow: interview, brief, OpenSpec change, parallel apply, gate, archive, knowledge sync. The kit repo has its own knowledge bundle, specs, backlog, commitments and vision (see Dogfooding), and is updated with its own released upgrader. If something in the workflow hurts, it hurts the maintainers first.

Because the tools do not exist on day one, each piece is switched on for the kit repo as soon as it is built:

| From milestone | The kit repo starts using |
| --- | --- |
| M0 | hand-written knowledge (decisions, references, vision), first specs, backlog seeded from "Later" |
| M1 | `specfold validate`, `index`, `lookup` on its own bundle; every following milestone is an OpenSpec change |
| M2 | the `specfold` schema with `brief.md` and `knowledge.md`, task breakdown with `specfold tasks check`, `status` and `resume`, `sf-sync` after each archive |
| M3 | all skills, including `sf-interview` for planning its own milestones |
| M4 | `specfold-gate` as a required check on the kit repo itself |
| M5 to M9 | migration fixtures, quality loops, parallel worktrees, upgrader, each used on the next milestone |

After `v0.1.0`, there is no separate maintenance process: bug reports become backlog items or changes, and releases are archived changes.

### Naming

The framework is called **Specfold**: specs and knowledge folded into one workflow. Earlier drafts used working names; this plan has been rewritten with the final names. The mapping is kept for reading older notes:

| Working name (earlier drafts) | Final name |
| --- | --- |
| `okf-openspec-kit` (repo) | `specfold` |
| CLI `kb`, file `scripts/kb.mjs` | CLI `specfold` with short alias `sf`, file `scripts/specfold.mjs` |
| `kb.config.yaml`, `.kb/` (manifest, local settings, reports) | `specfold.yaml`, `.specfold/` |
| skills `kb-lookup`, `kb-capture`, `kb-sync`, `kb-audit`, `kb-migrate`, `kb-interview`, `kb-upgrade` | `sf-lookup`, `sf-capture`, `sf-sync`, `sf-audit`, `sf-migrate`, `sf-interview`, `sf-upgrade` |
| subagent role `kb-scout` | `scout` |
| OpenSpec schema `kb-driven` | `specfold` |
| CI check `kb-gate`, workflow `kb-upgrade.yml` | `specfold-gate`, `specfold-upgrade.yml` |
| managed-block markers `kb:begin` / `kb:end` | `specfold:begin` / `specfold:end` |
| env `KB_WT_INDEX` | `SPECFOLD_WT_INDEX` |

The knowledge folder stays `knowledge/` and OpenSpec stays `openspec/`, so both remain recognizable to their own tools. Before publishing, check GitHub and trademark registers for "Specfold"; npm `specfold` was free and a web search found no similar dev tool on 2026-10-26.

## Deliverables

One repo ships everything. The template is the single source; the prompt and the migration skill both install from a pinned release of it.

| Deliverable | For | How it is used |
| --- | --- | --- |
| Template repo | New projects | GitHub "Use this template", then `npx specfold init` (or `./scripts/specfold init`) fills names and runs `openspec init` |
| `BOOTSTRAP.md` prompt | Any repo, any agent, kit not installed yet | User pastes it into their agent; it downloads release `vX.Y.Z`, installs the kit files, then runs the migration skill |
| `sf-migrate` skill | Existing projects | Analyzes existing docs and code, plans the mapping, installs the kit, converts docs into OKF concepts, opens a migration PR |
| `specfold` CLI | Agents, hooks, CI | Deterministic validation, indexing, gate checks. Agents call it; nothing that must be correct depends on an LLM |
| Skills `sf-lookup`, `sf-capture`, `sf-sync`, `sf-audit` | Day-to-day work | Read, write, sync and audit knowledge around the OpenSpec loop |
| CI workflow `specfold-gate` | Every PR | Required status check that blocks merges |

Versioning: the kit itself is semver-tagged. Installed repos record the kit version in `specfold.yaml` (`kit_version`), so `specfold upgrade` knows what to diff against. It must not go into `knowledge/index.md`, because OKF allows only `okf_version` in index frontmatter.

## Template repo layout

Everything a user repo receives sits at the top level; kit-only sources live in `tools/` and `examples/`. The CLI ships as one bundled file, so installed repos need no extra package install.

```text
specfold/
├── README.md
├── BOOTSTRAP.md                  # paste-able prompt (see Migration section)
├── AGENTS.md                     # canonical agent instructions, tool-neutral
├── CLAUDE.md                     # "@AGENTS.md" + Claude Code specifics only
├── specfold.yaml                # kit_version, source globs, gate settings, type vocabulary
├── knowledge/                    # OKF v0.2 bundle
│   ├── index.md                  # frontmatter okf_version: "0.2" only
│   ├── log.md
│   └── {domain,architecture,decisions,capabilities,conventions,runbooks,references}/index.md
├── openspec/
│   ├── config.yaml
│   ├── schemas/specfold/
│   │   ├── schema.yaml
│   │   └── templates/{proposal,spec,design,knowledge,tasks}.md
│   ├── specs/
│   └── changes/archive/
├── .agents/skills/               # canonical skills (vendor-neutral target)
│   └── sf-{lookup,capture,sync,audit,migrate}/SKILL.md (+ references/, templates/)
├── .claude/
│   ├── settings.json             # hooks
│   ├── skills/                   # symlinks into .agents/skills, written by `specfold agents sync`
│   ├── agents/knowledge-curator.md
│   └── hooks/*.sh                # thin wrappers around scripts/specfold.mjs
├── .specfold/hooks/              # git hook scripts (core.hooksPath), each one line calling the CLI
├── .github/
│   ├── workflows/specfold-gate.yml
│   ├── pull_request_template.md  # Change: / Knowledge: fields
│   └── CODEOWNERS                # knowledge/decisions/ -> maintainers
├── scripts/specfold.mjs                # bundled CLI (build output, committed)
├── tools/specfold/                     # CLI source, TypeScript, tests, fixtures (kit only)
├── examples/sample-app/          # worked example with one archived change (kit only)
└── docs/                         # kit docs: workflow, gate, migration, upgrading
```

This tree is what a **user repo** receives. In the kit repo itself, the same files live under `template/`, and the root holds the kit's own knowledge, specs and tooling (see Dogfooding below).

`specfold.yaml` is the one place a project tunes the kit:

```yaml
kit_version: 0.1.0
source_globs: ["src/**", "app/**", "lib/**", "packages/*/src/**"]
gate:
  require_change_for_source_changes: true
  escape_label: no-spec          # skips the change rule; PR body must give a reason
  block_on_stale_touched: true   # expired stale_after on a concept the PR touches
  block_on_broken_links: true
types: [Term, Business Rule, Component, Data Flow, Interface, Decision, Capability, Convention, Runbook, Reference]
actors:
  agent_prefix: "claude-code/"   # generated.by for agent writes; other tools set their own
tasks:
  max_files_per_task: 5          # warning only (T10)
  max_tasks_per_group: 8         # warning only (T9)
```

### Dogfooding: the kit repo uses the kit

The kit repo runs its own workflow, so building it is the first real test. That needs a split between **what the kit repo knows about itself** and **what it ships**:

```text
specfold/
├── AGENTS.md, CLAUDE.md, specfold.yaml, .specfold/hooks/   # the kit's own setup
├── knowledge/          # the kit's own OKF bundle (never shipped)
├── openspec/           # the kit's own specs and changes (never shipped)
├── template/           # the payload: everything in the layout above, with an empty bundle
├── tools/specfold/, examples/, docs/
└── .github/workflows/  # kit CI + release job that publishes template/
```

Kit-only tooling stays outside the payload: the kit repo's commit convention (`/decisions/commit-convention.md`: `package.json`, `scripts/check-commit.mjs`, `scripts/commit-convention.json`, `.githooks/`, `.github/workflows/commit-convention.yml`) is never copied into `template/` and is not in the upgrader's kit-owned files.

The release job publishes `template/` as a tarball and syncs it to a separate template repo, so "Use this template" never copies the kit's own knowledge. `BOOTSTRAP.md` and `sf-migrate` install from the same tarball.

**What the kit's own bundle holds from day one:**

| Folder | Content |
| --- | --- |
| `decisions/` | the decisions in this plan as `Decision` concepts: separate bundle, specs vs knowledge, custom schema, blocking gate, built-in git hooks, English only, graphify code-only, dogfooding split |
| `references/` | mirrored summaries of the OKF spec, OpenSpec docs, Claude Code docs, graphify, git hook managers and the GitHub API, each with `sources` (with `last_modified` per source, as OKF defines it) and a 30-day `stale_after`, because all of them move fast |
| `architecture/` | specfold CLI modules, gate pipeline, release flow |
| `conventions/` | TypeScript style, test fixtures, skill writing rules (short SKILL.md, details in `references/`) |
| `capabilities/` | one card per kit spec |

**The kit's own specs** (`openspec/specs/`) describe the CLI and gate behavior: `specfold-validate`, `specfold-index`, `specfold-gate` (one requirement per rule G1-G12), `sf-migrate`, `sf-sync`. The gate rules are behavior, so they belong there and get scenarios that double as test cases.

`specfold audit` in the kit repo flags expired `references/` concepts, which turns upstream changes in OKF or OpenSpec into a visible maintenance task.

## Knowledge bundle profile

The kit adds a stricter **profile** on top of OKF v0.2. Every rule below is still valid OKF (extra keys are allowed and must be preserved), so any OKF consumer can read the bundle.

**Frontmatter required by the profile** (OKF itself only requires `type`):

| Field | Rule |
| --- | --- |
| `type` | one of `specfold.yaml` `types` |
| `title`, `description` | non-empty; `description` is one line, max 160 chars (it is what indexes and lookups show) |
| `status` | `draft`, `stable` or `deprecated` |
| `generated` or `verified` | at least one. Agents always write `generated: { by: <agent_prefix><model>, at: <ISO 8601 with offset> }` |
| `verified` | list of `{ by, at }`. Only humans add `human:<github-login>` entries; the gate checks them (see Merge gate) |
| `sources` | required for `Decision` and for anything derived from code or external docs; `resource` uses bundle-absolute or repo-relative paths |
| `stale_after` | required for `Runbook` and `Interface`; optional elsewhere |

**Conventions:** links are bundle-absolute (`/architecture/payment-service.md`); file names are kebab-case; one concept per file; bodies stay under about 300 lines, larger topics split into a folder with its own `index.md`. No `SHALL`/`MUST` sentences in knowledge: normative behavior belongs in specs.

**Project-specific keys** (allowed by OKF as extensions):

| Key | On type | Meaning |
| --- | --- | --- |
| `decision` | Decision | `accepted`, `rejected` or `superseded` |
| `change` | Decision, Capability | OpenSpec change id, e.g. `2026-10-26-add-guest-checkout` |
| `supersedes` | Decision | path of the decision it replaces |
| `spec` | Capability | repo-relative path to `openspec/specs/<capability>/spec.md` (also set as `resource`) |
| `not` | Term, Business Rule | list of `{ term, why, instead }` misreadings, as in the OKF sample bundle |

**Templates** ship in `.agents/skills/sf-capture/templates/`: one per type. Example for a capability card:

```markdown
---
type: Capability
title: Guest checkout
description: Why guest checkout exists and where its contract lives.
status: draft
resource: ../../openspec/specs/checkout/guest-checkout/spec.md
spec: openspec/specs/checkout/guest-checkout/spec.md
change: 2026-10-26-add-guest-checkout
generated: { by: claude-code/<model>, at: 2026-10-26T10:00:00+00:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-guest-checkout/proposal.md
---

# Why

Short rationale, constraints, rejected alternatives (link decisions).

# Related

- [Checkout service](/architecture/checkout-service.md)
```

`index.md` and `log.md` are **generated by `specfold index`**, never written by agents by hand. Indexes list `* [Title](file.md) - description`, grouped by `type`; `log.md` gets one entry per archived change or migration.

### Convention: code comments point to knowledge

The template ships this as `knowledge/conventions/code-comments.md` (`type: Convention`), and `AGENTS.md` links to it. The kit's own repo follows it too.

**Rule:** code comments stay short. Rationale, business rules, history, trade-offs and "why not X" live in the knowledge base; the comment only points there.

| Allowed in code | Goes to knowledge, comment only references it |
| --- | --- |
| one line on a non-obvious mechanism ("retry because the API is eventually consistent") | why a design was chosen, rejected alternatives |
| TODO with an issue or change id | business rules, legal or compliance reasons |
| public API doc comments required by the language tooling | history ("used to be X until 2025"), incidents |

**Reference syntax** (one per comment, any comment style of the language):

```ts
// see knowledge: /decisions/guest-orders-without-accounts.md
const token = issueGuestToken(order);
```

The path is bundle-absolute, like OKF links. An optional short label may follow after `-`.

**Tooling around it:**

- `specfold index` scans source files for `see knowledge:` references and adds a generated "Referenced from code" list to each concept's index entry, so agents can go from knowledge to code and back.
- graphify already turns ADR-style citations in comments into graph nodes linked to the code, so these references also show up in `graphify query`.
- New gate rule **G14**: a reference to a missing concept blocks; a reference to a `deprecated` concept warns.
- `sf-capture` offers to move a long rationale comment into a new concept and leave the reference behind; `sf-migrate` lists such comments in its report but never moves them on its own.

**Code conventions** in general (style, naming, patterns) are an open topic for later. When they come, they go into `knowledge/conventions/` the same way, and linters stay the enforcement for anything a tool can check.

## OpenSpec setup

Install with `openspec init --tools agents,claude --language English` (add further tool ids as needed; `agents` writes vendor-neutral skills to `.agents/skills/`). Then replace the generated config and add the schema.

**`openspec/config.yaml`** (keep `context` short: it is injected into every artifact):

```yaml
schema: specfold

context: |
  Project knowledge lives in knowledge/ (OKF v0.2). Start at knowledge/index.md.
  Behavior contracts live in openspec/specs/. Knowledge never restates requirements.
  Stack: <filled by specfold init or sf-migrate>

rules:
  proposal:
    - Link the knowledge concepts and decisions this change relies on (bundle-absolute paths).
    - Check knowledge/decisions/ for a rejected decision covering the same idea; if one exists, say why this differs.
  specs:
    - Observable behavior only. Rationale goes to the capability card via knowledge.md.
  knowledge:
    - List every concept to create, update or deprecate. An empty list needs a one-line reason.
  tasks:
    - Break the change into task groups (`## <n>. <name>` plus a yaml block with files, depends, scenarios, agent) and tasks (`- [ ] <n>.<m>` plus a `Done when:` line); see Task breakdown.
    - Every group owns its files; groups that may run in parallel never share files.
    - Order groups by dependency; tests or scenarios come before or alongside the code they cover.
    - Last task group is always "Knowledge": write the concepts listed in knowledge.md before archive; `specfold sync <change>` goes into `## Workflow follow-up` and runs after archive (see /decisions/write-knowledge-before-sync-after.md).

operations:
  apply:
    guidance:
      - Add new findings to knowledge.md while implementing, not afterwards.
  archive:
    guidance:
      - After archiving, run the sf-sync skill for this change and include its output in the same PR.
```

**Schema `specfold`**: create with `openspec schema fork spec-driven specfold`, then add one artifact and one dependency. It ships in `template/openspec/schemas/specfold/`; the kit repo uses a copy in `openspec/schemas/specfold/` that CI keeps byte-identical (decided 2026-10-26):

```yaml
  - id: knowledge
    generates: knowledge.md
    description: Knowledge delta this change will apply after archive
    template: knowledge.md
    instruction: |
      Read knowledge/index.md and the concepts linked from the proposal.
      Fill the ops list: create/update/deprecate, path (bundle-relative), type, one-line summary.
      Always include the capability card for every capability in the proposal.
      Record rejected alternatives from design.md as Decision concepts.
    requires: [proposal, specs]

  # tasks: add `knowledge` to its existing requires list
```

**`templates/knowledge.md`** is machine-readable so the gate can check it:

````markdown
## Delta

```yaml
ops:
  - op: create            # create | update | deprecate
    path: capabilities/guest-checkout.md
    type: Capability
    summary: Why guest checkout exists; links the new spec.
  - op: create
    path: decisions/guest-orders-without-accounts.md
    type: Decision
    summary: Guest orders get no account; email token only.
empty_reason: ""          # required when ops is empty
```

## Notes

Free text for the reviewer.
````

**What OpenSpec does not enforce** (verified with OpenSpec 1.15.0): `requires` is advisory. `openspec instructions` still renders an artifact whose dependencies are missing (with a warning), an artifact counts as done as soon as its file exists, `openspec validate --strict` ignores custom artifacts, and the CLI `archive` checks only `tasks.md` checkboxes, not schema artifacts (the `/opsx:archive` skill warns and asks). So `specfold change check` and the gate (G5, G6, G13) are the only enforcement of `brief.md` and `knowledge.md`. Explore cannot be pointed at a skill through `config.yaml` (`rules.explore` and `operations.explore` are rejected as unknown keys); the interview is triggered by the `brief` artifact's instruction and by `AGENTS.md`. OpenSpec's `verify` workflow is not in the default profile and is enabled with `openspec config profile`.

Rejected changes: `sf-capture` writes a `Decision` with `decision: rejected` and the change folder is deleted, so OpenSpec never shows it again but agents still find it.

## specfold CLI

Everything that must be correct is deterministic code, so every agent, hook and CI job gets the same answer. Skills call the CLI; they never re-implement its checks.

**Tech:** TypeScript, Node ≥ 20.19 (same floor as OpenSpec), one runtime dependency (`yaml`), bundled with esbuild into `scripts/specfold.mjs`. Output: human text by default, `--json` for agents and CI. Exit codes: 0 ok, 1 findings, 2 usage or environment error.

| Command | Does | Used by |
| --- | --- | --- |
| `specfold init` | fills `specfold.yaml`, `openspec/config.yaml` context, runs `openspec init`, `specfold agents sync`, `specfold hooks install` | template users |
| `specfold validate [paths]` | OKF conformance (3 rules) + profile rules + link check, only errors printed | hooks, gate |
| `specfold index` | regenerates every `index.md` and the root `okf_version`; `--check` fails if out of date | sf-sync, gate |
| `specfold log add <msg>` | appends a dated entry to `knowledge/log.md` | sf-sync, sf-migrate |
| `specfold lookup <query>` | searches frontmatter only (title, description, tags, type) and prints path + one line per hit, flags stale/deprecated/unverified | sf-lookup |
| `specfold new <type> <path>` | creates a concept from the type template with `generated` filled | sf-capture |
| `specfold change check <name>` | parses `knowledge.md`, checks paths, types and capability coverage | gate, sf-sync |
| `specfold sync <name>` | applies the deterministic part of a knowledge delta: stubs, `deprecated` flags, capability `spec`/`change` keys, index, log | sf-sync |
| `specfold audit` | stale, unverified, deprecated-but-linked, orphans, specs without capability card, SHALL in knowledge | sf-audit, scheduled CI |
| `specfold gate --base <sha>` | runs all merge-gate rules on a diff (see next sections) | CI, pre-push |
| `specfold stats` | token estimate per file and for the always-loaded set (AGENTS.md, config context, skill descriptions) | token budget check |
| `specfold agents sync` | symlinks each `.agents/skills/<name>` into `.claude/skills/` and other tool folders listed in config (Claude Code does not read `.agents/skills/` itself) | init, upgrade |
| `specfold doctor` | checks openspec version, node, git hooks installed, optional graphify, config drift | humans, bootstrap |
| `specfold hooks install` / `specfold hook <name>` | sets `core.hooksPath` to `.specfold/hooks/`, or adds one entry to an existing hook manager; `hook <name>` runs the checks for one git hook | init, sf-migrate, git |
| `specfold upgrade --to <ver>` | three-way updates kit-owned files, never touches `knowledge/` content | humans |

Commands added by later sections (same conventions):

| Command | Does | Defined in |
| --- | --- | --- |
| `specfold verify <paths>` | adds `verified: human:<github-login>` for the current git identity and sets `status: stable`; refuses for agents | Merge gate |
| `specfold wt plan \| new \| setup \| clean` | overlap check across active changes, worktree creation and setup for any tool, cleanup | Subagents and parallel work |
| `specfold parallel set <n> \| show` | personal limit for parallel subagents and change sessions | Subagents and parallel work |
| `specfold tasks check <change> [--base <ref>]` | checks the task breakdown (rules T0-T11); also run by `change check` | Task breakdown |
| `specfold status [<change>]` | progress per task group and the next open task | Task breakdown |
| `specfold resume <change>` | the next open task with its group context and trailer, for a fresh session | Task breakdown |
| `specfold trace [--change <name>]` | scenario-to-test coverage and dangling test references | Quality loops |
| `specfold drift` | concepts possibly stale because their source files changed after verification | Quality loops |
| `specfold backlog add \| list \| promote \| drop` | backlog items, promotion to a change | Backlog, deferred commitments and vision |
| `specfold commitments list \| fulfill \| withdraw` | deferred commitments (human actor required for withdraw) | Backlog, deferred commitments and vision |

Still open for the build: exact flags and `--json` output shapes per command. Claude Code should write them as the kit's own OpenSpec specs in M0/M1 (one capability per command group), so the CLI contract is reviewed before it is implemented.

Tests: fixture bundles (valid, each rule broken once), golden-file tests for `index`, and the OKF sample bundle `acme_retail` as two pinned fixtures: a patched copy (frontmatter removed from `log.md`, leading `/` added to bundle paths, patch documented) that must pass `--okf-only`, and the unpatched upstream copy that must fail with exactly those findings. OKF ships no validator of its own, so `specfold validate` is the reference check for the kit.

## Agent layer

The tool-neutral base works with any agent that reads `AGENTS.md` and `.agents/skills/`. Claude Code gets extra automation on top, but nothing in the workflow depends on it.

**`AGENTS.md`** (target: under 120 lines, it is loaded every session):

1. Map: `knowledge/`, `openspec/`, `specfold.yaml`, where code lives.
2. The core rule: contract in specs, context in knowledge, nothing twice.
3. Lookup order: `specfold lookup` / knowledge indexes for *why and what*, the code graph (graphify, if installed) for *where in code*, `openspec show --json --no-scenarios` for *behavior*, raw grep and file reads last.
4. Workflow: explore, propose, apply, verify, archive, sf-sync, with the command names per tool.
5. When OpenSpec is not needed (no behavior change): use `skip_specs: true` or the `no-spec` label with a reason.
6. Never write `human:` actors; never edit `index.md`/`log.md` by hand.

`CLAUDE.md` contains `@AGENTS.md` plus Claude-only notes (hooks, subagent, slash command names). Claude Code reads `AGENTS.md` natively only when no `CLAUDE.md` exists, so the import stays.

**Skills** (canonical in `.agents/skills/`, each `SKILL.md` short with details in `references/`):

| Skill | Trigger | Steps |
| --- | --- | --- |
| `sf-lookup` | before explore/propose, or any "why/what is" question | `specfold lookup`, read the 1-3 best concepts, report trust tier and staleness |
| `sf-capture` | new knowledge appears, or a proposal is rejected | `specfold new`, fill body, `sources`, `status: draft`, `specfold validate` |
| `sf-sync` | after `/opsx:archive` | `specfold change check`, `specfold sync`, write bodies for created/updated concepts, `specfold index`, `specfold log add`, `specfold validate` |
| `sf-audit` | on request or weekly CI issue | `specfold audit --json`, propose fixes as one change or PR |
| `sf-migrate` | existing repo without the kit | see Migration section |

**Claude Code extras:**

| Extra | What it does |
| --- | --- |
| `SessionStart` hook | prints the root `knowledge/index.md` section list (not the whole file) and `openspec list --json` names, max \~40 lines |
| `PostToolUse` hook on Edit/Write under `knowledge/` or `openspec/changes/` | runs `specfold validate <file>` or `specfold change check`; prints errors only, exit 2 so Claude fixes them immediately |
| `Stop` hook | runs `specfold gate --base origin/<default> --local`; on failure exits 2 with the findings on stderr so Claude keeps working instead of stopping; Claude Code overrides the block after 8 consecutive ones, so the hook reports and the CI gate stays the enforcement |
| Subagent `knowledge-curator` | runs `sf-sync` and `sf-audit` in its own context on a cheaper model (Sonnet or Haiku), returns only a summary |
| Permissions | `deny` reads of build output, lockfiles, vendored code, `graphify-out/graph.json` (query it, don't read it) |

**Git hooks, built in.** Every tool and every human gets the same local safety net without an extra hook manager. `specfold hooks install` (run by `specfold init` and `sf-migrate`) sets `git config core.hooksPath .specfold/hooks`. Each script there is one line, `node scripts/specfold.mjs hook <name> "$@"`; the CLI works out staged files and globs itself, so there is no second glob syntax to get wrong. Git config is shared by all worktrees, and the scripts resolve per worktree.

| Git hook | `specfold hook` runs |
| --- | --- |
| `pre-commit` | `validate` on staged `knowledge/**/*.md` (including files directly under `knowledge/`), `change check --staged` on staged `openspec/changes/**`, `openspec validate --all --strict` when `openspec/**` is staged |
| `pre-push` | `gate --base origin/HEAD --local` |
| `post-checkout`, `post-merge` | `graphify update .` if graphify is installed, never fails |

Project-specific commands go into `specfold.yaml` under `hooks.extra.<git-hook>` (a list of shell commands), which `specfold hook` runs after its own checks. **Adapters:** if a repo already uses a hook manager (lefthook, husky, pre-commit/prek), `specfold hooks install` and `sf-migrate` do not touch `core.hooksPath`; they add one entry per hook to that manager that calls `specfold hook <name>`. So there is still exactly one owner of the git hooks: the existing manager, or Specfold when there is none. graphify's own `graphify hook install` is never used.

Hooks are a convenience; the CI gate stays the real enforcement, because local hooks can be skipped with `--no-verify`.

## Merge gate

One required status check, `specfold-gate`, blocks the merge when any blocking rule fails. It runs `openspec validate --all --strict` and `specfold gate --base <merge-base> --json`, and posts one summary comment listing failures with the fix for each.

| # | Rule | Effect |
| --- | --- | --- |
| G1 | `knowledge/` is OKF-conformant and passes the profile (`specfold validate`) | block |
| G2 | `specfold index --check`: indexes match the files | block |
| G3 | OpenSpec validates in strict mode | block |
| G4 | PR touches `source_globs` → it must add or modify a change under `openspec/changes/`, archive one, or carry the `no-spec` label with a reason in the PR body | block |
| G5 | Every change in the PR has a valid `knowledge.md` (`specfold change check`) | block |
| G6 | A change archived in this PR has its knowledge delta applied: every `ops` path exists with the right `type`/`status`, every capability has a card, `log.md` has the entry | block |
| G7 | New `verified` entries with `human:<login>` match the PR author or an approving reviewer (checked via GitHub API) | block |
| G8 | No agent-written file claims a `human:` actor in `generated` | block |
| G9 | A concept touched by the PR has an expired `stale_after` | block (configurable) |
| G10 | Broken bundle-internal links | block (configurable) |
| G11 | Always-loaded token budget exceeded (`specfold stats`, e.g. AGENTS.md > 2k tokens) | warn |
| G12 | Bundle-wide stale or unverified concepts | warn, plus weekly `specfold audit` issue |

Rules added by later sections (same gate, same summary comment):

| # | Rule | Effect | Defined in |
| --- | --- | --- | --- |
| G13 | every change has a confirmed `brief.md` without unowned open questions | block | Planning interview |
| G14 | `see knowledge:` references in code point to existing concepts | block (deprecated target: warn) | Code-comment convention |
| G15 | added or modified scenarios have at least one test reference; no dangling references | block (old gaps: warn) | Quality loops |
| G16 | changed files whose dependent concepts were not touched or re-verified | warn (block if `block_on_drift`) | Quality loops |
| G17 | design contradicts an open commitment; commitment withdrawn without human verification | warn / block | Backlog, deferred commitments and vision |
| G18 | task breakdown: missing metadata, numbering errors, unknown scenarios, `depends` cycles, file overlap between parallel groups (`specfold tasks check`) | block (size limits: warn) | Task breakdown |

Per the versioning policy, any rule added after `v1.0.0` ships as a warning first.

**Setup the kit performs or documents:** branch protection with `specfold-gate` required; `CODEOWNERS` for `knowledge/decisions/` and `openspec/specs/` so decisions and contracts need a maintainer review; the PR template has `Change:` and `Knowledge:` fields that G4/G6 read as hints.

**Verification flow without forging trust:** agents write `status: draft`. After review, a human runs `specfold verify <paths>` locally (adds `verified` with their own git identity mapped to `human:<github-login>`, flips to `stable`) or comments `/specfold verify` on the PR, which a small workflow turns into a commit by the commenter's identity. G7 ensures nobody else's name appears.

**G7 on GitHub** (verified 2026-10-26): reading reviews needs only `pull-requests: read` and works for fork PRs. The gate workflow triggers on `pull_request`, `pull_request_review` (`submitted`, `dismissed`) and `merge_group`, with one job name for all of them, no `paths:` filter (a filtered-out required check stays pending) and no job-level `if:` (a skipped job counts as passing); the job always runs and decides inside its steps. Only each reviewer's latest review counts. In `merge_group` runs there is no review context, so G7 relies on the PR-time result. Fork PRs cannot get comments from the default token, so the summary goes into the check run, and a separate `workflow_run` workflow posts the comment; `pull_request_target` is not used. Still to test in M4: whether a newer passing run replaces an older failed one under the same check name.

## Migration assistant and bootstrap prompt

`sf-migrate` brings an existing repo into the kit in one reviewable PR. It is resumable (state in `.specfold/migration/state.json`), never deletes original docs, and stops for a human checkpoint after planning.

**Hard rule: migration only ever happens on its own branch.** Before writing anything (even `.specfold/migration/plan.md`), `sf-migrate` checks that the working tree is clean and creates `specfold/migration` from the current default branch. It refuses to run on the default branch or on any existing feature branch, and never pushes, merges or force-pushes without the user's approval. If the branch already exists from an earlier run, it resumes there. Optionally it runs in a separate worktree, so the user's main checkout stays untouched while the migration runs. Undoing a migration is deleting the branch.

1. **Preflight.** Clean working tree, new branch `specfold/migration`, `specfold doctor`. Detect stack, package layout, CI system, default branch.
2. **Inventory.** Find existing knowledge sources: `README*`, `docs/`, ADR folders, `CONTRIBUTING`, wiki exports, agent rule files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`), other spec tools (`openspec/`, `.specify/`, `.kiro/specs/`). Size each in tokens.
3. **Plan (checkpoint).** Write `.specfold/migration/plan.md`: proposed capability domains, a mapping table *source → concept type and path / AGENTS.md section / keep as is / ignore*, and what the gate will enforce from when. Stop and ask the human to approve or edit the plan.
4. **Install.** Copy kit files from the pinned release; merge, don't overwrite, an existing `AGENTS.md`/`CLAUDE.md` (old content moves into a marked section or into `Convention` concepts); `openspec init` (or keep an existing `openspec/` and add the schema); `specfold hooks install` (adapter entry if a hook manager exists); CI workflow.
5. **Convert.** Per plan row: create OKF concepts with `sources` pointing at the original file, `status: draft`, `generated` set. ADRs become `Decision`. Agent rule files become `Convention`. Other spec tools: no bulk conversion; write capability cards that point to them and note them as migration candidates.
6. **Seed from code (capped).** Architecture components and interfaces from the code structure, or from the graphify report if present; glossary terms from domain names. Hard cap (default 30 concepts) to avoid a bundle nobody reviews.
7. **No retroactive specs.** OpenSpec explicitly advises against back-filling; specs grow with real changes.
8. **Validate and report.** `specfold index`, `specfold validate`, `openspec validate --strict`, `specfold stats`. Write `.specfold/migration/report.md`: counts, items needing human verification, open questions.
9. **PR.** Open the migration PR. G4 (change required) applies only to PRs opened after this one merges.

**`BOOTSTRAP.md`** is the entry point when the kit is not installed yet. It is one paste-able prompt that works in any agent:

```markdown
You are installing the OKF + OpenSpec agent kit into this repository.
1. Download release vX.Y.Z of <kit-repo-url> into a temp folder (do not run scripts from it yet).
2. Copy .agents/skills/sf-migrate/ into this repo's .agents/skills/ (and .claude/skills/ if Claude Code is used).
3. Read .agents/skills/sf-migrate/SKILL.md and follow it from step 1.
4. Stop at the plan checkpoint and wait for my approval.
If this repo has no existing code or docs, use the template path instead: copy the kit files and run `node scripts/specfold.mjs init`.
```

## Token efficiency

The kit recommends **graphify** for code navigation and builds the rest of its token savings into its own design. Each layer answers one kind of question cheaply, so agents read raw files last.

| Question | Cheapest source | Instead of |
| --- | --- | --- |
| Why does this exist, what does it mean? | `specfold lookup` (frontmatter only), then 1-3 concepts | reading `docs/` wholesale |
| Where is it in the code, what calls what? | `graphify query` / `path` / `explain` | grep plus opening many files |
| How must it behave? | `openspec show <spec> --type spec --json --no-scenarios` | reading full spec files |

**graphify** (recommended, optional; the gate never requires it). Open source, `pip` package `graphifyy` (v0.9.95 on PyPI), parses about 40 languages locally with tree-sitter into `graphify-out/graph.json` plus `GRAPH_REPORT.md`, and supports Claude Code, Codex, Cursor, Copilot and generic `.agents/skills`. Kit guidance:

- Install: `uv tool install graphifyy`, then `graphify install --project --platform agents`, which writes only the skill (`.agents/skills/graphify/`). For Claude Code, `specfold init` registers graphify's PreToolUse guard (`graphify hook-guard` on `Bash|Grep` and `Read|Glob`) in `.claude/settings.json` itself. `graphify claude install` and `graphify agents install` are not used, because they write their own `## graphify` section into `CLAUDE.md`/`AGENTS.md`.
- **Code-only by default** (`GRAPHIFY_BACKEND=none` for every command, `graphify extract --code-only` for the first build): free, deterministic, nothing leaves the machine. The semantic pass over docs would send content to an LLM and duplicate what `knowledge/` already provides.
- Exclude `knowledge/`, `openspec/`, build output and vendored code via `.graphifyignore`.
- Refresh with `graphify update .` from Specfold's `post-checkout` and `post-merge` hooks instead of `graphify hook install`.
- Do not commit `graphify-out/` by default (it reveals architecture and grows large); teams may commit `GRAPH_REPORT.md` only.
- One instruction block only: `AGENTS.md` defines the lookup order above. If a repo already has a `## graphify` section from graphify's installers, `sf-migrate` merges it into that one block.
- Published savings vary by repo (reports range from about 70% to about 70x on large codebases); small repos gain little. `specfold stats` plus a before/after task run is the honest measure.

**Further measures built into the kit:**

1. **Small always-loaded set.** `AGENTS.md` under \~2k tokens, `config.yaml` context a few lines, skill descriptions one sentence. Details live in skill `references/` and load only when used. Gate rule G11 enforces the budget.
2. **Progressive disclosure everywhere.** OKF indexes with one-line descriptions, `specfold lookup` returns paths and one line, concept bodies capped at \~300 lines.
3. **Deterministic work in the CLI.** Indexes, logs, link checks, stubs, gate checks cost zero model tokens and never need retries.
4. **Quiet hooks.** Hooks print errors only, SessionStart is capped at \~40 lines, JSON output is summarized before it reaches the model.
5. **Context isolation.** Exploration, sf-sync and audits run in subagents that return a summary, so the main session keeps a small context; cheaper models for mechanical work.
6. **Fresh context per phase.** Start apply in a new session (OpenSpec recommends this); `tasks.md` and `knowledge.md` carry the state, so nothing is re-explained.
7. **Small changes and specs.** One capability per change where possible; requirement descriptions under 500 characters (OpenSpec strict mode warns above that).
8. **Read barriers.** Permission `deny` rules and `.graphifyignore` for lockfiles, build output, generated code, snapshots, large fixtures.
9. **Cache-friendly prompts.** No dates, counters or other volatile text in `AGENTS.md`/`CLAUDE.md`, so the stable prefix stays cacheable across sessions.

## Planning interview: rather ask than assume

**Principle: rather ask than assume.** It is the first rule in `AGENTS.md`, sits in `openspec/config.yaml` `context`, and is recorded as a `Decision` in the kit's own knowledge. No spec is written until the agent can restate the user's wish and the user confirms it. The interview style follows Matt Pocock's grilling skill: a design tree worked in rounds, each question with a recommended answer.

**Skill `sf-interview`** runs at the start of every change (inside `/opsx:explore` or before `/opsx:propose`):

1. **Ground first.** `scout` reads knowledge, decisions, specs and the code graph. The agent never asks what it can verify itself, and it names any rejected decision that touches the idea.
2. **Build the design tree.** Outcome and scope first, then behavior, edge cases, constraints, then non-functional needs. Each decision branches into the ones that depend on it.
3. **Ask in rounds through the tool's native question UI.** In Claude Code that is `AskUserQuestion`: each frontier decision becomes one multiple-choice question, the recommended option listed first and marked "(recommended)", with a one-line reason; the user picks an option or types their own answer via "Other". Questions are never written as a numbered text list for the user to answer in prose. Only tools without such a UI fall back to plain text questions, one decision per line, each with a recommendation.
4. **Never treat a missing answer as consent.** Claude Code's `askUserQuestionTimeout` can auto-close a question when the user is away. The kit does not set it, and if an answer comes back as a timeout, `sf-interview` pauses the interview and re-asks later instead of proceeding on its own judgment.
5. **Record, don't infer.** Answers are collected in the session as the interview runs. "Whatever you think" is recorded as a delegated decision with the agent's choice spelled out, never as a hidden assumption.
6. **Close with a plan that needs approval.** The planner runs in plan mode (`permissionMode: plan`, read-only) for the whole interview. When no open branch would change a requirement, it presents the result through the tool's plan approval (in Claude Code `ExitPlanMode`): the wish in the user's words, every decision with its source, out of scope, the proposed change boundaries and the execution plan (task groups, parallelism). The user approves or sends it back with corrections, which start another question round. Only approval ends the interview: the session leaves plan mode, writes `brief.md` with the approved content and `confirmed_by`/`confirmed_at`, and hands over to `spec-writer`. Plan approval never auto-resolves on idle, so the timeout risk from step 4 does not apply here. Tools without a plan mode show the same plan as text and require an explicit "approve".

**Schema change:** `specfold` gets a first artifact `brief` (`brief.md`, `requires: []`), and `proposal` requires it. Template:

```markdown
## Wish
One paragraph in the user's words.

## Decisions
| # | Question | Answer | Source |
|---|----------|--------|--------|
| Q1 | ... | ... | user / delegated / knowledge:/decisions/x.md |

## Out of scope
- ...

## Open questions
(must be empty, or each item has an owner and says why it does not block the spec)

## Confirmation
confirmed_by: human:<github-login>
confirmed_at: 2026-10-26T10:00:00+00:00
```

**Enforcement:** new gate rule **G13** blocks a PR whose change has no `brief.md`, an empty `Confirmation`, or open questions without an owner. G7's identity check also covers `confirmed_by`, so an agent cannot confirm on the user's behalf.

**During implementation the principle still holds.** When an implementer hits an ambiguity, it stops that task group and returns the question to the orchestrator instead of guessing; the orchestrator asks the user, adds the answer to `brief.md` (and, if it changes behavior, to the delta spec), then resumes the group. Subagents never ask the user directly, which keeps all questions in one place.

Skip rule: changes with `skip_specs: true` (pure refactors, tooling) may use a short brief of only Wish and Confirmation.

## Task breakdown

Every feature and plan is broken down into small tasks, and subagents work on task groups, never on whole changes. The contract is the `specfold-tasks` spec (OpenSpec change `add-specfold-tasks`); the rationale is `/decisions/task-breakdown.md`.

**Shape of `tasks.md`:**

````markdown
## 2. Guest token

```yaml
files: [src/checkout/token/**]          # owned globs, required
depends: [1]                             # groups merged first; empty = start right away
scenarios: [checkout/guest-checkout#guest-pays-without-account]
agent: implementer                       # default
```

- [ ] 2.1 Add token issuer
  - Done when: `npm test -- token` passes
- [ ] 2.2 Wire the issuer into checkout
  - Done when: scenario guest-pays-without-account
````

- **Task group** = one unit a single subagent can take on. **Task** = one small, checkable step: one task is one commit with the trailer `Task: <change>#2.1`, and one verifiable outcome named in `Done when:` (a test, a command or a scenario id).
- Size limits in `specfold.yaml` `tasks:` (`max_files_per_task: 5`, `max_tasks_per_group: 8`) are warnings, not hard rules.
- Group order: dependencies first; tests or scenarios before or alongside the code they cover; the last group is "Knowledge".
- The `specfold` schema's `tasks` template and instruction produce this shape by default, and `rules.tasks` in `openspec/config.yaml` repeats the rules (see OpenSpec setup).

**Who does the breakdown:** `spec-writer` writes `tasks.md` in this shape. `planner` turns it into the execution plan (dependency graph, which groups run in parallel), and the breakdown is part of the plan the user approves at the end of `sf-interview`. The optional `plan-critic` also flags groups too big for one subagent, tasks without `Done when:` and hidden dependencies between groups.

**How subagents use it:** see Subagents and parallel work (task packets, split instead of grow). Without parallelism (`specfold parallel set 1`, or tools without subagents) the same groups run one after another, so the breakdown works with every tool.

**Checks:** `specfold tasks check <change>` (also run by `specfold change check`) reports groups without metadata, tasks without `Done when:`, numbering errors, unknown scenario ids, `depends` cycles or unknown ids, overlapping `files` between groups that may run in parallel, and size warnings; with `--base` it also matches commits and trailers to tasks. Gate rule G18 blocks on its errors. `specfold status` and `specfold resume` show progress per group and the next open task from checkboxes and trailers, so a fresh session picks up exactly where the last one stopped.

## Subagents and parallel work

Parallelism follows OpenSpec boundaries: **one change = one worktree = one branch = one PR**, and inside a change only task groups with disjoint files run in parallel. Read-only work never needs a worktree. This part is Claude Code specific; other tools get the same structure sequentially plus `specfold wt` for worktrees.

&#91;embedded content: one change, run in parallel · 5 phases, 6 subagent roles\]

The orchestrator is the main session, sitting in the change worktree. Every subagent returns a short summary, never raw file contents. A failing verifier sends findings back to the orchestrator, which re-dispatches only the affected task group.

### Roles (`.claude/agents/`)

**Planning role: `planner`.** Planning is a role of its own, but it runs as the **main session**, not as a subagent, because the interview needs direct contact with the user and subagents never talk to the user. It ships as `.claude/agents/planner.md` and is started with `claude --agent planner` (other tools: the `sf-plan` skill with the same instructions).

| Aspect | Planner |
| --- | --- |
| Model, effort | opus, high |
| Tools | Read, Grep, Glob, Bash (`specfold`, `openspec`, `graphify query`), Write/Edit only under `openspec/changes/**`, `Agent(scout, spec-writer, plan-critic)` |
| Job | runs `sf-interview` until the brief is confirmed; decides change boundaries (one or several changes); hands the brief to `spec-writer`; turns `tasks.md` into an execution plan: task groups, file ownership, dependency graph, which groups may run in parallel, which pattern to use; shows the breakdown in the plan and asks the user to approve it |
| Hands over to | the orchestrator role (same session or a new session per change) for apply |

An optional **`plan-critic`** subagent (different model, read-only) reviews the brief, specs and execution plan before approval: missing scenarios, hidden assumptions, overlapping file ownership, groups that cannot really run in parallel, groups too big for one subagent, tasks without `Done when:`, hidden dependencies between groups. Its findings go back to the planner, who turns open points into interview questions instead of guessing.

Roles below are the subagents the planner and the orchestrator use:

| Agent | Model, effort | Tools | Isolation | Job |
| --- | --- | --- | --- | --- |
| `scout` | haiku or sonnet, low | Read, Grep, Glob, Bash(`specfold lookup`, `graphify query`, `openspec show`) | none (read-only) | answers one question from knowledge, code graph and specs; returns at most \~30 lines |
| `spec-writer` | opus, high | Read, Write, Edit, Bash(`openspec`, `specfold`) | change worktree | writes proposal, delta specs, design, `knowledge.md`, and `tasks.md` in the task-breakdown shape; updates `tasks.md` when an implementer returns a split proposal |
| `implementer` | sonnet, medium | full minus `Agent`, minus `git push` | `isolation: worktree` | implements one task group from its task packet, task by task with one commit each; returns a split proposal instead of widening its scope |
| `verifier` | a different model than the implementer, high | Read, Grep, Bash(tests, `openspec`, `specfold gate --local`) | none (read-only) | `/opsx:verify`, full tests, gate; returns pass or a findings list |
| `knowledge-curator` | sonnet, medium | Read, Write, Edit, Bash(`specfold`) | change worktree | sf-sync after archive, sf-audit on request |
| `integrator` (optional) | sonnet, low | Bash(git), Read | change worktree | merges implementer branches in order, resolves only generated-file conflicts, escalates real ones |

All roles preload the matching sf skill via `skills:`, set `maxTurns`, and only the orchestrator may spawn agents (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2`, `Agent` removed from every role).

### Three patterns

1. **Several changes at once** (most common, biggest speed-up): one background session per change via `claude --worktree <change-name>` or agent view (`claude agents`). Each runs the full loop and opens its own PR. Before dispatching, `specfold wt plan` checks active changes for overlapping capabilities or source globs and serializes those.
2. **One change, parallel task groups:** every group in `tasks.md` owns its files (`files: [src/checkout/**]`, see Task breakdown). The orchestrator spawns one `implementer` per group whose dependencies are merged, merges their branches, then runs `verifier` and `knowledge-curator`.

**Task packets.** The orchestrator dispatches one task group per implementer, never a whole change. Each implementer gets a compact packet: the group's tasks, its owned files, the linked scenarios, the relevant excerpt of `brief.md` and the knowledge concepts linked from the proposal. It works the tasks in order, ticks each one and makes one commit per task with the `Task:` trailer.

**Split instead of grow.** If a task needs files outside the group's `files:` or clearly exceeds the size limits, the implementer stops and returns a split proposal. The orchestrator has `spec-writer` update `tasks.md` (and asks the user if the split changes scope), re-runs `specfold tasks check`, then re-dispatches. Implementers never widen their own scope.
3. **Large mechanical changes** (renames, migrations across many files): Claude Code's `/batch` or a dynamic workflow, wrapped in one OpenSpec change with `skip_specs: true` if no behavior changes.

Agent teams stay off by default: they are experimental and do not isolate teammates in worktrees.

### Worktree setup

| Concern | Setting |
| --- | --- |
| Base for subagent worktrees | `worktree.baseRef: "head"` in `.claude/settings.json`; the default (`fresh`, remote default branch) would not contain the change's own commits |
| Location | default `.claude/worktrees/`, added to `.gitignore`; `specfold wt` uses the same folder for other tools |
| Gitignored files | `.worktreeinclude`: `.env*`, local config, and `graphify-out/` so each worktree starts with the code graph and only updates it incrementally |
| Dependencies | a `SessionStart` hook runs `specfold wt setup` when it detects a fresh worktree: install with the shared package cache, nothing else |
| Git hooks | `core.hooksPath` lives in the shared git config, installed once; it applies in every worktree |
| Parallel test runs | `specfold wt setup` assigns `SPECFOLD_WT_INDEX`; test config derives ports and database names from it |
| Generated files | `knowledge/**/index.md` and `log.md` are never merged by hand: `.gitattributes` marks `log.md` as `merge=union`, and indexes are regenerated with `specfold index` after each merge |
| Archive | only one change archives at a time, after rebasing on the default branch (OpenSpec's archive aborts on scenario drift in MODIFIED requirements); a GitHub merge queue enforces the order |
| Cleanup | Claude Code removes clean subagent worktrees itself; `specfold wt clean` removes merged ones for other tools |

### Limits

Parallel sessions multiply token use, and what is affordable depends on each person's subscription plan. So **the user decides the limit**, not the kit:

- `specfold init` and `sf-migrate` ask once: "How many subagents may run at the same time?" with a short note on token cost. Pressing Enter takes 3.
- The answer is a **personal** setting, stored in `.claude/settings.local.json` (not committed) as `env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, so teammates on different plans keep their own values. Tools without that setting read `parallel.max_subagents` from `.specfold/local.yaml` (also gitignored).
- Change it any time with `specfold parallel set <n>`; `specfold parallel show` prints the current value and where it comes from. `specfold parallel set 1` turns parallel work off: the orchestrator then runs task groups one after another.
- The same limit caps pattern 1: `specfold wt plan` never suggests more parallel change sessions than the limit allows.
- Spawn depth stays fixed at 2 and scouts stay on cheap models; `specfold stats` reports cost per change so the user can tune the number.

Decided: in pattern 2 the orchestrator merges implementer branches (no PR per implementer), and agent teams are not used.

New CLI commands for this part: `specfold wt plan` (overlap check), `specfold wt new <change>` (worktree + branch + setup, for tools without built-in worktrees), `specfold wt setup`, `specfold wt clean`, `specfold parallel set <n>` and `specfold parallel show`. Milestone **M8** covers the agent definitions, task packets, split instead of grow, settings, these commands and a test run of pattern 2 on the sample app with three parallel task groups from a `tasks.md` that passes `specfold tasks check`.

## Updating the framework from user repos

Any repo using the kit updates itself with one command, `specfold upgrade`, or with a skill that drives it. The kit never overwrites project content, and every upgrade lands as a normal PR that passes the gate.

**Ownership: three classes of files.** Every file the kit installs is listed in a committed manifest, `.specfold/manifest.json`, with its class and the hash of the shipped version. That makes upgrades work even for repos created from the GitHub template, which have no git link to the kit.

| Class | Examples | On upgrade |
| --- | --- | --- |
| Kit-owned | `scripts/specfold.mjs`, `.specfold/hooks/*`, `.agents/skills/sf-*`, `openspec/schemas/specfold/`, `.claude/hooks/*.sh`, `.github/workflows/specfold-gate.yml`, `.claude/agents/*` | replaced if unchanged locally; if changed, three-way merge against the old shipped version, conflicts left for review |
| Managed blocks | sections between `<!-- specfold:begin -->` / `<!-- specfold:end -->` in `AGENTS.md` and `CLAUDE.md`; kit keys in `openspec/config.yaml`, `.claude/settings.json`, and the Specfold entry in an existing hook manager's config | only the managed part is replaced; everything outside stays |
| Project-owned | `knowledge/` content, `openspec/specs/`, `openspec/changes/`, values in `specfold.yaml`, `.specfold/local.yaml` | never touched; content migrations only produce a report and suggested edits |

**`specfold upgrade` flow:**

1. `specfold upgrade --check`: compares `kit_version` with the latest release on the chosen channel (`stable` or `next`) and prints the changelog excerpt. Cheap, no writes.
2. `specfold upgrade [--to <version>]`: creates branch `specfold/upgrade-<version>`, downloads the release tarball, verifies its SHA-256 against the release, and runs **the new version's** upgrader from the tarball. This avoids the old CLI having to understand future formats.
3. Dry-run plan first: files to add, replace, merge, remove, plus config migrations. `--yes` applies it.
4. Apply: replace and merge files per class, run versioned migrations (`migrations/<version>.mjs`, idempotent) for `specfold.yaml`, schema and profile changes, then update `.specfold/manifest.json` and `kit_version`.
5. Follow-ups: `openspec update`, `specfold agents sync`, `specfold hooks install`, `specfold index`, `specfold validate`, `specfold gate --local`.
6. Report: `.specfold/upgrade-report.md` with what changed, conflicts, and manual steps from the release's upgrade notes. Commit and open a PR.

Rollback is `git revert` of the upgrade PR, because nothing happens outside git.

**Private kit repo supported.** Specfold must work when the kit repo is private. The release source is configurable in `specfold.yaml`:

```yaml
source:
  github: <owner>/specfold      # default; or:
  # url: https://example.internal/specfold/releases/   (any HTTPS mirror)
  # path: ../specfold/dist/                            (local checkout, offline)
```

- Downloads from a private GitHub repo authenticate through the user's `gh` login or a `GITHUB_TOKEN`/`SPECFOLD_TOKEN` env var; nothing is ever written into the repo.
- The weekly upgrade workflow in user repos needs a secret with read access to the kit repo (fine-grained token or GitHub App), because the default `GITHUB_TOKEN` only covers its own repo. `specfold init` explains this and skips the workflow if no secret is set.
- `BOOTSTRAP.md` works the same way: the agent uses the user's `gh` login to fetch the release.
- A private template repo can still be used with "Use this template" by anyone with access to it.

**Ways to trigger it:**

- **Manually:** `specfold upgrade` in a terminal.
- **From an agent:** skill `sf-upgrade` runs the CLI, resolves conflicts in managed and kit-owned files with judgment, applies the manual steps from the upgrade notes, and stops before merging.
- **Automatically:** optional workflow `specfold-upgrade.yml` (weekly) runs `specfold upgrade --check --json` and, if a new version exists, opens the upgrade PR like Dependabot does. Teams opt in during `specfold init`.
- **Reminder:** the SessionStart hook prints one line when an upgrade is available, at most once a day.

**Release side (kit repo):** semver where a major version means breaking profile, schema or gate changes; every release ships the template tarball, its SHA-256, a `CHANGELOG.md` entry with an **Upgrade notes** block written for agents, and a compatibility line for OpenSpec and OKF versions. CI in the kit repo upgrades the fixture repos from the previous two releases on every release candidate.

### Versioning

Specfold has **one product version** (semver, tag `vX.Y.Z`) that the updater works with. Formats inside it carry their own small integer versions, so the upgrader knows exactly which migration to run.

| What | Version | Where it is recorded |
| --- | --- | --- |
| Framework release | semver `X.Y.Z`, pre-releases `X.Y.Z-rc.N` | git tag, `package.json` of the kit, `kit_version` in each user repo's `specfold.yaml` |
| Knowledge profile | `profile_version: 1` | `specfold.yaml` |
| OpenSpec schema `specfold` | `version: 1` (OpenSpec's own field) | `openspec/schemas/specfold/schema.yaml` |
| Manifest format | `manifest_version: 1` | `.specfold/manifest.json` |
| External tools | supported ranges, e.g. `openspec: ">=1.15 <2"`, `okf: "0.2"` | `requires:` in `specfold.yaml`, checked by `specfold doctor` |

**What counts as which bump** (judged from a user repo's point of view):

| Bump | Examples |
| --- | --- |
| Major | a warning gate rule becomes blocking, stricter profile rules, schema artifact added or renamed, file or command renamed, a required tool's major version |
| Minor | new command, skill, concept type, warning-only gate rule, new optional config key |
| Patch | bug fixes, wording in skills and templates, performance |

**Policies:**

- **Pre-1.0:** while at `0.x`, a minor release may break; its upgrade notes say so and the upgrader still migrates automatically.
- **New gate rules** always ship as warnings first and become blocking only in the next major, so an update never turns a green repo red without warning.
- **Deprecation:** deprecated in a minor (with a warning from `specfold doctor` and the CLI), removed in the next major.
- **Upgrade paths:** any version within the same major upgrades directly; across majors the upgrader steps through the latest release of each major in order and runs every migration on the way. Migrations are chained and idempotent.
- **Version skew:** if `.specfold/manifest.json` was written by a newer framework version than the local CLI, the CLI refuses write commands and tells the user to run `specfold upgrade`; read-only commands still work.
- **Channels:** `stable` gets only final releases, `next` also gets `-rc` builds. Set per repo in `specfold.yaml` (`channel:`).
- **Release automation:** conventional commits (with a type-matched gitmoji, see `/decisions/commit-convention.md`) plus release-please in the kit repo generate the changelog and release notes grouped by type, the tag, the template tarball and its SHA-256. Release commits are `chore(release): 🔖 vX.Y.Z`. The kit repo allows only rebase merges, so every granular commit reaches the changelog. Every release candidate runs the upgrade test against fixture repos from the previous two minors and the previous major.
- **Dogfooding:** the kit repo itself records its own `kit_version` and is upgraded with the released upgrader, like any user repo.

This replaces the one-line `specfold upgrade` entry in the CLI table and is milestone M9.

## Quality loops

Three mechanisms keep specs, code and knowledge honest over time. All three are deterministic except the retro, which is a short agent step with a human answer.

### 1. Spec-to-test traceability

Every OpenSpec scenario gets a stable id derived from its capability path and a kebab-case slug of its title: `checkout/guest-checkout#guest-pays-without-account`. Tests reference the ids they cover, in any language's comment or test name:

```ts
// spec: checkout/guest-checkout#guest-pays-without-account
test("guest pays without an account", () => { /* ... */ });
```

- `specfold trace` lists every scenario with the tests that reference it, and every test reference that points to a scenario that no longer exists.
- New gate rule **G15** (block): a scenario added or modified in the PR has no test reference; a test references a removed or renamed scenario.
- Existing scenarios without tests (for example right after migration) only warn, so adoption is gradual.
- `verifier` runs `specfold trace --change <name>` and treats an uncovered scenario as a failed verification.
- If OpenSpec's ids or headings change shape, only `specfold trace` needs adapting; check this in the verify list.

### 2. Drift detection for knowledge

A concept can go stale long before its `stale_after` date, when the code it describes changes. Specfold detects that from git alone:

- For every concept, collect the repo paths it depends on: `resource`, `sources[].resource`, and code files that reference it with `see knowledge:`.
- If any of those files changed in a commit newer than the concept's latest `verified[].at` (or `generated.at` when unverified), the concept is **possibly stale**.
- `specfold drift` lists those concepts with the commits that triggered them. `sf-lookup` shows the flag when it returns the concept, so agents read it with care.
- New gate rule **G16**: a PR that changes such a file but does not touch or re-verify the dependent concept gets a warning comment naming the concept; it blocks only if `gate.block_on_drift: true` in `specfold.yaml` (default false).
- Re-verifying (`specfold verify`) or updating the concept clears the flag.

### 3. Retro loop that improves the interview

After every archive, `sf-sync` asks the user two quick questions through the native question UI:

1. Which question should the interview have asked earlier?
2. Where did the agent guess instead of asking?

Answers go into `knowledge/conventions/interview-checklist.md` (a `Convention` concept, grouped by topic: data, auth, UI, migrations, ...). `sf-interview` loads the matching groups as extra branches of its design tree in the next change. Skipping the retro is allowed and recorded; the checklist only grows from real answers, never from agent guesses.

## Backlog, deferred commitments and vision

Specfold keeps the project's future inside the knowledge bundle, next to its present, so agents see both. Three new areas, all ordinary OKF concepts:

| Folder | `type` | Holds | Key fields (profile extensions) |
| --- | --- | --- | --- |
| `knowledge/vision/` | `Vision` | where the project is heading: goals, non-goals, principles; usually one to three concepts | `horizon` (e.g. `2027`), human-verified only |
| `knowledge/commitments/` | `Deferred Commitment` | things the project has promised to do later, or constraints future work must keep possible | `committed_by: human:<login>`, `trigger` (date or condition, e.g. "before 1.0", "when EU customers onboard"), `state: open \| fulfilled \| withdrawn`, `vision:` link, `stale_after` = due date if any |
| `knowledge/backlog/` | `Backlog Item` | ideas and implementations that are needed later but not now | `state: open \| promoted \| dropped`, `origin` (interview, retro, change id, human), `priority: low \| medium \| high`, `change:` once promoted |

The difference matters: a **backlog item** is optional and may be dropped; a **deferred commitment** is a promise and may only be fulfilled or explicitly withdrawn by a human, with a reason.

**How the workflow uses them:**

- **Interview:** anything the user puts out of scope is offered (via the question UI) as a backlog item; "not now, but we must before X" becomes a deferred commitment. Both are written only after the plan approval.
- **Planning and design:** `sf-lookup` always returns the vision and the open commitments whose topic touches the change. `design.md` gets a rule in `config.yaml`: list affected commitments and confirm the design does not block them.
- **Promotion:** `specfold backlog promote <item>` starts a new change from a backlog item (the item becomes the seed of the interview) and sets `state: promoted` plus `change:`. Fulfilling a commitment works the same way and sets `state: fulfilled` after archive.
- **Retro:** new ideas from the retro questions land in the backlog.
- **Audit and gate:** `specfold audit` lists overdue commitments (trigger date passed), commitments without a vision link, and backlog items untouched for a configurable time. Gate rule **G17** warns when a PR's design contradicts an open commitment flagged by the verifier, and blocks a change that sets a commitment to `withdrawn` without a human `verified` entry.
- **Session start:** the hook prints one line with the number of open commitments due within 30 days.

**CLI:** `specfold backlog add | list | promote | drop` and `specfold commitments list | fulfill | withdraw`. Writing a `Deferred Commitment` or `Vision` requires a human actor, enforced like G7.

Optional later: two-way sync of backlog items with GitHub Issues. The kit repo itself starts using the backlog right away: the items in "Later" below become its first backlog items.

## Milestones

Build in this order; each milestone ends with its own PR and green CI in the kit repo. **M0 comes first:** create the repo skeleton with the dogfooding split, seed `knowledge/decisions/` and `knowledge/references/` from this plan by hand (no CLI yet), and write the first specs for `specfold-validate` and `specfold-index` as OpenSpec changes (`add-specfold-validate`, `add-specfold-index`) that M1 implements and archives, so `openspec/specs/` only ever describes behavior that exists. From M1 on, every milestone runs as an OpenSpec change in the kit repo itself.

| # | Milestone | Done when |
| --- | --- | --- |
| M0 | Repo skeleton with the dogfooding split (`template/` payload vs. own `knowledge/` and `openspec/`); hand-written decisions, references, vision; backlog seeded from "Later"; first specs for `specfold validate` and `index` | skeleton committed; specs reviewed by the user |
| M1 | Knowledge profile + `specfold validate`, `index`, `lookup`, `new`, `log`, `doctor`; `see knowledge:` scan | fixture tests pass; patched `acme_retail` passes `--okf-only` and the upstream copy fails with exactly the known findings; golden index files match |
| M2 | OpenSpec integration, plus the template's own `specfold.yaml` and the code-comment convention concept `template/knowledge/conventions/code-comments.md` (moved from M1, decided 2026-10-26): `specfold` schema with `brief` and `knowledge` artifacts, templates (including the task-breakdown `tasks` template and instruction), `config.yaml` (including `rules.tasks`), `specfold change check`, `specfold tasks check`, `specfold status`, `specfold resume`, `specfold sync` | in `examples/sample-app`, interview → propose → archive → sync leaves `specfold validate`, `specfold tasks check` and `openspec validate --strict` green |
| M3 | Skills `sf-lookup`, `sf-capture`, `sf-sync`, `sf-audit`, `sf-interview`, `sf-plan`; `specfold audit` (added 2026-10-26, so sf-audit calls the CLI); `planner` agent with plan-mode approval (working without subagents until M8); `AGENTS.md` (linking the code-comment convention), `CLAUDE.md`, `specfold agents sync` | the sample change works in Claude Code (native questions, plan approval) and in one other tool reading `.agents/skills` |
| M4 | Gate G1–G18 (warn/block as specified), `specfold gate`, `specfold verify`, CI workflow, built-in git hooks and adapters, Claude Code hooks, CODEOWNERS, PR template | one test PR per blocking rule fails for the right reason; a clean PR passes; the gate is required on the kit repo |
| M5 | Quality loops (`specfold trace`, `specfold drift`, retro) and backlog, commitments, vision with their CLI commands | traceability and drift reported correctly on the sample app; a backlog item promoted to a change end to end |
| M6 | `sf-migrate` + `BOOTSTRAP.md` | migration runs on its own branch on two fixture repos (ADRs and docs/; Cursor rules and an existing `openspec/`); rerun is idempotent; refuses on the default branch |
| M7 | Token layer: `specfold stats`, G11 budget, graphify recipe, permission deny list | always-loaded set reported; documented before/after numbers on the sample app |
| M8 | Subagents and parallel work: agent definitions, task packets, split instead of grow, `specfold wt`, `specfold parallel`, worktree settings | pattern 2 runs three task groups from a `tasks.md` that passes `specfold tasks check` in parallel worktrees on the sample app and merges cleanly; one implementer returns a split proposal instead of widening its scope |
| M9 | Upgrader, versioning, release automation, docs; first release `v0.1.0` | upgrading fixture repos from `0.1.0-rc` builds changes only kit-owned files and managed blocks; a locally modified kit file produces a three-way merge; the weekly workflow opens a correct PR |

Names in this table follow the Naming section. Each milestone after M0 runs as an OpenSpec change in the kit repo (see Self-hosting).

## Later

Ideas agreed on but deliberately not in the first build:

- **`Pitfall` knowledge type:** recurring agent mistakes in a repo, always returned by `sf-lookup` for matching areas.
- **General code conventions:** style, naming and patterns in `knowledge/conventions/`, with linters as enforcement where possible.
- Evals for the framework itself and a secrets guard (`gitleaks` via the git hooks and CI) are still open (undecided). They are carried over into the new repo as open backlog items in M0, so the decision is made there through the normal workflow.

## Verified before building

The points below were checked against current docs and, for OpenSpec and lefthook, with the real CLIs on 2026-10-26. The summaries live in the kit's own `knowledge/references/` with a 30-day `stale_after`; this list records what changed in the plan.

| Topic | Result | Plan consequence |
| --- | --- | --- |
| OpenSpec schema (1.15.0) | fork, custom `knowledge` and first artifact `brief` work; `requires` is advisory; archive does not check schema artifacts | `specfold change check` and the gate are the only enforcement (see OpenSpec setup) |
| OpenSpec `--tools agents,claude` | `agents` writes skills only (`.agents/skills/openspec-*`); `claude` adds `/opsx:*` commands; `--language English` exists | holds as planned |
| OpenSpec explore | no config hook for skills | interview triggered by `brief` instruction and `AGENTS.md` |
| Claude Code skills | `.agents/skills/` is not read; symlinked skill folders are supported | `specfold agents sync` writes symlinks |
| Claude Code hooks | `SessionStart` stdout goes to context; `PostToolUse`/`Stop` exit 2 feed stderr back; 10,000-char output cap; `Stop` block cap of 8 | holds; Stop hook is feedback, not enforcement |
| Claude Code `AGENTS.md` | read natively only without `CLAUDE.md` | keep `@AGENTS.md` in `CLAUDE.md` |
| `AskUserQuestion` | 1-4 questions, 2-4 options, header ≤ 12 chars, `multiSelect`, automatic "Other"; `askUserQuestionTimeout` (off by default) lets Claude continue on its own | holds; never set the timeout, re-ask on timeout |
| `claude --agent` + `permissionMode: plan` | `--agent` runs the main session with the agent's tools and model; frontmatter `permissionMode` is documented for subagents only; `ExitPlanMode` approval switches to auto or manual-approve | test in M3 before relying on it |
| OKF | SPEC v0.2 current; only the root `index.md` may carry frontmatter (`okf_version`); timestamps need an explicit offset (`Z` allowed); `last_modified` lives in `sources[]` entries; no official validator; okf.md is an unofficial site | profile and references adjusted; okf.md dropped from sources |
| OKF `acme_retail` | at `bundles/acme_retail/`; violates the spec (`log.md` frontmatter, paths without leading `/`) | patched fixture plus upstream copy (see specfold CLI tests) |
| graphify 0.9.95 | `install --project --platform agents` is skill-only; `graphify claude install` writes a CLAUDE.md section plus the PreToolUse guard; `--code-only` belongs to `extract`; `GRAPHIFY_BACKEND=none` | skill plus guard registered by Specfold, no instruction blocks |
| lefthook 2.2.2 | keys valid; `**` does not match zero folders by default; npm shim breaks across worktrees (#1398) | replaced by built-in hooks with adapters |
| GitHub API for G7 | works with `pull-requests: read`, also for forks; several traps | see Merge gate |

## Sources

- [OKF SPEC.md v0.2 (GoogleCloudPlatform/open-knowledge-format)](https://github.com/GoogleCloudPlatform/open-knowledge-format)
- [Google Cloud Blog: OKF v0.2 adds trust signals](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals)
- [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec): `docs/customization.md`, `docs/cli.md`, `docs/supported-tools.md`, `schemas/spec-driven/schema.yaml`
- [OpenSpec release notes](https://releasebot.io/updates/fission-ai/openspec)
- [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) (README in the `graphifyy` 0.9.95 package)
- [Graphify review (CodeConductor)](https://codeconductor.ai/blog/graphify-review/) for the reported token savings and caveats
- Earlier concept: [Konzept: Knowledge Base (OKF) + OpenSpec](https://claude.ai/artifact/ArsahNicFGQknyPk9q96xB)
