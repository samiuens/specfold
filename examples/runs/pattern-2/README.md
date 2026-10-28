# Pattern 2 run: one change, parallel task groups

A recorded run of M8's pattern 2 on the sample app, on 2026-10-28. One change, `add-exports`, was planned with the user and broken into task groups that own disjoint files. Three `implementer` subagents ran at the same time, each in its own worktree. Their branches merged cleanly, and one implementer returned a split proposal instead of widening its scope. The kit change `add-pattern-2-run` holds the plan of the run itself.

## Setup

- **Session:** Claude Code (Opus 5.5) as orchestrator in the kit repository, following `sf-apply` from `examples/sample-app/.agents/skills/`. The roles were the kit's `.claude/agents/`: implementers on Sonnet 5.5, `spec-writer`, `verifier` and `knowledge-curator`.
- **Settings:** the kit's `.claude/settings.json` with `worktree.baseRef: "head"` and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "1"`. No personal limit was set, so Claude Code's default of 20 applied; three groups ran at once.
- **The sample app lives inside the kit repository,** so every subagent worktree was a worktree of the kit. Each dispatch prompt therefore started with three lines before the packet:
  1. the sample app is `examples/sample-app/` in this repository, and the packet's paths are relative to it;
  2. run its tests with `npm test` from there, and commit with the kit's convention and the scope `template`;
  3. confirm the worktree holds the change's `tasks.md`, or stop with `BASE MISSING`.

  No implementer reported `BASE MISSING`: with `baseRef: "head"`, every worktree started from the orchestrator's commit.

## The change

`add-exports` adds three independent modules to the sample app:
- `toCsv(items)`: RFC 4180 CSV with the columns `id,title,done,due`;
- `fromJson(text)`: checks entries with the rules of `add`, and names the index of a bad entry;
- `summarize(items)`: returns `{ total, open, done, withDue }`.

The user answered the interview as product owner. `spec-writer` wrote the artifacts and returned two open questions instead of deciding them: what happens when `done` is not a boolean, and whether the index counts from 0. The user answered both.

The split was set up on purpose. Task 2.2 said to check due dates "with the same function `add` uses (`isCalendarDate` in `src/todo.js`, imported, not copied)". That function was private to `src/todo.js`, which group 2 did not own.

## Timeline

Times come from the commits and from `date` in the main session; the two verifier rows are estimated from its run time.

| Time | Event |
| --- | --- |
| 10:16:32 | Plan committed: groups 1 CSV export, 2 JSON import, 3 Summary, 4 Knowledge |
| 10:16:55 | Groups 1, 2 and 3 dispatched together, each with its `specfold tasks packet` output |
| 10:18:02 | Group 3: `summarize` committed, `DONE` (about 34 s) |
| 10:18:05 | Group 1: `toCsv` committed, `DONE` (about 38 s) |
| 10:18:17 | Group 2: task 2.1 committed, then `SPLIT PROPOSAL` for 2.2 (about 52 s) |
| 10:18:20 | Groups 3 and 1 merged with `--no-ff`; `tasks.md` auto-merged the ticks |
| 10:18:37 | Group 2's finished task 2.1 merged; the sample app's decision index regenerated |
| 10:21:12 | User approved the split; `spec-writer` reshaped `tasks.md`: new group 4 "Calendar check export" (`src/todo.js`), group 5 "Import due dates" (depends on 2 and 4), Knowledge moved to 6 |
| 10:21:54 | Group 4 handed back `placeholder` with staged but uncommitted work; resumed |
| 10:22:23 | Group 4: `export function isCalendarDate` committed, `DONE`; merged at 10:22:38 |
| 10:23:26 | Group 5: due-date check importing `isCalendarDate`, `DONE`; merged at 10:23:39 |
| 10:24:41 | Group 6: `knowledge-curator` wrote three capability cards (handed back `pending`, but the commit was complete) |
| about 10:25:40 | `verifier`: `FINDINGS`, one defect: text that is not JSON threw `SyntaxError` instead of `TypeError` |
| 10:26:42 | User chose the fixes; `spec-writer` added scenario "Non-JSON text", task 5.2 and task 1.2 (an unrelated `see knowledge:` comment) |
| 10:27:50 / 10:28:01 | Groups 1 and 5 ran in parallel again: tasks 1.2 and 5.2 committed, `DONE`; both merged by 10:28:13 |
| about 10:28:45 | `verifier`: `PASS`, 28 tests, all 14 scenarios cited by a test |
| 10:29:02 | `add-exports` archived in the sample app; `knowledge-curator` ran the sync at 10:29:18 |
| 10:30:34 | Sample-app retro (no answers) logged |

From the first dispatch to `PASS`, the run took about 12 minutes; most of that was waiting for the user's three decisions.

## The split proposal, word for word

```
SPLIT PROPOSAL
task: 2.2
needs: examples/sample-app/src/todo.js. `isCalendarDate` is a module-private function there (not exported), and the task requires importing it rather than copying it. Exporting it means editing src/todo.js, which group 2 does not own.
proposal: Add a small group "2b export-is-calendar-date" with files [src/todo.js], depends [], tasks: "export `isCalendarDate` from src/todo.js with no behavior change" (done when npm test passes). Then reshape the rest of group 2 (task 2.2: import `isCalendarDate` in src/import-json.js and check `due` when it is not null, throwing `entry <i>: due must be a YYYY-MM-DD date`; add the invalid-due-date-names-its-index test) to depend on 2b. Alternatively, let one agent own src/todo.js together with src/import-json.js for 2.2.
done so far: branch add-exports-group-2 (worktree .../agent-aa52181cc7e4bab66), 1 commit:
- 2.1 446adfc feat(template): ✨ parse and check titles and done flags in `fromJson`
```

It was handled as `sf-apply` describes:
1. Task 2.1 was merged as it stood.
2. The user chose the new group.
3. `spec-writer` reshaped `tasks.md`, keeping the ids of the finished tasks, and `tasks check` passed.
4. The new groups were dispatched in dependency order.

## Merges

Eight implementer branches were merged into `add-pattern-2-run` with `git merge --no-ff`, with no conflict. Concurrent ticks in `tasks.md` merged automatically, because every group's tasks sit on separate lines. `src/todo.js` changed by one word (`export`).

## What the run found in the kit

1. **Premature hand-offs.** Twice a subagent ended with a non-message: the group 4 implementer sent `placeholder`, after a rejected commit and before retrying, and the curator sent `pending`. The orchestrator checked git instead of trusting the message, and resumed group 4. The roles' final-message rule needs to say that the final message comes only after the last command succeeds.
2. **Packets don't mark finished tasks.** On re-dispatch, the packet listed tasks 1.1 and 5.1 again without saying they were done, so the dispatch prompt had to say so. `tasks packet` should mark ticked tasks, or list only open ones.
3. **Branch names collide across rounds.** The implementer's `git checkout -b <change>-group-<n>` failed in the second round, because the first round's worktree still had that branch checked out. The two implementers worked around it in different ways. Branch names need a round suffix, or the orchestrator should remove a merged worktree before re-dispatching. `wt clean` can't help during a run, because it only counts branches merged into the default branch.
4. **Task scope in a nested Specfold root.** In the sample app, the gate's task-scope check (G18, rules T10 and T11) reports every file as outside its group. Git paths carry the `examples/sample-app/` prefix, while `files:` globs are relative to `specfold.yaml`.
5. **The verifier's gate call.** Its instructions run `specfold gate --local`, which needs `--base <ref>` outside CI.
6. **Background by default.** Interactive sessions start subagents in the background (fork mode), the knowledge curator included. It edits the change branch directly, so the orchestrator must not touch the branch until it reports. `sf-apply` doesn't say that yet.
7. **The retro needs the main session.** sf-sync's retro asks the user, and subagents can't, so the orchestrator asked it. `sf-apply` step 9 should say so.
8. **Worktree skill noise.** While the worktrees existed under `.claude/worktrees/`, Claude Code also listed their copies of the sample app's skills as scoped skills in the main session. It was harmless, but noisy.

The run itself needed none of these fixed to finish. They are listed so a follow-up change can address them.
