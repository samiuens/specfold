## Wish

Plan the iac migration change: the path sf-migrate needs so that a repository whose `knowledge/` already holds an OKF bundle, such as `~/Development/iac`, can move into Specfold, with iac as its first real run.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which parts of the commitment does this change build? | All six: concept inventory by type, tooling and rule-file plan rows, every type allowed plus an "After conversion" section, replacing originals, relief for expected findings during a migration, the commitments checkpoint, and a "Deviations" section in the report. | user |
| Q2 | How are types the bundle uses but Specfold lacks treated? | Mapped to a Specfold type by default where one exists; the plan can change each row. | user |
| Q3 | What happens to concepts already in `knowledge/`? | Rewritten as Specfold concepts in Specfold's folders. | user |
| Q4 | How does install fill `types` and `folders` in a `specfold.yaml` it creates? | `migrate install` detects them from the bundle: the template's types plus every type the bundle uses, the template's folders plus the bundle's top-level folders, the latter without a description (OKF forbids frontmatter in folder indexes; the agent sets it per Q7). | user |
| Q5 | What happens to the original files? | Removed in the migration PR once their rewrite exists; `sources` point to the original at the migration's base commit. The commitment's opt-in wording is updated. | user |
| Q6 | Which default type map does the plan propose? | ADR to Decision, Playbook to Runbook, Domain Concept to Term, App to Component; a type Specfold has stays; a type with no clear equivalent (iac: Architecture) is decided per file in the plan. | user |
| Q7 | Where does the intro text of hand-written `index.md` files go? | Indexes are regenerated; intro text that holds knowledge becomes a concept, a one-line folder summary becomes that folder's `description`; the report says where each piece went. | user |
| Q8 | What about detected types and folders no longer in use after conversion? | The agent removes them from `specfold.yaml`, listed in "After conversion" and the report. | user |
| Q9 | What does the plan propose for the bundle's own tooling? | Validators, OKF skills and hook steps that Specfold replaces are "remove" rows in "After conversion"; everything else is "keep". | user |
| Q10 | How are expected findings relieved during a migration? | Until `convert` is marked done, the pre-commit and Claude post-edit hooks report broken links (L1, L2) and findings in files the plan deletes as warnings; the gate stays strict. | user |
| Q11 | What happens to references to moved concepts outside the bundle? | The conversion rewrites them in every tracked file; the report lists each file. | user |
| Q12 | Which rule applies to a team's AGENTS.md rules? | Rules the Specfold block already states are removed, rules that describe how the repository works become Convention concepts, the rest stay below the Specfold block; one plan row each. | user |
| Q13 | How does the inventory show an existing bundle? | Two new kinds: `okf-concept` for a file under `knowledge/` whose frontmatter has a `type`, with that type and the suggested Specfold type from Q6; `okf-index` for the bundle's `index.md` and `log.md` files. They take precedence over `adr` for files under `knowledge/`. | delegated |
| Q14 | What do `sources` of rewritten concepts point to? | `https://github.com/<owner>/<repo>/blob/<base commit>/<path>` when `origin` is on GitHub; otherwise the original path, with the base commit named in the report. | delegated |
| Q15 | How do hooks know which files the plan deletes, without reading the plan? | A file under `knowledge/` whose content still equals the migration's base commit counts as an original the plan replaces. | delegated |
| Q16 | Does the relief also apply to the Claude stop hook, which runs the local gate after every turn? | Yes: while `convert` is not done, it does not block on link findings and findings in unchanged originals, but still lists them; pre-push and the CI gate stay strict. | user |

## Out of scope

- Running the iac migration itself; that is the next task after this change merges.
- Rewriting references after renames outside a migration (`/backlog/rewrite-old-decision-references-in-code.md` stays open).
- Validate reading the plan to tell planned link targets from real breakage (rejected in Q10).

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-11-09T09:21:32+01:00
