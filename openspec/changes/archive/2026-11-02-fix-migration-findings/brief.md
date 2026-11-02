## Wish

"Let's start with the plain bugs from 1": fix the ten bugs (B1-B10) that the first real migration (Atrium, v0.2.1) found in doctor, hooks, index, log, new and migrate, as listed in `specfold-review.md` and `specfold-post-migration-feedback.md` and verified against v0.3.0.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | B1: D4 warns although lefthook runs Specfold's hooks, because install writes `node scripts/specfold.mjs hook` and D4 looks for `specfold hook` | D4 also accepts `specfold.mjs hook` in a hook manager's config | delegated |
| Q2 | B2: `log add` after `index` leaves the root index without its Log entry; where does the fix go? | Both: sf-migrate step 8 runs `log add` before `index`, and `log add` refreshes the root index when it creates `log.md` | user |
| Q3 | B3: pointers with several paths (`see knowledge: /a.md, /b.md`) only index the first; parse or warn? | Parse every comma-separated path; the shipped code-comment convention allows a list | user |
| Q4 | B4: how far should source-glob detection go? | Read package.json `workspaces` and `pnpm-workspace.yaml` (`<pattern>/src/**`); the fixed fallback list gains `apps` | user |
| Q5 | B5: D3 cannot find a repository-local OpenSpec before install | Without a `specfold.yaml` root, D3 also checks `node_modules/.bin/openspec` in the current directory | delegated |
| Q6 | B6: how is `state.json` kept out of git before install? | `migrate start` writes `.specfold/migration/.gitignore` with `state.json` | user |
| Q7 | B7: how does install avoid a second `@AGENTS.md` import in CLAUDE.md? | When the text outside the block already has a bare `@AGENTS.md` line, the block omits its import; text outside the markers stays untouched | user |
| Q8 | B8: `specfold new` writes `sources: []` only for Decision; Interface's `stale_after` is undocumented | Every type gets `sources: []`; sf-capture's types.md documents each type's defaults; Runbook and Interface keep `stale_after` | user |
| Q9 | B9: hooks install reformats unrelated lines of `lefthook.yml` | Install keeps every other value's text as it was (flow lists, folded scalars, long lines), extending the existing long-lines requirement | delegated |
| Q10 | B10: the Stop hook repeats every finding on every turn and ignores `stop_hook_active` | Keep blocking (the add-specfold-hooks decision stands); above 20 blocking findings print counts per rule and the first 10 findings. The 20/10 threshold was my choice | user |
| Q11 | Change boundaries | One change and one PR, a task group per capability | user |
| Q12 | Commit type | `fix` with the capability as scope: the fixes ship to users and belong in a release | delegated |

## Out of scope

- The "existing OKF bundle" migration path (OKF inventory kind, replacing originals as an opt-in, permalink sources, all types in the plan template, After-conversion and Deviations sections, pending links and quieter hooks during a migration, P13 at the plan checkpoint): a deferred commitment, trigger "before Specfold migrates another repository that already has an OKF bundle in knowledge/".
- `specfold refs rewrite --map`: backlog item.
- `validate --summary`: backlog item.
- Polish (`@generated` header on the bundled CLI, install note about the declined upgrade workflow, D7 hint during a migration, `stats` split by kit and repo skills, a doc line on `merge=union`): one backlog item.

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-11-02T09:55:08+01:00
