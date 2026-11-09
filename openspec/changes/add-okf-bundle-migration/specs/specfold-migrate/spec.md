# Spec Delta

## MODIFIED Requirements

### Requirement: Inventory
`migrate inventory` SHALL list every tracked file that is a knowledge source, with its kind (`readme`, `docs`, `adr`, `contributing`, `wiki`, `agent-rules`, `spec-tool`, `okf-concept`, `okf-index`) and a token estimate (characters / 4, rounded up), plus the detected stack, package layout and CI system, and store the result in the state.

#### Scenario: ADRs and Cursor rules
- **WHEN** the repository tracks `docs/adr/0001-use-postgres.md` and `.cursor/rules/style.mdc`
- **THEN** the inventory lists the first as `adr` and the second as `agent-rules`, each with a token estimate

#### Scenario: Ignored files
- **WHEN** `docs/build/out.md` exists but is ignored by git
- **THEN** the inventory does not list it

## ADDED Requirements

### Requirement: Existing bundle in the inventory
A Markdown file under `knowledge/` whose frontmatter has a non-empty `type` SHALL be listed as `okf-concept` with that `type` and a suggested Specfold type: `Decision` for `ADR`, `Runbook` for `Playbook`, `Term` for `Domain Concept`, `Component` for `App`, the same type when `specfold.yaml` or the template lists it, and none otherwise. Each `index.md` and `log.md` under `knowledge/` SHALL be listed as `okf-index`. Both kinds SHALL take precedence over every other kind.

#### Scenario: Concepts by type
- **WHEN** the repository tracks `knowledge/architecture/adr-0011-secrets.md` with `type: ADR` and `knowledge/apps/argocd.md` with `type: App`
- **THEN** the inventory lists both as `okf-concept`, the first with type `ADR` suggesting `Decision`, the second with type `App` suggesting `Component`

#### Scenario: Decisions folder in a bundle
- **WHEN** the repository tracks `knowledge/decisions/use-yaml.md` with `type: Decision`
- **THEN** the inventory lists it as `okf-concept` suggesting `Decision`, not as `adr`

#### Scenario: Type without an equivalent
- **WHEN** a concept under `knowledge/` has `type: Architecture`
- **THEN** the inventory lists it as `okf-concept` with no suggested type

#### Scenario: Hand-written index
- **WHEN** the repository tracks `knowledge/index.md` and `knowledge/apps/index.md`
- **THEN** the inventory lists both as `okf-index`

### Requirement: Existing bundle at install
When `migrate install` creates `specfold.yaml` and `knowledge/` holds concepts with a `type`, `types` SHALL hold the template's types followed by every other type those concepts use, in order of first appearance by path, and `folders` SHALL hold the template's folders followed by every other top-level folder under `knowledge/` that holds a concept, without a `description`.

#### Scenario: Bundle types and folders
- **WHEN** install runs in a repository without `specfold.yaml` whose `knowledge/apps/argocd.md` has `type: App`
- **THEN** `specfold.yaml` lists `App` after the template's types and `apps` without a description after the template's folders, and `specfold validate` reports no `P1` finding

#### Scenario: No bundle
- **WHEN** install runs in a repository without `knowledge/`
- **THEN** `types` and `folders` equal the template's
