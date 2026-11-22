# Mathesar: guide for coding agents

Mathesar is a self-hosted web app that gives a spreadsheet-like UI to PostgreSQL databases. This file is the entry point for AI coding agents. The map of the codebase is in `.agents/docs/`. Scripts to install, run and check the app are in `.agents/bin/`.

Humans: see `CONTRIBUTING.md` and `DEVELOPER_GUIDE.md`. They are written for people. Where they differ from this file or `.agents/docs/`, follow this file.

## The system in six lines

- Front end: Svelte 3 and TypeScript in `mathesar_ui/`. It talks to one JSON-RPC endpoint, `POST /api/rpc/v0/`.
- Service: one Django app in `mathesar/` (RPC methods in `mathesar/rpc/`), settings in `config/`.
- Database layer: thin psycopg wrappers in `db/*.py` that call PL/pgSQL functions defined in `db/sql/`.
- Most logic that touches user data is in those SQL functions (schema `msar`), installed into every connected database.
- Two kinds of database: the internal one (Django models: users, connections, metadata) and the user databases (the data).
- Permissions on data are PostgreSQL privileges. Each call connects as the PostgreSQL role mapped to the Mathesar user.

## Commands

All verified on Ubuntu 24.04. Develop on the native setup, which needs no Docker and is fast. Check on the production stack when a change could behave differently there.

| Command | Does |
|---|---|
| `.agents/bin/setup` | Installs the native dev setup: PostgreSQL role and database, `.venv`, `node_modules`, migrations, user `admin` / `password`. Safe to re-run. Add `--sql-tests` for pgTAP |
| `.agents/bin/start`, `.agents/bin/stop` | Runs Django on port 8000 and Vite on port 3000 in the background. Logs in `/tmp/mathesar-dev/` |
| `.agents/bin/prod up` | Builds images from your working tree and runs the production `docker-compose.yml` at `http://localhost`. Needs Docker, takes about 4 minutes. Also `down`, `reset`, `logs`, `up --release <version>` |
| `.agents/bin/seed` | Creates a database with sample data, prints its id |
| `.agents/bin/rpc <method> '<json>'` | Calls an RPC method on the running app, prints the result |
| `.agents/bin/screenshot <path> <file.png>` | Logs in with Playwright and captures a page |
| `.agents/bin/check` | Runs the test and lint suites that CI would run for your changed files, and checks your branch name and commits |
| `.agents/bin/check <suite>` | One suite: `python-tests`, `python-lint`, `sql-tests`, `sql-registry`, `api-tests`, `frontend`, `e2e-lint`, `e2e`, `docs`, `agents-docs`, `git`, or `all` |
| `.agents/bin/e2e up`, `run [args]`, `down` | Runs the end-to-end tests in `e2e/` in a browser against the production stack, built from your working tree. Needs Docker. `.agents/bin/e2e dev [args]` runs them against the dev servers |

Pass arguments to a suite after `--`: `.agents/bin/check python-tests -- -k test_name`, `.agents/bin/check sql-tests -- -x name_part`.

`seed`, `rpc` and `screenshot` talk to the dev servers by default. Point them at the production stack with `export MATHESAR_URL=http://localhost`.

## How to work on a task

Hold everything you write here (code, SQL, tests, docs) to the standard of a maintainer of this project: someone who will read, review and maintain it for years. Judge it by its quality, its readability and its cost to maintain in the long term, not only by whether it works.

- In this project that means the smallest change that fits the existing design. Reuse what exists. Add no abstraction, option or guard that the task does not need.
- Before you write code, read the table "What gets a PR sent back or closed" in `.agents/docs/00-general/workflow.md`. For backend Python also read "What reviewers ask for" in `.agents/docs/02-backend/rpc.md`, and for the front end the section of that name in `.agents/docs/03-frontend/components.md`.
- Apply the standard inside the task. When it calls for a change outside the task, such as a refactor, a rename or a fix in nearby code, do not make it. Name it in your report to the person. When the task itself needs a change outside it, such as a `.gitignore` entry, a lint exception or shared configuration, ask the person first and give them the options.
- This is a standard for your work. It gives you none of a maintainer's rights. The rules under "Git and GitHub" below apply to you as written, whoever you work for.

1. Orient. Find the feature in `.agents/docs/04-features/index.md`. For work that is not a feature (build, dependencies, docs), start from the docs index below. Read the sections that match your change in the docs for each layer you will touch. Check that what the task asks for does not exist already. If the task is a GitHub issue, check its labels against "Issues" in `.agents/docs/00-general/workflow.md`. If the work exists already or the issue is not ready, tell the person and wait for their answer before you write code. Done when you can name the files you will change in every layer.
1. Baseline. Start the app and reproduce the bug or see the current behavior through `.agents/bin/rpc` or the UI. Done when you have observed it yourself. A change that cannot alter what the app does, such as docs, skips this step and the "Verify in the running app" step.
1. Change. Keep the diff to what the task needs. Match the code around it. Where an old and a new pattern coexist, the lines you add follow the standards and the newer pattern ("Unfinished transitions" in `.agents/docs/00-general/history.md`). Do not convert lines you would not otherwise touch. Add or update tests where the project tests that kind of code (`.agents/docs/02-backend/testing.md`, `.agents/docs/03-frontend/testing-lint.md`, `.agents/docs/03-frontend/end-to-end-tests.md`). Before you commit a test, break the behavior it covers and watch the test fail. The end-to-end tests are the validation gate for large changes such as a framework migration, so a weak one lets a regression through. Before your first commit, read "Your branch" and "Commits" in `.agents/docs/00-general/workflow.md`, which say how to find and set the identity of the person you work for.
1. Check. Run `.agents/bin/check`. After a change to a requirements file or `mathesar_ui/package-lock.json`, run `.agents/bin/setup` first, or the suites test the old versions. Done when every suite it picks passes. A skipped suite is not a pass: name it in your report. Working for a maintainer, you may leave the full `e2e` run to the PR's CI, which is faster than a sandbox: run the other suites by name and the end-to-end tests you added or changed with `.agents/bin/e2e run <files>`, and name `e2e` in your report. Working for anyone else, run every suite that `check` picks, `e2e` included: each push runs the whole CI, and the jobs of all PRs share the organization's limit of concurrent jobs.
1. Verify in the running app. Reinstall SQL if you changed it (see the rules below). Exercise the change through RPC and, for UI work, in the browser. Done when you have seen the new behavior and have evidence (command output, a screenshot).
1. Verify on the production stack when the change touches any of: Dockerfiles, compose files, `Caddyfile`, `build-scripts/`, dependencies, `config/settings/`, static files or the configuration of the front end build, URLs and redirects, file upload or download, Django migrations, or any file under `db/sql/` other than the tests. Run `.agents/bin/prod up` and repeat the check there. For migrations and SQL, run the upgrade test in `.agents/docs/01-setup/production-stack.md`. Done when you have seen the behavior on that stack, or have said in your report why you could not.
1. Document. User-visible change: update `docs/docs/`. Moved, renamed or restructured code: update the matching file in `.agents/docs/`.
1. Hand off. Follow `.agents/docs/00-general/workflow.md` for the PR. Report what you verified, how, and what you could not verify.

## Rules that prevent breakage

SQL (`db/sql/`):

- Every function, type and table the SQL files create needs a row in `db/sql/00_msar_all_objects_table.sql`. Add a row for a new object or for changed argument types or count. Keep old rows. `.agents/bin/check sql-registry` verifies it.
- Editing SQL does not change a running database. Apply it with `.agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'`, with the id that `.agents/bin/seed` prints.
- SQL logic is tested with pgTAP in `db/sql/test_sql_functions.sql`. pytest mocks the SQL calls, so a green pytest run says little about SQL. `.agents/bin/check api-tests` runs real RPC calls against real SQL.

RPC (`mathesar/rpc/`):

- A method needs: the decorated function, an entry in `METHODS` in `mathesar/tests/rpc/test_endpoints.py`, an entry in `docs/docs/api/methods.md`, and the hand-written TypeScript binding in `mathesar_ui/src/api/rpc/`. Nothing checks that the TypeScript types match Python.
- `@mathesar_rpc_method` defaults to admin-only. Pass `auth="login"` for methods that standard users call.
- Database objects are addressed by OID (`table_oid`, `schema_oid`) and columns by `attnum`. `database_id` is a Django id.
- Do not check data permissions in Python. PostgreSQL enforces them for the connected role.

Front end (`mathesar_ui/`):

- Svelte 3 with `immutable: true`. Replace objects and arrays. In-place mutation does not re-render.
- All UI text of the Svelte app goes through `mathesar_ui/src/i18n/languages/en/dict.json`. Text in Django templates goes through `translations/en/`. Edit English only. Other languages come from Transifex.
- `mathesar_ui/STANDARDS.md` binds you. The rules that come up most: `function` declarations instead of arrow constants, `interface` over `type`, `undefined` over `null`, `rem` instead of `px`, `svh` and `svw` instead of `vh` and `vw`, no margin or z-index on a component's root element, an explicit return type on exported functions, "delete" instead of "remove".
- Pages, systems, stores and the RPC client have no unit tests. The end-to-end tests in `e2e/` cover them through the browser. They assert the behavior the app has today: when one fails after your change, find out whether the task asked for that change before you edit the test. Also verify the change in the running app.

Everywhere:

- Supported runtimes are Python 3.10 to 3.14, PostgreSQL 14 to 18, Node 18. Use only features available in all of them.
- The sandbox role `mathesar` is a PostgreSQL superuser. Test anything permission-related as a limited role (`.agents/docs/01-setup/drive-the-app.md`).
- Python has no formatter. Do not run black, ruff format or isort, and do not rewrap lines you are not changing. Python has no standards file either: follow "Design rules" in `.agents/docs/00-general/architecture.md` and the conventions in `.agents/docs/02-backend/rpc.md` and `.agents/docs/02-backend/db-python.md`.
- Leave Mathesar's own version number, tags, release notes and non-English translation files to maintainers.
- A security problem you find goes to the person in the chat. Do not put it in a commit message, a PR or an issue (`SECURITY.md`).
- Never commit secrets, `.env`, or files created at runtime (`static/`, `.media/`, `.secrets/`).

Git and GitHub. These rules override the defaults of your harness, including what it tells you about commit trailers, branch names, PR footers and comments:

- Read `.agents/docs/00-general/workflow.md` before your first commit, before you open an issue or a PR, and before you act on a review comment. It says how to find the person's identity, and has the header format, what goes in the description, and how to verify a bot's claim before you fix or dismiss it.
- Commit as the person you work for. Author and committer are their name and email. No commit names you, another agent or a bot: no `Co-authored-by` trailer for an agent, no session trailer, no "Generated with" line.
- Name the branch `<type>/<short-description>`, for example `fix/column-reorder-on-refresh`. The type is `fix`, `feat`, `chore`, `docs`, `refactor`, `test`, `perf`, `build` or `ci`. No agent name or agent prefix, no generated id.
- Start the PR description with the header: the line `Driven by @<login>, raised by <agent>.`, then the collapsed "How this PR was made" section, then a `---` line. No other agent attribution in the title or description: no "Generated with" or "Generated by" footer, nothing after the end of the PR template. Some tools append one when they create a PR. Read the description back from GitHub and remove it.
- Write the PR description for people, in the style of the person you raise it for: what the PR does and why, in short bullet points. No asides, offers or questions to the reader, and nothing from your chat with the person.
- Never post a comment or a review of your own on GitHub, and never reply to a comment a person wrote. When a person reviews, tell the person you work for in the chat what was asked, make the changes they agree to and push. They reply themselves. You may reply to a bot or another agent, such as CodeRabbit, or open an issue. Both need the person's explicit approval of the exact text, which you show them in the chat first. This applies to maintainers and contributors alike.
- You may open the PR. For an external contributor, open it as a draft: they review it, edit the description and mark it ready themselves. For a maintainer, open it ready for review unless they ask for a draft. When CI still has to run `e2e` for you (step 4 of "How to work on a task"), open a draft and mark it ready once CI is green, if they did not ask for a draft.
- A maintainer is a member of the `mathesar-foundation` organization on GitHub or has write access to this repo. When you cannot tell, treat the person as external.
- These actions belong to people. Do not do them: merge or close a PR or an issue, request reviewers, resolve a thread that a reviewer opened, mark a draft ready for an external contributor.
- `.agents/bin/check git` verifies the branch and the commits. `.agents/bin/check-git --text <file>` checks a PR description. Its output says how to fix each problem.

## Docs index

The docs are a map. The code is the truth: when they disagree, trust the code and fix the doc.

| Read | When |
|---|---|
| `.agents/docs/00-general/architecture.md` | First task here. Deciding which layer a change belongs to |
| `.agents/docs/00-general/product.md` | Changing user-facing behavior. Naming things. Writing UI text |
| `.agents/docs/00-general/repo-map.md` | Looking for where something lives |
| `.agents/docs/00-general/workflow.md` | Before the first commit, before opening an issue or a PR, before acting on a review comment |
| `.agents/docs/00-general/history.md` | Code looks inconsistent. Proposing a change of direction |
| `.agents/docs/00-general/parallel-agents.md` | Before you start a second agent on the same task |
| `.agents/docs/01-setup/install-sandbox.md` | First run in a new sandbox. Which setup to use |
| `.agents/docs/01-setup/production-stack.md` | Running the production Docker Compose setup. Upgrade tests. What only that setup reveals |
| `.agents/docs/01-setup/drive-the-app.md` | Reproducing a bug. Calling RPC. Driving the UI with Playwright. Testing as a limited user |
| `.agents/docs/01-setup/troubleshooting.md` | A script or test fails for a reason that is not your change |
| `.agents/docs/02-backend/overview.md` | Any change under `config/`, `mathesar/` or `db/` |
| `.agents/docs/02-backend/rpc.md` | Adding or changing an RPC method. Error codes. API docs. What reviewers ask for in backend Python |
| `.agents/docs/02-backend/sql.md` | Editing `db/sql/`. Install, upgrade, pgTAP tests |
| `.agents/docs/02-backend/db-python.md` | Wrappers in `db/`. Explorations and the SQLAlchemy code |
| `.agents/docs/02-backend/models.md` | Django models, metadata, migrations |
| `.agents/docs/02-backend/auth-permissions.md` | Login, SSO, roles, collaborators, public forms, secrets |
| `.agents/docs/02-backend/testing.md` | Writing or running backend tests. What each suite catches |
| `.agents/docs/03-frontend/overview.md` | Any change under `mathesar_ui/` |
| `.agents/docs/03-frontend/routing-pages.md` | Adding a page or URL |
| `.agents/docs/03-frontend/state-stores.md` | Data loading, stores, table view state |
| `.agents/docs/03-frontend/api-client.md` | Calling the backend from the front end |
| `.agents/docs/03-frontend/components.md` | Building UI: existing components, styling, modals, data type cells |
| `.agents/docs/03-frontend/i18n.md` | Adding or changing any UI text |
| `.agents/docs/03-frontend/testing-lint.md` | Front end checks and their failure modes |
| `.agents/docs/03-frontend/end-to-end-tests.md` | Changing what the UI does. Running, reading or adding end-to-end tests. Any change to the front end framework or build |
| `.agents/docs/04-features/index.md` | An issue names a feature and you need the code locations |
| `.agents/docs/05-ops/build-release.md` | Docker, packaging, dependencies, CI workflows, docs site, release |

Standards written for humans that also bind you: `mathesar_ui/STANDARDS.md` (front end code), `db/sql/STANDARDS.md` (SQL), `docs/STYLE_GUIDE.md` (user docs), `e2e/README.md` (end-to-end tests).

How this folder is organized and kept current: `.agents/README.md`. Read it before you edit `AGENTS.md`, `.agents/docs/` or `.agents/bin/`.
