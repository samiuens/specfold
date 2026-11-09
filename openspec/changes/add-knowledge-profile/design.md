# Design

## Context

See proposal.md - Why. Today the file set is fixed: `kitOwned(from, tools)` in `tools/specfold/src/migrate/install.ts` lists the kit-owned paths and is shared by `migrate install` and the upgrade plan (`upgrade/plan.ts`). `init` works on a repository that already holds the extracted template, so every template file is present before it runs; `template/.specfold/manifest.json` carries the SHA-256 of each template file. `profile_version` exists in `specfold.yaml` but no code reads it. OpenSpec is reached in `init`, `migrate/install`, `doctor` (D3), the gate (G3 through `gate/openspec.ts`, G4-G6, G13, G15, G17, G18) and the hooks; the hooks only call OpenSpec when files under `openspec/` are staged.

## Goals / Non-Goals

**Goals:**
- One place decides which files a profile installs, shared by init, migrate and upgrade.
- A repository without `profile` behaves exactly as today (byte-identical installs and plans).
- The knowledge profile never needs the openspec binary.

**Non-Goals:**
- Removing OpenSpec files from an installed full repository.
- Changing `profile_version` or the OKF profile rules `validate` checks.

## Decisions

**D1. `profile` as a named key next to `profile_version`.** The user chose a named profile. Alternatives: a `specs: false` boolean (it cannot grow a third profile), folding the name into `profile_version` (a breaking schema change upgrade would have to migrate), and a separate template payload per profile (every release asset and upgrade fixture doubles). `loadConfig` in `repo.ts` reads it into `Config.profile` and throws a usage error for an unknown value, so every command validates it the same way.

**D2. One profile filter over `kitOwned`.** `kitOwned(from, tools, profile)` drops `openspec/schemas/specfold`, `.agents/skills/sf-{plan,apply,sync}` and every `.claude/agents/*` except `scout.md` for `knowledge`. Install, upgrade and init's removal step all call it. Alternative: per-file profile tags in the template manifest; rejected as more moving parts for a two-value split.

**D3. Block variants in `template/.specfold/profiles/knowledge/`.** The folder holds the knowledge variants of the managed-block content for `AGENTS.md`, `CLAUDE.md` and `.github/pull_request_template.md`. The block writer picks the variant by profile; a missing variant falls back to the full content. The folder is kit-owned in both profiles (like `.specfold/workflows/`), so init has it after extraction and upgrade can refresh it. Alternative: profile sections inside one file with extra markers; rejected because the markers would leak into user repositories and complicate the three-way merge.

**D4. Init removes template leftovers by manifest hash.** For `--profile knowledge`, init compares each file outside the knowledge set with the hash in `.specfold/manifest.json` (the template's) and deletes only exact matches, reporting differing ones as kept. This keeps init safe on a repository that already changed a template file.

**D5. The manifest records `profile`.** Upgrade compares it with `specfold.yaml`: equal means a normal upgrade with that profile's set; `knowledge` to `full` plans the full set at the target (the installed version when nothing is newer) and adds `openspec init` plus the template's `config.yaml` to the follow-ups; `full` to `knowledge` exits with 2. A manifest without `profile` counts as `full`.

**D6. Gate rule selection by profile; G19 shares G4's code.** `gate/rules.ts` reads the head config's profile and skips the OpenSpec rules for `knowledge` before calling `gate/openspec.ts`, so OpenSpec is never spawned. G19 reuses G4's source-glob match, adoption-PR exemption and label check, parameterised by the reason line (`No-knowledge reason:`) and the satisfying paths (anything under the bundle root). A new rule id keeps findings and summaries unambiguous. Alternative: reuse `G4` with a different message; rejected because findings, docs and escape lines would mean different things per profile.

**D7. Doctor D3 short-circuits.** For `knowledge`, D3 returns `ok` without spawning a binary. D2 surfaces the `loadConfig` profile error as a failure instead of letting it throw.

**D8. sf-interview has a knowledge path.** The skill checks `profile` in `specfold.yaml`; in the knowledge profile it asks the open decisions the same way and records the outcome as concepts through sf-capture (a Decision, Business Rule or Convention) instead of writing `brief.md`. The skill-description budget (60 tokens) is kept.

## Risks / Trade-offs

- [The template's AGENTS.md and its knowledge variant drift apart] → a kit test asserts both variants carry the same non-workflow sections (map, core rule, knowledge rules) apart from the OpenSpec lines.
- [A command still touches `openspec/` in a knowledge repository] → a fixture repository with `profile: knowledge` and no `openspec/` runs init, doctor, gate, hooks, stats, lookup and validate in tests.
- [G19 is satisfied by a trivial `log.md` line] → accepted; it mirrors how G4 accepts any change-folder edit, and G16 drift warnings still point to concepts whose dependent paths changed.
- [`no-knowledge` vs `no-spec` escape label confuses teams that switch to full] → the switch-to-full upgrade report names `gate.escape_label` as a value to review; upgrade never changes settings itself.

## Migration Plan

Additive: existing repositories have no `profile` and keep the full behavior. The next release ships `.specfold/profiles/knowledge/`; repositories pick it up on upgrade. Rollback is reverting the release; knowledge-profile repositories created in between would need `profile` removed and a full reinstall.

## Commitments

- [Migrate a repository that already has an OKF bundle](/commitments/migrate-an-existing-okf-bundle.md): kept
