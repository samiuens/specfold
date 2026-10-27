# Recorded migration: ADRs and docs

`sf-migrate` run on a copy of the fixture `tools/specfold/test/fixtures/migrate/adr-docs` (an orders service with a README, CONTRIBUTING, two docs pages and three ADRs), in a scratch git repository on 2026-10-27. The agent followed the skill step by step and installed from the kit's `template/` folder; the user approved the plan in the question UI.

- [plan.md](plan.md): the approved plan, as committed on the migration branch
- [report.md](report.md): the report written at the end

## Steps and outcomes

| Step | Command | Outcome |
| --- | --- | --- |
| 0 | `migrate status` | every step open; next: start |
| 1 | `migrate start`, `doctor` | `created specfold/migration from main`; D1 and D3 pass |
| 2 | `migrate inventory` | 7 sources (1 readme, 1 contributing, 3 adr, 2 docs), about 344 tokens; stack Node.js, globs `src/**` |
| 3 | plan, approval, `migrate mark plan` | approved as `human:samiuens`; committed |
| 4 | `migrate install --from <kit>/template --source-glob 'src/**' --stack Node.js`, `doctor` | 59 changes, 0 conflicts: `openspec init`, kit files, managed blocks, settings, `specfold.yaml`, knowledge skeleton, skill links, built-in hooks, manifest; all doctor checks pass |
| 5 | `specfold new` per mapping row, `migrate mark convert` | 6 concepts: 3 decisions (one superseded), 1 convention, 1 data flow, 1 runbook |
| 6 | seed, `migrate mark seed` | 3 concepts: the orders module, `GET /orders`, the term Order |
| 8 | `index`, `validate`, `openspec validate --all --strict`, report, `log add --kind Migration`, `migrate mark report` | all pass; `migrate status`: all migration steps are done |

## M6 checks

- **Own branch:** six commits on `specfold/migration`; `main` is unchanged.
- **Idempotent rerun:** a second `migrate install` with the same flags prints `migrate install: everything is up to date` and leaves `git status` clean.
- **Refusal on the default branch:** `migrate install` on `main` exits with 1 (`not on specfold/migration: run specfold migrate start first; nothing was written`); `migrate start` on a feature branch exits with 1 as well.
- **Gate:** `specfold gate --base main` passes with 0 warnings and names the branch an adoption PR.

## Found in this run

- **ADR status values:** the first draft of the conversion rules mapped a superseded ADR to `decision: deprecated`, which validate's P11 rejects. The rules now map it to `superseded` with `status: deprecated`, and send a proposed ADR back to the user.
- **Superseded decisions:** linking the superseded decision from its successor is audit finding A3, and leaving it unlinked is A4. The successor now names it in text, and the report lists the A4 for review.
- **Manifest base on a conflict:** both fixes changed kit files after this run had installed them, so the next install reported two conflicts and dropped their manifest entries. Install now keeps the hash a file was installed with. The run then refreshed the two files from the kit (one extra commit) before the rerun above, which is the upgrader's job from M9 on.
