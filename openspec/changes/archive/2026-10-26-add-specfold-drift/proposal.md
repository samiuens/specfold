# Proposal

## Why

`stale_after` catches concepts that age; it misses concepts whose code changed under them last week. Git already knows which files a concept depends on and when they changed, so drift can be detected without an agent, and surfaced where it matters: in lookup results agents trust, and on the PR that caused it.

## What Changes

- New command `specfold drift [<path>...] [--json]`: every possibly stale concept with the commits that made it so.
- A concept depends on its `resource`, its `sources[].resource` that resolve to repository files or folders, and the files whose `see knowledge:` comments name it.
- It is possibly stale when a dependent path changed in a commit newer than its baseline: the later of its latest `verified[].at` (else `generated.at`) and the last commit that touched the concept file.
- `specfold lookup` adds the flag `drift` to possibly stale results.
- New gate rule G16: a changed file some concept depends on, while the PR does not change that concept, gets a warning naming the concept; with `gate.block_on_drift: true` it blocks.

## Capabilities

### New Capabilities
- `specfold-drift`: drift detection for knowledge.

### Modified Capabilities
- `specfold-lookup`: the `drift` trust flag.
- `specfold-gate`: adds G16.

## Out of scope

- Uncommitted changes; drift is computed from commits only.

## Open points

1. **Paths:** `resource` values resolve like L2 source paths (bundle-absolute, or relative to the concept file); URLs and paths that don't exist are ignored. A folder counts through every file below it.
2. **Commit time** is the committer date, so rebases count as new commits; a rebase never makes a concept look fresher than it is.
3. **Re-verifying or editing the concept clears the flag**, because both change the concept file and so move the baseline.
4. **Lookup cost:** the flag is computed only for the returned results, with one `git log` per dependent path set.

## Impact

- New module `src/drift/`; reuses the `see knowledge:` scan from `src/indexes/refs.ts` and the source-path resolution of L2.
- `src/lookup/search.ts` gains the flag; `src/gate/rules.ts` gains G16.
