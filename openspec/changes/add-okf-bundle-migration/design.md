# Design

## Context

See proposal.md - Why. `migrate inventory` classifies tracked files by path (`classify` in `tools/specfold/src/migrate/inventory.ts`) and never reads frontmatter, so concepts in `knowledge/` are either missed or, under `knowledge/decisions/`, taken for `adr`. `migrate install` writes the template's `specfold.yaml` as text with line edits (`projectSettings` in `install.ts`), which keeps its comments. The migration state lives in `.specfold/migration/state.json` with the base commit and finished steps (`migrate/state.ts`). The pre-commit and Claude post-edit hooks validate only staged or edited concepts (`hooks/run.ts`, `hooks/claude.ts`); the Claude stop hook runs the local gate over the whole bundle. Most of the existing-bundle path is agent work that the sf-migrate skill and its references describe.

## Goals / Non-Goals

**Goals:**
- The inventory, the plan and install know an existing bundle, so the agent follows the skill instead of improvising.
- An agent can stop and resume halfway through rewriting a bundle without hooks blocking it, while the PR still has to be clean.

**Non-Goals:**
- The CLI rewriting concepts, links or references itself; that stays agent work guided by the skill.
- Reading `plan.md` in any command.

## Decisions

**D1. Classify bundle files by frontmatter, before path rules.** `classify` gets the file text for Markdown under `knowledge/`: a frontmatter `type` makes it `okf-concept`, an `index.md` or `log.md` makes it `okf-index`. The suggested type comes from a fixed map (ADR, Playbook, Domain Concept, App) and from the types of the repository's `specfold.yaml`, else from a built-in list equal to the template's types; a test keeps that list equal to `template/specfold.yaml`. Alternative: a separate `migrate bundle` command; rejected, one inventory keeps the plan's "one row per source" rule simple.

**D2. Install appends detected types and folders by line edits.** After the template's `types` list and `folders` mapping, install appends the bundle's extra types (first appearance by path) and top-level folders (without a description, since OKF forbids frontmatter in folder indexes), keeping the template's comments. Only a `specfold.yaml` that install creates is touched. Alternative: parse and re-dump YAML; rejected because it drops the template's comments.

**D3. One relief helper shared by three hooks.** `migrate/relief.ts` reads the state: conversion is under way while `convert` is not marked; a file is an unchanged original when its bytes equal `git show <base>:<path>`. pre-commit and post-edit turn L1/L2 and original-file findings into warnings; claude-stop drops G1/G10 findings that are link findings or lie in originals from its blocking set and prints them. pre-push and the gate never call the helper. Alternative: validate reads the plan's mapping table to excuse only planned link targets; rejected in the brief (Q10).

**D4. The skill carries the existing-bundle path.** sf-migrate gets an "Existing bundle" branch at the plan step. `references/plan.md` gains a type-map table, tooling and rule-file rows, an "After conversion" section (originals to delete, references to rewrite, tooling to remove, types and folders to drop), a commitments checkpoint and every `specfold.yaml` type in **Becomes**. `references/conversion.md` gains the rewrite rules: one new concept per original in Specfold's folders with permalink `sources`, full rationale kept, links and outside references rewritten (a `git grep` of each old path), indexes regenerated with intro text moved into concepts or folder descriptions, AGENTS.md rules sorted (dedupe, Convention, keep). `references/report.md` gains "Deviations" and "References rewritten". The kit's own copy in `.agents/skills/sf-migrate/` stays identical (CI compares them).

**D5. Permalinks from the origin remote.** The agent builds `https://github.com/<owner>/<repo>/blob/<base>/<path>` from `git remote get-url origin` and the base commit `migrate status` shows; without a GitHub origin it uses the original path and names the base commit in the report. No CLI support: the format is one line in `conversion.md`.

## Risks / Trade-offs

- [The migration PR rewrites and deletes every concept, which is a large review] → the plan lists every row up front, the report maps each original to its rewrite, and `sources` permalinks keep each original one click away.
- [Rewriting references outside the bundle touches code files] → only exact old paths are replaced, each file is listed in the report, and the gate's G14 catches a `see knowledge:` reference left pointing at a missing concept.
- [The relief hides a real broken link until convert is marked] → the gate and pre-push stay strict, and `migrate mark convert` ends the relief before the report step validates everything.
- [The built-in type list drifts from the template] → a test compares it with `template/specfold.yaml`.

## Commitments

- [Migrate a repository that already has an OKF bundle](/commitments/migrate-an-existing-okf-bundle.md): kept
