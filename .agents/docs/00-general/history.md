# History and decisions

How the codebase got its current shape, taken from git history, release notes and the contributor wiki. Read this when code looks inconsistent (two styles for the same thing usually means old and new), or before proposing a change of direction.

## Timeline

| When | What happened | Trace in the code |
|---|---|---|
| March 2021 | First commit. Stack chosen: Python, Django, Django REST Framework, SQLAlchemy for user databases. Mathesar "should function as a GUI to existing DBs". | |
| April 2021 | Front end started in the same repo: Svelte and Vite. TypeScript added in June. | `mathesar_ui/` |
| March 2023 | First public release, 0.1.0 (alpha). | Tag `0.1.0` |
| March 2023 | Decision to remove SQLAlchemy because of performance. Database logic starts moving into PL/pgSQL functions. | `db/sql/` created |
| December 2023 | Decision to leave all permissions on database objects to PostgreSQL. | |
| March 2024 | Mathesar Foundation announced (501(c)(3) nonprofit). | |
| April 2024 | JSON-RPC API started, replacing REST endpoint by endpoint. | `mathesar/rpc/` created |
| July 2024 | `develop` broken on purpose for the architecture rewrite. Django models that mirrored tables and columns removed. | No `Table` or `Column` model |
| October 2024 | Remaining SQLAlchemy code moved aside. | `db/deprecated/` |
| January 2025 | 0.2.0: beta. New backend, PostgreSQL roles for access control. Installs of 0.1.x cannot upgrade to it. | Migrations start again at `mathesar/migrations/0001_initial.py` |
| June 2025 | 0.3.0: install script based on `uv`, dark mode. | `build-scripts/` |
| July to October 2025 | 0.4.0 to 0.7.0: OIDC single sign-on, forms, file attachments, import into existing tables. | `mathesar/sso.py`, `mathesar/rpc/forms.py`, `mathesar/utils/download_links.py`, `mathesar/views/bulk_insert.py` |
| December 2025 | 0.8.0: related data in the table view, nested filters. The REST API package (`mathesar.api`) is deleted. | `mathesar_ui/src/api/rest/` holds what is left on the client |
| 2026 | 0.9.0 to 0.12.0: ENUM and User types, GitHub SSO, per-user databases, Azure storage, health checks. Mathesar Cloud beta in June. | `PER_USER_DATABASES_ENABLED`, `HealthCheckMiddleware` |

Release notes for every version: `docs/docs/releases/`.

## Decisions that still shape the code

| Decision | Reason | Consequence today |
|---|---|---|
| Logic in SQL functions, thin Python | The SQLAlchemy layer made many round trips per request. Pages became about 5 times faster after the rewrite. | A feature that touches user data usually starts in `db/sql/05_msar.sql`. |
| No Django models for database objects | Mirrored models needed a sync step and went stale. | Structure is read live. Metadata rows reference OIDs and attnums as plain integers. |
| PostgreSQL roles for permissions | Avoid a second, weaker access control layer. Respect privileges granted outside Mathesar. | Each call connects as the user's mapped role. Python does not check data permissions. |
| JSON-RPC, not REST | One API call maps to one database function. | One endpoint, methods named `noun.verb`, named parameters only. |
| Reinstall SQL by drop and recreate | No migration system for functions. | Every SQL object must be in the registry `db/sql/00_msar_all_objects_table.sql`. |
| Hand-written front end API types | Generating TypeScript from Python was judged not viable. | The two sides can drift. Change them together. |
| One repo for front end and back end | Decided in 2021. | An RPC change and its UI change go in one PR. |

## Conventions that came out of it

RPC method names (from the 2024 rewrite spec, `https://wiki.mathesar.org/archive/product/projects/2024/architecture-transition/rpc/`):

- Noun first, verb second: `tables.list`. Namespaces can nest: `tables.metadata.set`.
- Preferred verbs: `list`, `get`, `add`, `patch`, `replace`, `delete`. Avoid `create`, `insert`, `update`, `remove`, `drop`.
- Named parameters only. Google style docstrings on every method.

Identifier names (from the backend review standards, `https://wiki.mathesar.org/engineering/code-review/backend/`):

- Database objects: suffix `_oid` (`table_oid`, `schema_oid`). Columns: `attnum`.
- Django model ids: suffix `_id` (`database_id`, `user_id`).

## Unfinished transitions

| Area | State |
|---|---|
| SQLAlchemy removal | Explorations still run through `db/deprecated/`. Everything else uses SQL functions. |
| Schema `__msar` | Deprecated, still called by functions in `msar`. |
| Svelte 4 migration | Open issue 3213. The front end is on Svelte 3. |
| Front end entity stores | `mathesar_ui/src/stores/tables.ts` and `mathesar_ui/src/stores/queries.ts` are marked for refactoring in their own comments. Newer code uses models, route contexts and `AsyncRpcApiStore`. |
| Request state types | The enum `States` is deprecated in favor of `RequestStatus`. Both are in use. |

## Activity

- About 19,000 commits since 2021. Peak in 2022.
- Releases were roughly monthly in 2025 and every one to three months in 2026.
- Few commits landed on `develop` between July and November 2026 (dependency updates and docs). Expect slow review.
- Areas with the most changes in 2026: `mathesar_ui/src/systems/`, `mathesar_ui/src/components/`, `mathesar_ui/src/stores/`, `docs/docs/`, `mathesar/rpc/`, `db/sql/`.

## Sources

- `git log` and tags of this repo.
- Release notes in `docs/docs/releases/` and posts on `https://mathesar.org/blog`.
- Contributor wiki, `https://wiki.mathesar.org`. Its architecture pages are under "Archive". They describe the design in broad terms, but names and details have drifted.
