# Tasks

## 1. Packet

```yaml
files: [tools/specfold/src/tasks/packet.ts, tools/specfold/test/tasks-packet.test.ts]
depends: []
scenarios: [specfold-tasks#finished-tasks-marked]
agent: implementer
```

- [x] 1.1 Mark ticked tasks `[done]` in the packet and say where to start
  - Done when: scenario finished-tasks-marked passes in `tasks-packet.test.ts`

## 2. Nested root

```yaml
files: [tools/specfold/src/tasks/git.ts, tools/specfold/test/tasks-git.test.ts]
depends: []
scenarios: [specfold-tasks#specfold-root-in-a-subfolder]
agent: implementer
```

- [x] 2.1 Read task commit files relative to the Specfold root
  - Done when: scenario specfold-root-in-a-subfolder passes in `tasks-git.test.ts`

## 3. Clean against a base

```yaml
files: [tools/specfold/src/wt/worktrees.ts, tools/specfold/src/wt/command.ts, tools/specfold/test/wt.test.ts]
depends: []
scenarios: [specfold-wt#merged-into-the-change-branch, specfold-wt#unknown-base]
agent: implementer
```

- [x] 3.1 Add `--base <ref>` to `wt clean`
  - Done when: scenarios merged-into-the-change-branch and unknown-base pass in `wt.test.ts`

## 4. Roles

```yaml
files: [template/.claude/agents/**, .claude/agents/**, examples/sample-app/.claude/agents/**]
depends: []
scenarios: []
agent: implementer
```

- [x] 4.1 Send the final message only after the last command succeeded, in every role
  - Done when: each role's final-message rule says so and the three copies match
- [ ] 4.2 Let the implementer keep its worktree's branch
  - Done when: `implementer.md` no longer creates a branch and reports the one it is on
- [ ] 4.3 Run the verifier's gate with `--base`
  - Done when: `verifier.md` runs `specfold gate --base <default branch> --local`

## 5. Orchestrator skill

```yaml
files: [template/.agents/skills/sf-apply/**, .agents/skills/sf-apply/**, examples/sample-app/.agents/skills/sf-apply/**]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 5.1 Clean merged worktrees after each merge round and note the skill copies
  - Done when: `sf-apply` runs `wt clean --base <change branch>` after merging and says the listed worktree skills are harmless
- [ ] 5.2 Say who owns the branch and who runs the retro
  - Done when: `sf-apply` says a background subagent on the change branch owns it until it reports, step 9 gives the retro to the main session, and `check-skills.mjs` passes

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [1, 2, 3, 4, 5]
scenarios: []
agent: implementer
```

- [ ] 6.1 Rebuild the bundle, its copies and the template manifest
  - Done when: the copies equal `scripts/specfold.mjs` and `template-manifest.test.ts` passes

## 7. Run record

```yaml
files: [examples/runs/pattern-2/README.md]
depends: []
scenarios: []
agent: implementer
```

- [ ] 7.1 Name this change below the record's findings
  - Done when: the record's findings section ends with a line naming `fix-parallel-run-findings`

## 8. Knowledge

```yaml
files: [knowledge/**]
depends: [6, 7]
scenarios: []
agent: knowledge-curator
```

- [ ] 8.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync fix-parallel-run-findings` and commit its result in the same PR.
