# Backlog Item

* [Check the Specfold name before publishing](name-and-trademark-check.md) - Check GitHub and trademark registers for Specfold before the kit repo or npm package goes public.
* [Cost per change in stats](cost-per-change-in-stats.md) - specfold stats reports the tokens a change cost, so each person can tune their subagent limit; needs the agent tool's local transcripts.
* [Escaped pipes in brief tables](escaped-pipes-in-brief-tables.md) - The brief and knowledge table parser splits cells on an escaped pipe, which GFM allows inside a table cell.
* [Evals for the framework itself](framework-evals.md) - Decide whether and how to evaluate Specfold's skills and agent roles with repeatable evals.
* [Fix the parallel run findings](fix-the-parallel-run-findings.md) - Eight kit gaps found by the pattern-2 run: packets, branch names, the gate in a nested root, the verifier's base and sf-apply wording.
* [General code conventions](general-code-conventions.md) - Style, naming and pattern conventions in knowledge/conventions/, with linters as enforcement wherever a tool can check them.
* [Init sets the gate as a required check](init-sets-the-gate-as-a-required-check.md) - init and migrate install offer to make specfold-gate a required check on the default branch through a GitHub ruleset.
* [Integrator subagent role](integrator-subagent-role.md) - A cheap subagent that merges implementer branches in order, resolves only generated-file conflicts and escalates real ones.
* [Let agents verify confident decisions](let-agents-verify-confident-decisions.md) - A per-repository setting for whether an agent may verify a decision it is confident about, told apart from a human verify.
* [Measure a task run with and without graphify](measure-a-task-run-with-and-without-graphify.md) - One recorded agent task run with and without graphify, preferably on a repository much larger than the sample app, to complete M7's before/after numbers.
* [Merged requirement length check](merged-requirement-length-check.md) - Check before archive that every requirement a change merges into the main specs stays under OpenSpec's 500 characters.
* [Native CLI instead of Node](native-cli-instead-of-node.md) - Compare a compiled CLI (Go, Rust or a Bun-compiled binary) with the bundled scripts/specfold.mjs: install, size, platforms and the upgrade hand-off.
* [Pitfall knowledge type](pitfall-knowledge-type.md) - A Pitfall concept type for recurring agent mistakes in a repo, always returned by sf-lookup for matching areas.
* [Plan-critic subagent role](plan-critic-subagent-role.md) - A read-only subagent on a different model that reviews a brief, specs and task breakdown before the user approves the plan.
* [Read barriers for other agents](read-barriers-for-other-agents.md) - Ignore or permission files for agents other than Claude Code (Codex, Cursor and others), matching the template's Claude Code deny list.
* [Secrets guard](secrets-guard.md) - Decide whether to ship a secrets check (for example gitleaks) through the git hooks and CI.
* [Skills CLI for skill updates](skills-cli-for-skill-updates.md) - Decide in M9 whether specfold upgrade uses the skills CLI (npx skills update) to keep shipped and third-party skills current.
* [Two-way sync of backlog items with GitHub Issues](github-issues-sync.md) - Optionally mirror backlog items to GitHub Issues and back, so teams can triage the backlog where they already work.
