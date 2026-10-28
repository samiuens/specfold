# Design

## Context

- **Drift baseline:** the later of the latest `verified[].at` (or `generated.at`) and the last commit that touched the concept file; editing or verifying a concept clears its flag.
- **Re-check method:** each flagged concept was read against `git diff f27caa4 8c9b3d1 -- docs/plan.md` (the six plan edits), against `d070d9f` for the test helper, and against the code as it is now.
- **The English line** in the kit's `openspec/config.yaml` context reads `Language: English. All artifacts are written in English; keep OpenSpec headings and SHALL/MUST in English.`

## Goals / Non-Goals

**Goals:** every flag ends either in an edit that fixes the concept or in a human verification; nothing is edited only to clear a flag.

**Non-Goals:** CLI changes; concepts without a flag.

## Decisions

- **Edits only where the text is wrong:** the four mismatches and the runbook source. The other 25 concepts stay unchanged, so their flags clear only when the user verifies them.
- **The English line** goes first in the template's context, word for word as in the kit's config, and into the sample app's config, which mirrors the template. `config.yaml` is not in the install manifest, and migrate keeps a repository's own context, so only new and template repositories get it.
- **The verification list** goes into the PR body: one line per concept with the plan edits that flagged it and why the concept still holds.

## Risks / Trade-offs

- [The user verifies a concept without reading it] → each line names the reason, so a doubtful one is easy to spot and leave flagged.

## Commitments

none
