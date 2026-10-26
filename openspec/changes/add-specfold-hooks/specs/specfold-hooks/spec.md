# Spec Delta

## Purpose

Defines how Specfold installs its git hooks (or entries in an existing hook manager), what each git hook checks, how extra commands run, and the entry points Claude Code hooks call.

## ADDED Requirements

### Requirement: Built-in hooks
Without a hook manager, `specfold hooks install` SHALL write one executable script per hook to `.specfold/hooks/`, for `pre-commit`, `pre-push`, `post-checkout`, `post-merge` and every hook named in `hooks.extra`, each running `node scripts/specfold.mjs hook <name> "$@"`, and SHALL set `git config core.hooksPath .specfold/hooks`.

#### Scenario: Fresh repository
- **WHEN** a repository without a hook manager runs `specfold hooks install`
- **THEN** `.specfold/hooks/pre-commit` exists and is executable, and `core.hooksPath` is `.specfold/hooks`

### Requirement: Hook manager adapters
When the repository uses lefthook, husky or pre-commit/prek, `specfold hooks install` SHALL leave `core.hooksPath` alone and add one entry per hook that runs `node scripts/specfold.mjs hook <name>` to that manager's configuration, without adding an entry twice.

#### Scenario: Lefthook in use
- **WHEN** `lefthook.yml` exists and `specfold hooks install` runs twice
- **THEN** `lefthook.yml` has exactly one `specfold` command under each hook, and `core.hooksPath` is unchanged

#### Scenario: Husky in use
- **WHEN** `.husky/` exists
- **THEN** `.husky/pre-commit` ends with a line running `node scripts/specfold.mjs hook pre-commit "$@"`

### Requirement: Foreign hooks path
When `core.hooksPath` is set to another folder and no known hook manager is found, `specfold hooks install` SHALL exit with an environment error naming that folder and change nothing.

#### Scenario: Custom hooks folder
- **WHEN** `core.hooksPath` is `.githooks` and no manager is found
- **THEN** the command exits with 2 and names `.githooks`

### Requirement: Repository at the git root
`specfold hooks install` SHALL exit with an environment error, changing nothing, when the folder holding `specfold.yaml` is not the root of its git working tree.

#### Scenario: Nested repository
- **WHEN** `specfold hooks install` runs in `examples/sample-app` inside another git repository
- **THEN** the command exits with 2 and says that hooks are installed from the git root

### Requirement: Pre-commit checks
`specfold hook pre-commit` SHALL validate the staged concepts, check every active change with staged files (all rules of `change check` once the change has `tasks.md`, only the brief rules B0-B4 before), run `openspec validate --all --strict` when files under `openspec/` are staged and OpenSpec is installed, and exit with 1 when any of them reports an error.

#### Scenario: Broken concept staged
- **WHEN** a staged concept lacks `type`
- **THEN** the hook prints the validate error and exits with 1

#### Scenario: Change being planned staged
- **WHEN** a staged change has a confirmed brief and a proposal but no `knowledge.md` and no `tasks.md`
- **THEN** the hook exits with 0

### Requirement: Pre-push gate
`specfold hook pre-push` SHALL run `specfold gate --base <base> --local`, with `<base>` from `origin/HEAD`, falling back to `origin/main`, and exit with the gate's code. When no base resolves, it SHALL warn and exit with 0.

#### Scenario: Blocking finding
- **WHEN** the local gate reports a blocking G2 finding (G4 only warns locally)
- **THEN** the hook exits with 1 and the push stops

### Requirement: Graph refresh
`specfold hook post-checkout` and `post-merge` SHALL run `graphify update .` with `GRAPHIFY_BACKEND=none` when graphify is on the PATH, and SHALL always exit with 0.

#### Scenario: Graphify missing
- **WHEN** graphify is not installed and `specfold hook post-merge` runs
- **THEN** it exits with 0 without output

### Requirement: Extra commands
After its own checks, `specfold hook <name> [args...]` SHALL run each command in `hooks.extra.<name>` with `sh -c`, passing the hook's arguments as positional parameters, and SHALL exit with 1 when any command fails. A hook without own checks or extra commands SHALL exit with 0.

#### Scenario: Commit message check
- **WHEN** `hooks.extra.commit-msg` is `node scripts/check-commit.mjs --message-file "$1"` and git calls the commit-msg hook with a message file
- **THEN** the command runs with that file as `$1`, and a failing check fails the hook

### Requirement: Claude session start
`specfold hook claude-session-start` SHALL print the root `knowledge/index.md` section list and the names of the active changes, at most 40 lines, and exit with 0.

#### Scenario: Context at start
- **WHEN** a session starts in a repository with two active changes
- **THEN** stdout lists the knowledge sections and both change names within 40 lines

### Requirement: Claude post-tool-use
`specfold hook claude-post-tool-use` SHALL read the hook event JSON from stdin and, for an `Edit` or `Write` of a file under `knowledge/`, validate that file, or for a file under `openspec/changes/<change>/`, check that change as the pre-commit hook does. It SHALL print only errors to stderr and exit with 2 when there are errors, otherwise exit with 0 silently.

#### Scenario: Agent writes a broken concept
- **WHEN** the event names a `Write` of `knowledge/decisions/x.md` and the file lacks `type`
- **THEN** the validate error goes to stderr and the command exits with 2

### Requirement: Claude stop
`specfold hook claude-stop` SHALL run the local gate against the same base as the pre-push hook and, when a blocking rule fails, print the blocking findings to stderr and exit with 2, also when the event says a Stop hook is already active; otherwise, or when no base resolves, exit with 0.

#### Scenario: Unfinished work
- **WHEN** Claude tries to stop while a touched change has an unconfirmed brief
- **THEN** the G13 finding goes to stderr and the command exits with 2
