# Design

## Context

This is the first code in the kit repo. The CLI contract is the delta spec. The constraints come from the plan and from decisions recorded in `knowledge/decisions/`:
- TypeScript on Node >= 20.19.
- One runtime dependency (`yaml`).
- Bundled into a single committed file (`/decisions/deterministic-cli.md`).

M1 tooling decisions (2026-10-26):
- The CLI package lives in the npm workspace `tools/specfold` (package name `specfold`, bins `specfold` and `sf`).
- Tests run on vitest.
- Biome handles lint and format.
- The bundle goes only to `scripts/specfold.mjs`; the `template/` copy arrives with the release job in M9.

## Goals / Non-Goals

**Goals:**
- `specfold validate` as specified, deterministic and read-only.
- A small CLI core (argument parsing, repo and config discovery, findings, human and JSON output) that `index`, `lookup`, `new`, `log` and `doctor` reuse.
- Tests that map one-to-one to spec scenarios through `// spec: specfold-validate#<scenario-slug>` comments, so `specfold trace` (M5) can read them later.

**Non-Goals:**
- Type-specific rules for `Vision`, `Deferred Commitment`, `Backlog Item` (M5).
- Any rule needing git history or GitHub (gate, M4).

## Decisions

**Accepted open points** (from the proposal's first draft, accepted as proposed):
1. Warnings appear in human output only as a count; `--json` lists them.
2. `decision` is required on every `Decision` (rule P11).
3. A body over 300 lines is a warning (P10).
4. Broken links are errors unless `gate.block_on_broken_links: false`; they are ignored under `--okf-only`.
5. Non-URL `resource` paths have to resolve (L2).
6. Uppercase SHALL/MUST outside code spans and fenced code are an error (P9).

**Module layout** (`tools/specfold/src/`):

| Module | Responsibility |
| --- | --- |
| `cli.ts` | entry point: argument parsing (no dependency), command dispatch, exit codes, `--version`, `--help` |
| `repo.ts` | repository root discovery (nearest `specfold.yaml` upward) and config loading |
| `findings.ts` | `Finding` type, ordering, human and JSON rendering |
| `bundle.ts` | bundle walk (skipping dot folders), frontmatter split with body line offsets |
| `validate/okf.ts` | OKF-1 to OKF-3 |
| `validate/profile.ts` | P1 to P11 |
| `validate/links.ts` | L1, L2 |
| `validate/index.ts` | runs the rule sets for the selected mode and paths |

**Errors as values:**
- Rules return findings and never throw.
- Usage and environment problems raise a `UsageError` or `EnvError`, which `cli.ts` maps to exit code 2.

**Frontmatter parsing:**
- `yaml`'s `parseDocument` gives line numbers for parse errors.
- Timestamps stay strings (`schema: core` without the timestamp type), so offset checks see the original text.

**Fixtures:**
- `test/fixtures/valid/` is a complete valid bundle with its own `specfold.yaml`.
- Each rule test copies it into a temporary folder and breaks exactly one thing. That covers "each rule broken once" without dozens of near-identical folders.
- `test/fixtures/acme-retail/` holds the OKF sample at upstream commit `ad30107` in two copies:
  - `upstream/`: unchanged, with the Apache-2.0 license.
  - `patched/`: no frontmatter in `log.md`, leading `/` on bundle paths; the patch is documented in `PATCH.md`.

**Bundle:**
- `npm run build -w specfold` runs esbuild to produce `scripts/specfold.mjs`: ESM, Node 20 target, `yaml` inlined, shebang.
- CI rebuilds it and fails when the committed file differs.

## Risks / Trade-offs

- **Patched acme_retail:** if OKF changes the sample, the fixture is stale. It is pinned to a commit, and the OKF reference's `stale_after` flags upstream drift.
- **TypeScript 7 / esbuild:** esbuild strips types without type-checking, so `tsc --noEmit` runs separately in `npm run check`.
- **Bundle drift:** a committed bundle can drift from its source. The CI freshness check prevents that.
