# Proposal

## Why

sf-migrate assumes a repository's docs live outside `knowledge/`. A repository whose `knowledge/` already is an OKF bundle, with its own types, hand-written indexes and tooling, falls outside the skill: the first such migration (v0.2.1) went beyond it, and `~/Development/iac` is next. This change builds that path and fulfils `/commitments/migrate-an-existing-okf-bundle.md`, using the knowledge profile from `/decisions/knowledge-profile.md` as a possible target. It relies on `/capabilities/specfold-migrate.md`, `/decisions/migration-on-own-branch.md`, `/decisions/managed-blocks.md` and `/decisions/humans-verify-only.md`. No rejected decision covers this idea.

## What Changes

- `migrate inventory` lists concepts of an existing bundle as `okf-concept` with their `type` and a suggested Specfold type, and the bundle's `index.md` and `log.md` as `okf-index`.
- `migrate install` fills `types` and `folders` of a `specfold.yaml` it creates from an existing bundle, so validate passes right after install.
- The pre-commit and Claude post-edit hooks only warn about broken links and about unchanged original concepts while a migration's conversion is under way; the gate stays strict.
- sf-migrate and its references get the existing-bundle path: type mapping rows, tooling and rule-file rows, an "After conversion" section, rewriting concepts into Specfold's folders with permalink `sources`, removing originals, rewriting references to moved concepts, regenerating indexes, one rule for team AGENTS.md rules, a commitments checkpoint and a "Deviations" section in the report.

## Capabilities

### New Capabilities

### Modified Capabilities
- `specfold-migrate`: inventory kinds `okf-concept` and `okf-index`; install detects types and folders from an existing bundle.
- `specfold-hooks`: relief for expected findings during a migration's conversion.

## Impact

- Code: `tools/specfold/src/migrate/inventory.ts`, `migrate/install.ts`, `hooks/run.ts` and `hooks/claude.ts`; the bundles are rebuilt and `docs/commands.md` regenerated if usage changes.
- Template: `template/.agents/skills/sf-migrate/` (SKILL.md and references), mirrored in the kit's `.agents/skills/sf-migrate/`.
- Tests and fixtures under `tools/specfold/test/`, including a fixture repository with an existing OKF bundle.
- No dependency changes; repositories without a bundle migrate as before.
