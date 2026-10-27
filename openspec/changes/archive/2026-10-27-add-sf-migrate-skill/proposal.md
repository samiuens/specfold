# Proposal

## Why

Existing projects are the second target of the kit (`/decisions/delivery-template-bootstrap-migrate.md`). Their knowledge already lives somewhere (READMEs, ADRs, agent rule files, other spec tools), and turning it into a reviewed bundle needs judgment the CLI cannot make: which domains exist, what each source becomes, what to leave alone. `sf-migrate` makes those calls with the user at one checkpoint and uses `specfold migrate` for every mechanical step, so the result is one reviewable PR on its own branch (`/decisions/migration-on-own-branch.md`).

## What Changes

- **Skill `sf-migrate`** in `template/.agents/skills/`, with `references/` for the plan and report templates and the conversion rules. It runs the plan's nine steps:
  1. preflight (`specfold migrate start`, then `specfold doctor`'s environment checks);
  2. inventory (`specfold migrate inventory`);
  3. plan checkpoint: writes `.specfold/migration/plan.md` (capability domains, a mapping table source → concept type and path / AGENTS.md section / keep as is / ignore, the seed cap, what the gate enforces from when), asks the user to approve or edit it, records the approval and runs `migrate mark plan`;
  4. install (`specfold migrate install`);
  5. convert per plan row: draft concepts with `sources` pointing at the original file; ADRs become `Decision`, agent rule files `Convention`; other spec tools get capability cards pointing at them, listed as migration candidates;
  6. seed from code, capped at 30 concepts unless the plan says otherwise, from graphify's report when present;
  7. no retroactive specs;
  8. validate (`specfold index`, `specfold validate`, `openspec validate --strict`) and write `.specfold/migration/report.md`;
  9. ask before pushing, then open the migration PR.
- Original docs are never deleted or moved; long rationale comments in code are listed in the report and never moved.
- **Copies:** the kit's `.agents/skills/sf-migrate`, the sample app's copy and the `.claude/skills` links follow the template.
- **Proof:** sf-migrate runs on both fixture repos from `add-specfold-migrate` in temporary git repos; the resulting `plan.md` and `report.md` are committed under `examples/migrations/<fixture>/`, together with a short README of each run (own branch, idempotent rerun, refusal on the default branch).

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- none (a skill, its copies and the recorded runs only; `skip_specs: true`)

## Out of scope

- Bulk conversion of other spec tools and retroactive specs.
- The worktree option (M8) and `specfold stats` in the report (M7).

## Open points

1. **Plan approval** is recorded in `plan.md` as `approved_by: human:<login>` and `approved_at` once the user approves in the question UI, like a brief's confirmation; a timed-out question is no approval and the skill stops.
2. **ADR status** maps to `decision:`: accepted → `accepted`, rejected → `rejected`, superseded or deprecated → `superseded` with `status: deprecated` and a link to the successor. A proposed ADR goes back to the user at the checkpoint. (Corrected while implementing: P11 allows only `accepted`, `rejected` and `superseded`, so the reviewed `deprecated` and `proposed` values would fail validation.)
3. **An existing `## graphify` section** in `AGENTS.md` or `CLAUDE.md` is listed in the plan and merged into the lookup order inside the managed block, as the token-efficiency section of the plan says.
4. **The log** gets one `specfold log add --kind Migration` entry naming the counts.
5. **Resume:** the skill always starts with `specfold migrate status` and continues at the next open step.

## Impact

- `template/.agents/skills/sf-migrate/` and its kit and sample-app copies; `examples/migrations/`.
- `knowledge/architecture/agent-layer.md` gains the skill.
