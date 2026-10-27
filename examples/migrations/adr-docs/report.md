# Migration report: orders-service

## Result

- Branch: specfold/migration (from main at d03eb21)
- Kit: 0.0.0 from the kit's template folder (no release yet)
- Concepts written: 9 (3 Decision, 1 Convention, 1 Data Flow, 1 Runbook, 1 Component, 1 Interface, 1 Term), all draft
- Seeded from code: 3 of the cap 30
- Checks: specfold validate, specfold index --check and openspec validate --all --strict pass

## Needs human verification

- knowledge/conventions/contributing.md (from CONTRIBUTING.md)
- knowledge/decisions/use-postgresql.md (from docs/adr/0001-use-postgres.md)
- knowledge/decisions/session-tokens-in-local-storage.md (from docs/adr/0002-session-tokens.md, superseded)
- knowledge/decisions/signed-session-cookies.md (from docs/adr/0003-session-cookies.md)
- knowledge/architecture/request-flow.md (from docs/architecture.md)
- knowledge/runbooks/local-setup.md (from docs/setup.md)
- knowledge/architecture/orders-module.md (seeded from src/orders.js)
- knowledge/architecture/orders-endpoint.md (seeded from src/index.js)
- knowledge/domain/order.md (seeded from src/orders.js)

## Install conflicts

none

## Migration candidates

none

## Rationale comments in code

none

## Left out

- README.md: kept as the entry point for humans.
- Seed candidates beyond the three written: none; the code has two modules.

## Open questions

- `specfold audit` reports A4 for the superseded decision: its successor names it in text rather than linking it, because linking a deprecated concept is A3. Verify or drop it during review.
