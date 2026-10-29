# Decision

* [A required CI check blocks merges](blocking-merge-gate.md) - The specfold-gate CI check is required and blocks merges; local hooks only give early feedback.
  * Referenced from code: tools/specfold/src/gate/require.ts:2
* [Built-in git hooks with adapters instead of lefthook](built-in-git-hooks.md) - Specfold installs its own git hooks via core.hooksPath and adds one entry to an existing hook manager instead of requiring lefthook.
* [Claude Code skills are symlinks into .agents/skills/](skills-symlinked-for-claude.md) - specfold agents sync links each .agents/skills/<name> into .claude/skills/ instead of copying it.
* [Code comments point to knowledge](code-comments-point-to-knowledge.md) - Code comments stay short; rationale lives in knowledge and the comment only references it with see knowledge:.
* [Commit convention for the kit repo](commit-convention.md) - Kit-repo commits use Conventional Commits with a type-matched gitmoji, subject only, the human as author and the agent as co-author; not shipped.
  * Referenced from code: scripts/check-commit.mjs:3
* [Custom OpenSpec schema with brief and knowledge artifacts](custom-openspec-schema.md) - Changes use the custom schema specfold, forked from spec-driven, with a first brief artifact and a knowledge artifact.
* [Delivered as template repo, bootstrap prompt and migration skill](delivery-template-bootstrap-migrate.md) - One kit repo ships a template for new projects, a paste-able bootstrap prompt and a migration skill for existing ones.
* [English only](english-only.md) - Knowledge, specs, skills and docs are written in English.
* [Every change is broken down into task groups, and subagents work on groups](task-breakdown.md) - tasks.md splits each change into task groups with owned files and small tasks with a done check; one implementer takes one group, never a whole change.
* [Every install and upgrade path works from a private kit repo](private-kit-repo.md) - Release downloads authenticate through gh or a token, so the kit works while its repo is private.
* [Everything that must be correct is deterministic code](deterministic-cli.md) - Validation, indexing and gate checks live in the specfold CLI; skills call it and never re-implement its checks.
* [First specs are OpenSpec changes, not baseline specs](specs-start-as-changes.md) - Specs for not-yet-built commands are written as OpenSpec changes and only reach openspec/specs/ when implemented and archived.
* [graphify is optional, code-only, and writes no instruction blocks](graphify-code-only.md) - The kit recommends graphify for code navigation, in code-only mode, installed as a skill plus a Claude Code guard and never as an instruction block.
  * Referenced from code: tools/specfold/src/graphify/setup.ts:9
* [Kit content in repo-owned files lives in managed blocks](managed-blocks.md) - Specfold writes its part of AGENTS.md, CLAUDE.md and similar files between specfold markers, the only part upgrades rewrite.
  * Referenced from code: tools/specfold/src/migrate/blocks.ts:1
* [Kit knowledge at the root, payload in template/](dogfooding-split.md) - The kit repo keeps its own knowledge, specs and settings at the root; everything shipped to user repos lives in template/.
* [Knowledge is written before archive and synced after](write-knowledge-before-sync-after.md) - The Knowledge task group writes concept bodies before archive; specfold sync fills keys, stubs, index and log after archive, in the same PR.
* [Knowledge lives in its own OKF bundle](separate-knowledge-bundle.md) - Project knowledge is an OKF v0.2 bundle in knowledge/, separate from openspec/, so both stay readable by their own tools.
* [Migration only ever happens on its own branch](migration-on-own-branch.md) - sf-migrate refuses to run on the default branch or an unrelated feature branch and works on specfold/migration.
* [OKF sample acme_retail is tested as a patched fixture](acme-retail-patched-fixture.md) - The upstream acme_retail sample violates OKF, so the tests use a documented patched copy plus the unpatched copy as a negative fixture.
* [One product version, small integer versions for formats](versioning.md) - Specfold has one semver product version; the profile, schema and manifest carry their own integer versions.
* [Only humans verify knowledge](humans-verify-only.md) - Agents write concepts as draft; only a human adds verified entries, and the gate checks that the named human really approved.
* [Rather ask than assume](rather-ask-than-assume.md) - When a decision is open or something conflicts, agents ask the user through the native question UI instead of guessing.
* [Specfold is built with Specfold](self-hosting.md) - Every feature, fix and release of the kit runs through the kit's own workflow, switched on piece by piece as it is built.
* [Specs are the contract, knowledge is context](specs-vs-knowledge.md) - Specs hold normative behavior, knowledge holds descriptive context, and nothing is written twice.
* [The brand is Ink & Vermilion](brand-ink-and-vermilion.md) - Specfold's visual identity: warm paper, near-black ink, one vermilion accent, a folded-sheet mark, IBM Plex Sans and JetBrains Mono; kit only.
* [The framework is called Specfold](naming-specfold.md) - Specfold replaces the working names (kb, okf-openspec-kit); the CLI is specfold with alias sf, skills use the sf- prefix.
* [Tool-neutral first, Claude Code extras on top](tool-neutral-first.md) - The workflow runs on AGENTS.md, .agents/skills/, the CLI and CI; Claude Code hooks, subagents and skills are additions.
* [Upgrade file classes](upgrade-file-classes.md) - Which files an upgrade replaces, merges three ways or never touches, and why the installed release is the merge base.
  * Referenced from code: tools/specfold/src/upgrade/apply.ts:1
  * Referenced from code: tools/specfold/src/upgrade/config.ts:1
  * Referenced from code: tools/specfold/src/upgrade/plan.ts:1
