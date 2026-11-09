## Wish

Could we make a knowledge-only mode, to avoid using specs in a repo like `~/Development/iac`? The repository keeps an OKF knowledge bundle and gets Specfold's knowledge tooling, gate and skills, but no OpenSpec specs or changes.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How does a repository choose knowledge-only mode? | A `profile` key in `specfold.yaml` with the values `knowledge` and `full`, default `full`, set with `specfold init --profile knowledge` or `specfold migrate install --profile knowledge`. `profile_version` stays the format version and is unchanged. One template; init, migrate and upgrade install only the files the profile needs. | user |
| Q2 | What keeps knowledge in step with code without changes and archive/sync? | A blocking gate rule: a diff touching `source_globs` must also change a file under `knowledge/`, or carry the escape label with a reason line in the PR body. | user |
| Q3 | Which skills does a knowledge-profile repository get? | sf-lookup, sf-capture, sf-audit, sf-upgrade, sf-migrate and sf-interview; sf-interview asks the open decisions but writes no `brief.md`. sf-plan, sf-apply and sf-sync are left out. | user |
| Q4 | Does this change also build the migration path for a repository that already has an OKF bundle? | No; that is a follow-up change, with iac as its first real run. | user |
| Q5 | Which gate rules does the knowledge profile turn off? | G3, G4, G5, G6, G13, G15, G18 and the design part of G17; every knowledge rule (G1, G2, G7-G12, G14, G16, the withdrawal part of G17) still runs. | delegated |
| Q6 | Which Claude Code subagents does the knowledge profile install? | `scout` only; planner, spec-writer, implementer, verifier and knowledge-curator work on OpenSpec changes. | delegated |
| Q7 | How does a knowledge repository switch to `full`? | Set `profile: full` and run `specfold upgrade --yes`; a profile that differs from the one in the manifest makes the upgrade reinstall the release, adding the OpenSpec parts, even at the installed version. | delegated |
| Q8 | What happens when a `full` repository sets `profile: knowledge`? | Not supported in this change: upgrade and init refuse with exit 2, naming the profile change, and write nothing. | delegated |
| Q9 | What is the knowledge profile's escape label and reason line? | `gate.escape_label` as today; the template's knowledge variant sets it to `no-knowledge` and the PR template asks for a `No-knowledge reason:` line. | delegated |

## Out of scope

- The migration path for repositories whose `knowledge/` already holds an OKF bundle (`/commitments/migrate-an-existing-okf-bundle.md`).
- Switching a `full` repository to `knowledge` (removing installed OpenSpec files, specs or changes).
- Migrating iac itself.

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-11-09T08:26:21+01:00
