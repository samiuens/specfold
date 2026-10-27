# Design

## Context

- **`specfold migrate`** (`add-specfold-migrate`) does the mechanics: the branch rule, state, inventory and install. Before install the repository has no `scripts/specfold.mjs`, so the skill runs the CLI from the unpacked template folder.
- **`specfold doctor`** without `specfold.yaml` fails D2 and D5 and warns D4. Only D1 (Node) and D3 (OpenSpec) matter before install.
- **Skills:** the sf skills live in `template/.agents/skills/`. The kit's and the sample app's `.agents/skills/` are byte copies, and the `.claude/skills/` links are checked by `agents sync --check` in the kit, the template and the sample app.
- **Approvals:** the planner, `sf-interview` and `sf-plan` ask the user to state their login when approving (`/architecture/agent-layer.md`); the plan checkpoint does the same.

## Goals / Non-Goals

**Goals:**
- one skill whose every mechanical step is a `specfold migrate` call;
- a plan the user approves before anything is installed;
- two recorded runs that show the M6 rules on real fixtures.

**Non-Goals:** CLI changes (`skip_specs`); bulk conversion of other spec tools; worktrees (M8); stats (M7).

## Decisions

- **`SKILL.md`** stays short. It covers when to use the skill, the CLI path before and after install, the nine steps with their `specfold migrate` calls, and the rules. Details live in `references/`:
  - `plan.md`: the plan template (domains, mapping table, seed cap, gate timeline, approval);
  - `conversion.md`: per source kind, what to write;
  - `report.md`: the report template.
- **CLI path:** `<kit>` is the unpacked template folder that `BOOTSTRAP.md` gives, or that the skill asks the user for. Steps 1-4 run `node <kit>/scripts/specfold.mjs`, and from step 5 on the skill runs `node scripts/specfold.mjs`.
- **Resume first:** every run starts with `migrate status`, and the skill continues at the named step.
- **Preflight:** `migrate start`, then `doctor`. Before install only D1 and D3 must pass, and D3 is fixed by installing OpenSpec, never by skipping it.
- **Plan checkpoint:**
  - the plan has a mapping table with one row per inventory source: `source | becomes | target | note`, where `becomes` is a concept type, an `AGENTS.md` section, `keep` or `ignore`;
  - the plan also lists the capability domains, the source globs and stack for install, the seed cap (30) and the gate timeline (G4 from the PR after the migration);
  - the user approves in the question UI, choosing "Approve as <login>" or editing;
  - on approval the skill appends `## Approval` with `approved_by: human:<login>` and `approved_at` from `date`, then runs `migrate mark plan` and commits;
  - a timed-out or missing answer stops the run.
- **Install:** `migrate install --from <kit> --source-glob ... --stack ...` with the plan's values. On a conflict the skill shows each one and asks what to do, and never deletes or overwrites anything to get past it. It then runs `doctor` (all must pass), commits, and continues.
- **Convert**, per plan row, with `specfold new`:
  - an ADR becomes a `Decision`; its status maps to `decision:` (accepted → `accepted`, superseded or deprecated → `deprecated` linking the successor, proposed → `proposed`), and the body summarizes Context and Decision;
  - an agent rule file becomes a `Convention`; the file itself stays, because the managed block already sits in `AGENTS.md`;
  - `docs/` pages become the type the plan names;
  - another spec tool gets one capability card per spec or folder, pointing at it with `resource` and marked as a migration candidate in the report;
  - every concept gets `sources` pointing at the original (`../../<path>` from the concept), `status: draft`, and `generated` through `specfold new`;
  - originals are never moved or deleted.
- **Seed from code:** `Component` and `Interface` concepts from the folders in `source_globs`, or from `graphify-out/` when it exists, plus `Term` concepts for domain names, up to the cap. Each one names its code with `resource`.
- **Validate and report:** `specfold index`, `specfold validate`, `openspec validate --all --strict`, then `report.md` with counts per type, every draft for human verification, conflicts, migration candidates, long rationale comments found in code (listed, never moved), and open questions. Then `specfold log add --kind Migration`.
- **PR:** the skill asks before `git push` and before opening the PR. The PR body links `plan.md` and `report.md`.
- **Recorded runs:**
  - each fixture is copied into a scratch git repository and migrated with the skill, with the user approving each plan;
  - `examples/migrations/<fixture>/` gets the resulting `plan.md` and `report.md`, plus a `README.md` with the commands and their outcomes: own branch, a second `install` that reports up to date, refusal on `main`, and validate passing.

## Risks / Trade-offs

- [The skill's plan step is judgment, so two runs on the same repo can differ] → the plan is the checkpoint: the user approves the mapping, and the recorded runs show one approved example per fixture.
- [`approved_by` in `plan.md` is a human claim outside `knowledge/`] → it records the question-UI answer like a brief's `confirmed_by`. The migration PR's review is where a human confirms it.

## Commitments

none
