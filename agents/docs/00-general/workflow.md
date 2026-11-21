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

## Commits

- One logical change per commit. Short imperative subject, no prefix, no emoji: `Fix indeterministic column ordering`.
- Do not rewrite history on a branch that has a PR under review.

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
- Describe the change in a few sentences. Add technical details only when a reviewer needs them.
- Add screenshots for UI changes.
- Keep the checklist and tick boxes with `[x]` exactly. Leave a box unticked and say why if it does not hold.
- Keep the Developer Certificate of Origin block. PRs without it are not merged.

Rules of the review process:

- Target `develop`. Title: a plain descriptive sentence.
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
| Long generated descriptions | Write a few sentences. |
| Red CI, merge conflicts, missing template or DCO | Fix before asking for review. |

## AI-assisted work

The project has no written policy on AI-generated contributions. Maintainers have stated the working rule in reviews: AI help is acceptable, and the author must understand, test, review and clean up the result. Unreviewed output gets the PR closed.

For an agent this means:

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
