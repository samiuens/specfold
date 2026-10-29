## Wish

Someone who has never seen Specfold can install it, use it and keep it up to date from the docs alone, and the command reference never drifts from the CLI. After this change, v0.1.0 is released.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | What do the docs cover? | The kit README (what, install, quick start) plus `docs/`: getting started, the workflow, a command reference generated from the CLI's usage lines and checked in CI, upgrading and private sources, and releasing | user |
| Q2 | What happens to `docs/plan.md`? | It stays as the historical build brief and says so at the top | user |
| Q3 | When is v0.1.0 released? | Right after this change merges, by merging release-please's PR set to `0.1.0` | user |

## Out of scope

- A docs website.
- Translations.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:53:11+01:00
