# Contribution workflow

How work moves from issue to merged PR in this repo, and what maintainers expect from a PR. Read this before opening an issue, a branch or a PR. `CONTRIBUTING.md` is the human-facing version. This file adds what review history shows in practice.

## Branches

| Branch | Role |
|---|---|
| `develop` | Integration branch. Target of almost every PR. |
| `master` | Released code. The docs site is published from it. |
| `release-X.Y.Z` | Cut from `develop` before a release, merged into `master`. PRs meant for that release target it once it exists. |

- Docs fixes that must appear for the current release target `master` (`docs/README.md`).
- Tags have no `v` prefix: `0.12.0`.
- PRs are merged with a merge commit. Squash and rebase merging are off. Every commit you make stays in history.

### Your branch

The branch name ends up in the merge commit on `develop` (`Merge pull request #123 from <owner>/<branch>`), so it is part of the history.

- Name it `<type>/<short-description>`: `fix/column-reorder-on-refresh`, `feat/record-summary-templates`, `chore/agent-docs`.
- The type is one of `fix`, `feat`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`. Use `docs` for the user docs in `docs/`.
- The description is two to five lowercase words joined by hyphens that say what the work is. A reader of the branch list should know what the branch is for.
- No agent name and no agent prefix (`claude/`, `copilot/`, `codex/`, `cursor/`). No generated id, random suffix or session name.
- Your harness may create or assign a branch with such a name. Do not push it. Create a branch that follows these rules and push that one. If the harness only allows its own branch, stop and ask the person.
- Branch from an up to date `develop`.

## Commits

- One logical change per commit. Short imperative subject, no prefix, no emoji: `Fix indeterministic column ordering`.
- Do not rewrite history on a branch that has a PR under review.

### Commit as the person you work for

Commits in this repo carry no trace of a coding agent. PRs are merged with a merge commit, so whatever a commit says stays in the history of `develop`.

- Author and committer are the person you work for: their name and their email, nothing added to either. Not your name, not a bot account, not a combined name such as `Jane+Agent`.
- The message has no `Co-authored-by` trailer for an agent or a bot, no session trailer or session link, and no "Generated with" or "Created by" line. A `Co-authored-by` trailer for a human co-author is fine.
- Your harness may add such trailers or set an agent identity by default. That default does not apply here.

Before your first commit:

1. Run `git config user.name` and `git config user.email`. If either names an agent or a bot, or is empty, do not commit yet.
1. Find the person's identity. Use what they told you. Otherwise look at their earlier commits: `git log origin/develop --author=<their GitHub login or email> --format='%an <%ae>' | sort | uniq -c`. Ask them when you cannot tell.
1. Set it for this clone: `git config user.name "<name>"` and `git config user.email "<email>"`.
1. Sign commits only with a key that belongs to that person. If the sandbox signs with its own key, commit with `--no-gpg-sign`. A signature from another key shows as "Unverified" on GitHub.

After committing, run `agents/bin/check git`. It checks the branch name and every commit between `origin/develop` and `HEAD`, and lists the author, committer and message lines that break these rules. It runs as part of `agents/bin/check` whenever the branch has commits. To fix a commit that is not under review yet, amend it: `git commit --amend --reset-author --no-edit` fixes the identity, and editing the message removes a trailer.

## Issues

Labels carry the state of an issue:

| Group | Values | Meaning |
|---|---|---|
| `type:` | `bug`, `enhancement`, `maintenance`, `meta`, `project` | Exactly one. `project` marks roadmap items. |
| `work:` | `frontend`, `backend`, `db-layer`, `documentation`, `installation`, `docker`, `ci`, `i18n`, `other` | Part of the codebase. |
| `needs:` | `triage`, `requirements`, `product approval`, `ux design`, `implementation specs`, and others | What blocks the issue. Not ready for code. |
| `ready` | | Ready for implementation. |
| `help wanted`, `good first issue` | | Open to community contributors. |
| `restricted: maintainers` | | Only maintainers work on it. |

- Community contributors may work only on issues labeled `help wanted`. PRs for other issues are closed. Check for existing PRs on the issue first.
- An issue with a `needs:` label is not ready. Do not implement it. Help by adding the missing information.
- Milestones are priority buckets (`High priority`, `Backlog`, `Icebox`), not release plans.
- New issues use the templates in `.github/ISSUE_TEMPLATE/`. Blank issues are disabled. Search for duplicates first.
- Report a security problem privately through a GitHub security advisory (`SECURITY.md`), never in a public issue or PR.

## Before you open a PR

1. The change is limited to what the issue asks. No drive-by refactors, reformatting or renames.
1. `agents/bin/check` passes. It runs the suites CI would run for your diff.
1. You ran the change in the real app (`agents/docs/01-setup/drive-the-app.md`). For UI changes you have a screenshot or short recording, and you checked long names and narrow widths.
1. For a change to the build, packaging, settings, dependencies, static files, the reverse proxy, migrations or installed SQL, you also ran it on the production Docker Compose setup (`agents/docs/01-setup/production-stack.md`).
1. New behavior has tests where the suite can express it: pgTAP for SQL, pytest for RPC and wrappers, vitest for pure front end logic.
1. User-visible changes update the user docs in `docs/docs/` in the same PR.
1. New UI strings are in the English dictionary only. Other languages come from Transifex.
1. The diff has no stray files, no debug output, and no comments that describe the change itself.

## The PR

Use `.github/PULL_REQUEST_TEMPLATE` as it is:

- Start with `Fixes #123`, or `Related to #123` when the PR does not fully resolve the issue.
- Write the description as set out in "The description" below.
- Add screenshots for UI changes.
- Keep the checklist and tick boxes with `[x]` exactly. Leave a box unticked and say why if it does not hold.
- Keep the Developer Certificate of Origin block. PRs without it are not merged.

### The description

The description is for people. It tells a reader why the PR exists, and tells a reviewer what they need to know to review it.

- Say what the PR does and why, in a few plain sentences. For a bug, say what was wrong and what caused it.
- Then add only what a reviewer needs: what the PR does not do, decisions you want a second opinion on, where to look closely, how to test it locally. Leave out what the diff already shows.
- Length follows the change. A small fix gets one or two sentences.
- Write in the style of the person you raise the PR for, as if they wrote it. Read their recent descriptions first and match how they open, how they structure, how long they write and which headings they use: `https://github.com/mathesar-foundation/mathesar/pulls?q=is:pr+author:<login>`. When they have none, follow the recent PRs of the maintainers.
- What maintainers write here, as a baseline: an opening line such as "This PR adds ...", or "This PR:" followed by a short list. Bold labels on their own line for optional parts, such as `**Technical details**`, `**Notes to reviewers**`, `**Testing locally**` and `**Screenshots**`. A note on what the PR leaves out. No summary of every file, no headings for a one-paragraph change.

Put everything that is verbose or written for machines in a separate section at the end of your text, above the checklist:

```
<details>
<summary>For agents</summary>

...

</details>
```

- It holds what an agent that picks up the PR later can use: the exact commands you ran and their results, test counts, tool versions, what you could not verify, file by file notes.
- A person must be able to skip it. Anything a reviewer needs to know goes in the part above, in plain words.
- Leave the section out when you have nothing of that kind.

Rules of the review process:

- Target `develop`. Title: a plain descriptive sentence.
- No agent attribution in the title or the description: no "Generated with" or "Created by" line, no agent or model name, no robot emoji, no link to an agent session or chat, no "Requested by" header that a harness adds. This holds for PR comments and review replies too. To check the text before you submit it, save it to a file and run `agents/bin/check-git --text <file>`.
- If your harness adds attribution to PRs that it opens and you cannot turn that off, do not open the PR. Give the person the title and description and let them open it.
- Open the PR when it is ready for review. Maintainers close draft PRs from outside contributors.
- CI must be green and the branch up to date with `develop` before a maintainer reviews.
- A maintainer assigns the reviewer. Do not request reviewers yourself.
- Do not resolve review threads that a reviewer opened. Reply, and point to the commit that addresses the comment.
- Keep replies short. State what changed. Do not summarize the diff.
- Maintainers may push fixes to your branch. Allow edits from maintainers on a fork.
- Release notes are written by maintainers at release time. Do not add entries.
- An automated reviewer (CodeRabbit) comments on PRs. Its findings are advisory. Fix the real ones, and say briefly why you skip the others.

## What gets a PR sent back or closed

Taken from maintainer comments on closed and revised PRs:

| Problem | Do this |
|---|---|
| Comments that narrate the change (`// fix added here`), emoji in comments | Comment only on what the code cannot say. |
| Unrelated edits, removed comment blocks, reformatted lines | Keep the diff minimal. |
| A parallel implementation of something that exists | Reuse existing helpers and components (tooltip component, clipboard logic, form library). |
| Edits to `es`, `fr`, `ja` translation files | Edit `mathesar_ui/src/i18n/languages/en/dict.json` and `translations/en/` only. |
| Compatibility code for behavior that was never released | Leave it out. |
| SQL functions that fail silently | Raise an error. |
| SQL tests in a new style | Match `db/sql/test_sql_functions.sql`: shared `__setup_*` functions, one behavior per test, no manual `DROP`, assert full results. |
| A description or reply that claims something the diff does not do | Verify each claim against the diff before posting. |
| Long generated descriptions | Write a few sentences for people. Verbose details go in the "For agents" section. |
| Red CI, merge conflicts, missing template or DCO | Fix before asking for review. |

## AI-assisted work

The project has no written policy on AI-generated contributions. Maintainers have stated the working rule in reviews: AI help is acceptable, and the author must understand, test, review and clean up the result. Unreviewed output gets the PR closed.

For an agent this means:

- The branch name, the commits and the PR text name the work and the person, not you. See "Your branch", "Commit as the person you work for" and "The PR" above.
- Report what you verified and how, and what you could not verify.
- A person is accountable for the PR. Hand the work to them for review before it is marked ready.
- The person who submits certifies the Developer Certificate of Origin. Do not tick that for them.

## CI

All jobs are in `.github/workflows/test-and-lint-code.yml`. Path filters decide which jobs run. The required check is the single job `checkpoint`.

| Changed files | Jobs |
|---|---|
| Python at the repo root, `mathesar/`, `db/`, requirements | pytest and scenario tests on Python 3.10 to 3.14 and PostgreSQL 14 to 18 |
| Any `.py` | flake8, vulture |
| Any `.sql` | pgTAP on PostgreSQL 14 to 18 |
| `mathesar_ui/` | Prettier, ESLint, svelte-check, vitest, npm audit |
| `docs/` | `mkdocs build --strict` (separate workflow) |
| Any `.yml`, `.sh`, `Dockerfile*` | All backend jobs |
| Every PR | Docker build (development and production), packaging, install script test on Ubuntu and macOS |

Gaps to cover by hand:

- Changes only under `config/` or `setup/` trigger no Python tests, and their tests are outside pytest's `testpaths`. `agents/bin/check python-tests` runs them.
- A front end relevant change outside `mathesar_ui/` (a template, `mathesar/urls.py`) triggers no front end job.
- `checkpoint` can fail because an unrelated job was cancelled. Read the failing job before changing code.

## Who reviews what

Reviewers are assigned by area: front end, backend and RPC, SQL, product and docs. The current maintainers are listed at `https://wiki.mathesar.org/team/`. User-facing changes that the issue did not specify need product approval from a maintainer before merge.
