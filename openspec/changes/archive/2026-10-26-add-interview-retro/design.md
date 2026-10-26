# Design

## Context

- **Skills:** the sf skills live in `template/.agents/skills/`. The kit's `.agents/skills/` and the sample app's are byte copies, checked by CI.
- **Commands from earlier M5 changes:** `add-specfold-backlog` added `specfold backlog` and `specfold commitments`; `add-specfold-drift` added the lookup flag `drift`; lookup now ends with the vision and open commitments.
- **The sample app** has one archived change (`add-due-dates`) and one planned change from the M3 agent check (`add-priorities`), which stays untouched.

## Goals / Non-Goals

**Goals:** skills that use the new commands; a retro that only records what the user said; a sample run that proves trace, drift and promotion on a real repository.

**Non-Goals:** CLI changes (`skip_specs`); a separate retro skill; finishing `add-priorities`.

## Decisions

- **sf-sync, new steps after the bundle is clean:**
  - **Fulfill:** when the brief or proposal names a deferred commitment as delivered by this change, ask the user in the question UI, then run `specfold commitments fulfill <c> --change <name>`.
  - **Retro:** one question-UI call with the two questions:
    - which question should the interview have asked earlier;
    - where did the agent guess instead of asking.

    Each has a free-text answer and an option "Skip retro". A skipped, empty or timed-out round counts as skipped.
  - **Checklist:** answers go into `knowledge/conventions/interview-checklist.md` as `- <question> (from <change>)` under `## <Topic>` inside `# Convention`. The file is created with `specfold new Convention conventions/interview-checklist.md` on the first answer, and the agent picks the topic from the answer (Data, Auth, UI, Migrations, or a new one).
  - **Ideas:** new ideas from the answers become `specfold backlog add --origin retro`.
  - **Log:** `specfold log add --kind Retro "<change>: N answers"` or `"<change>: retro skipped"`.
- **sf-interview:**
  - step 1 reads the checklist when it exists and adds the questions of the topics the change touches as branches;
  - a new step before the plan approval offers everything put out of scope as a backlog item, as a deferred commitment ("not now, but before X"), or as nothing, one question each;
  - after approval it writes them with `specfold backlog add --origin interview` and `specfold new "Deferred Commitment"`, leaving `committed_by` to the human.
- **sf-lookup:**
  - adds the `drift` flag to the trust levels;
  - says that the block "vision and open commitments" after the results is context for planning, not a hit;
  - says that an unverified vision is a draft.
- **Sample proof**, run inside `examples/sample-app` with the kit's pinned OpenSpec:
  - `specfold backlog add "Rename an item" --origin human`;
  - `specfold backlog promote rename-an-item --name add-rename`;
  - an interview with the user through the question UI, then brief, proposal, delta spec, knowledge and tasks;
  - implementation with `spec:` references in tests;
  - archive, `specfold sync`, and the retro.

  `specfold trace` and `specfold drift` outputs go into the PR.
- **Backlog item for the kit:** `specfold backlog add "Check merged requirement length before archive" --origin retro --priority medium`.

## Risks / Trade-offs

- [The retro depends on the agent following sf-sync] → the log entry makes a missing retro visible in review; a deterministic check can come later.
- [A topic chosen by the agent could misfile an answer] → the user's words stay verbatim; only the heading is the agent's.

## Commitments

none
