# Bootstrap Specfold

Paste this whole file into your coding agent, started at the root of the repository that should use Specfold. It works in any agent that can run shell commands.

The kit is fetched at one pinned commit of `samiuens/specfold`:

```sh
KIT_REF=4da7d283a6264b3538a0764f9f2734932c624a79
```

## Instructions for the agent

Rather ask than assume: whenever a step leaves a decision open, ask the user in your native question UI, one decision per question, recommended option first. A missing or timed-out answer is never consent.

1. **Check.** You are at the root of a git repository (`git rev-parse --show-toplevel`), `gh auth status` succeeds and `node --version` is 20 or later. If one fails, tell the user what is missing and stop.
2. **Fetch the kit** into a new temporary folder, outside the repository. Run nothing from it yet.

   ```sh
   KIT_REF=4da7d283a6264b3538a0764f9f2734932c624a79
   KIT=$(mktemp -d)
   gh api "repos/samiuens/specfold/tarball/$KIT_REF" > "$KIT/kit.tar.gz"
   tar -xzf "$KIT/kit.tar.gz" -C "$KIT" --strip-components=1
   ```

   `$KIT/template/` is the kit's payload; every later step installs from it.
3. **Choose the path.** List the tracked files with `git ls-files`.
   - **Existing repository** (any tracked file besides `README*`, `LICENSE*` and `.gitignore`): read `$KIT/template/.agents/skills/sf-migrate/SKILL.md` and follow it from step 0. Its `<kit>` is `$KIT/template`, and install gets `--ref $KIT_REF`. Do not copy the skill into the repository first: the migration starts on a clean tree, and install copies the skill.
   - **Empty repository** (no commits, or only those files): ask the user for the stack and where the code will live. Copy everything in `$KIT/template/`, dot files and symlinks included, into the repository root; never overwrite an existing file, and ask the user about each one. Then run `node scripts/specfold.mjs init` with `--stack` and one `--source-glob` per answer, show `git status`, and ask the user before committing.
4. **Stop at every checkpoint.** On the migration path, the plan needs the user's approval before anything is installed, and every install conflict, the push and the PR are the user's call.
5. **Clean up.** When the work is committed, delete `$KIT`.
