# Backlog Item

* [Check the Specfold name before publishing](name-and-trademark-check.md) - Check GitHub and trademark registers for Specfold before the kit repo or npm package goes public.
* [Escaped pipes in brief tables](escaped-pipes-in-brief-tables.md) - The brief and knowledge table parser splits cells on an escaped pipe, which GFM allows inside a table cell.
* [Evals for the framework itself](framework-evals.md) - Decide whether and how to evaluate Specfold's skills and agent roles with repeatable evals.
* [General code conventions](general-code-conventions.md) - Style, naming and pattern conventions in knowledge/conventions/, with linters as enforcement wherever a tool can check them.
* [Measure a task run with and without graphify](measure-a-task-run-with-and-without-graphify.md) - One recorded agent task run with and without graphify, preferably on a repository much larger than the sample app, to complete M7's before/after numbers.
* [Merged requirement length check](merged-requirement-length-check.md) - Check before archive that every requirement a change merges into the main specs stays under OpenSpec's 500 characters.
* [Pitfall knowledge type](pitfall-knowledge-type.md) - A Pitfall concept type for recurring agent mistakes in a repo, always returned by sf-lookup for matching areas.
* [Read barriers for other agents](read-barriers-for-other-agents.md) - Ignore or permission files for agents other than Claude Code (Codex, Cursor and others), matching the template's Claude Code deny list.
* [Secrets guard](secrets-guard.md) - Decide whether to ship a secrets check (for example gitleaks) through the git hooks and CI.
* [Skills CLI for skill updates](skills-cli-for-skill-updates.md) - Decide in M9 whether specfold upgrade uses the skills CLI (npx skills update) to keep shipped and third-party skills current.
* [Two-way sync of backlog items with GitHub Issues](github-issues-sync.md) - Optionally mirror backlog items to GitHub Issues and back, so teams can triage the backlog where they already work.
