## Wish

The eight gaps the recorded pattern-2 run found in the kit are fixed, so the next parallel run needs no workaround in the dispatch prompt: subagents hand back only finished results, packets show what is done, branches never collide, merged worktrees can be cleaned during a run, and the task-scope checks work when Specfold sits in a subfolder.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How do implementer branches stay unique across rounds? | The implementer keeps the branch its worktree was created on and reports it; it no longer creates `<change>-group-<n>` | user |
| Q2 | What does a packet show for finished tasks? | Ticked tasks are marked `[done]`, and the rules say to start at the first open task | user |
| Q3 | How do T10 and T11 count files when `specfold.yaml` sits in a subfolder? | Commit files are read relative to the Specfold root; files outside it count toward neither scope nor size | user |
| Q4 | What about Claude Code listing skill copies inside worktrees? | Documented in `sf-apply` and the worktree runbook as harmless; no code change | user |
| Q5 | How are merged worktrees cleaned during a run? | `specfold wt clean --base <ref>` compares against any branch; `sf-apply` runs it with the change branch after each merge round | user |
| Q6 | Does the pattern-2 record change? | One line below its findings names this change; the backlog item is closed when the change is synced | user |
| Q7 | Which wording fixes need no decision? | Roles send their final message only after their last command succeeded; the verifier runs the gate with `--base <default branch>`; `sf-apply` says a background subagent on the change branch owns it until it reports, and that the orchestrator runs sf-sync's retro | knowledge:/backlog/fix-the-parallel-run-findings.md |

## Out of scope

- A second pattern-2 run to prove the fixes.
- Other backlog items (`integrator`, `plan-critic`, cost per change).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:38:32+01:00
