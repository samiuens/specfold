---
type: Capability
title: specfold drift
description: Why drift is computed from git alone, and where the contract for specfold drift lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T18:02:54+01:00 }
---

# Why

`stale_after` catches concepts that age, but not concepts whose code changed under them last week. Git already knows which files a concept describes and when they changed, so `specfold drift` flags a concept as possibly stale without asking an agent ([deterministic CLI](/decisions/deterministic-cli.md)). Lookup shows the same flag, so agents read such a concept with care, and gate rule G16 names it on the PR that changed the code ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **What a concept depends on.** Its `resource`, its `sources` that resolve to files or folders in the repository (the same resolution validate's L2 uses), and every file whose `see knowledge:` comment names it ([code comments point to knowledge](/decisions/code-comments-point-to-knowledge.md)). URLs never count.
- **From when changes count.** The later of the concept's latest verification (or its `generated.at`) and the last commit that touched the concept file. Editing or re-verifying the concept moves that point, so it clears the flag; a code change committed before the concept's own commit doesn't flag it.
- **Committer dates only.** Uncommitted work never counts. A rebase can only make a concept look staler, never fresher.
- **Warn by default.** G16 warns when a branch changes a file a concept depends on without touching that concept, and blocks only with `gate.block_on_drift: true`, because a code change often doesn't affect what the concept says ([a required CI check blocks merges](/decisions/blocking-merge-gate.md)).
- **Lookup pays only for what it prints.** The flag is computed for the returned results after `--limit`, and left out outside a git repository.
- **On the kit, most drift comes from the plan.** Many concepts cite `docs/plan.md`, so every plan edit flags them; that is intended, because the plan is what they summarize.

# Related

- [specfold lookup](/capabilities/specfold-lookup.md)
- [specfold verify](/capabilities/specfold-verify.md)
- [specfold CLI](/architecture/specfold-cli.md)
