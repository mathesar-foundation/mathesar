# Authentication and permissions

Who can log in, how a Mathesar user becomes a PostgreSQL role, which layer enforces which rule, and where secrets are stored.
Read this before changing login, SSO, RPC auth levels, collaborators, forms access, or anything that touches credentials.
User-facing explanations: `docs/docs/user-guide/access-control.md`, `docs/docs/user-guide/users.md`, `docs/docs/user-guide/stored-roles.md`, `docs/docs/user-guide/collaborators.md`.

## The model in brief

| Concept | Where it lives | Meaning |
|---|---|---|
| Mathesar user | `User` in `mathesar/models/users.py` | Logs in to the web app. Either admin (`is_superuser`) or standard. |
| Postgres role | The database server | Holds all data privileges. Mathesar adds no data ACL of its own. |
| Stored role | `ConfiguredRole` in `mathesar/models/base.py` | Name and encrypted password of a Postgres role, so Mathesar can log in as it. |
| Collaborator | `UserDatabaseRoleMap` | "This user uses this stored role on this database." One per user per database. |

- Several users may share one stored role. Postgres then cannot tell them apart.
- Enforcement has two layers. Django decides who may call a method and for which database. Postgres decides what the mapped role may do.
- All `msar` functions run with the caller's privileges (see `.agents/docs/02-backend/sql.md`).

## Login flows

| Flow | Code | Notes |
|---|---|---|
| First run | `mathesar/views/installation/complete_installation.py` | While no superuser exists, the login URL redirects to `/complete_installation/`. The form creates the first admin and logs it in. |
| Password login | `mathesar/views/users/login.py`, class `MathesarLoginView` | Standard Django `LoginView` at `/auth/login/`. Template `mathesar/templates/registration/login.html`. |
| Forced password change | `PasswordChangeNeededMiddleware` in `mathesar/middleware.py`, view in `mathesar/views/users/password_reset.py` | While `User.password_change_needed` is true, every session-authenticated request redirects to `/auth/password_reset_confirm/`. RPC calls with HTTP Basic auth are not redirected. |
| SSO | django-allauth, adapter in `mathesar/sso.py` | Routes come from `allauth.urls` under `/auth/`. |
| Logout | `django.contrib.auth.urls` | `/auth/logout/`. |
| API clients | django-modern-rpc | The RPC endpoint accepts the session cookie or HTTP Basic auth. |

- `users.add` and `users.password.revoke` set `password_change_needed`. The user picks a new password at next login.
- `users.password.replace_own` checks the old password first.
- There is no email-based password reset (stated in `docs/docs/user-guide/users.md`). Settings contain no email configuration.
- Sessions are Django database sessions. Expired ones are deleted by `run_model_maintenance` in `mathesar/rpc/decorators.py`.
- The dev container creates user `admin` with password `password` (`bin/mathesar_dev`, `docker-compose.dev.yml`).
- The login form and the non-RPC POST endpoints are CSRF-protected. The RPC endpoint is CSRF-exempt.
- The optional Django admin at `/admin/` requires `is_staff`. The installation form does not set it. `createsuperuser` does.

## SSO

Admin setup guide: `docs/docs/administration/single-sign-on.md` (provider keys, callback URLs, config schema). Not repeated here.

- Config is parsed by `load_sso_config` in `config/sso_config.py` when settings are imported. A change needs a restart.
- Source: env `SSO_CONFIG_DICT` (JSON), legacy alias `OIDC_CONFIG_DICT`, else a YAML file at the repo root. That file is not in the repo. Create it by copying `sso.yml.example` to the same name without the example suffix.
- Schema version 1 has `oidc_providers`. Version 2 has `providers` with `type: oidc` or `type: github`.
- The parser never raises. A malformed config or a provider with a missing field is skipped (logged at most), and SSO is silently off for it.
- The result is a frozen `SSOConfig` stored as `settings.SSO_CONFIG`. It feeds `SOCIALACCOUNT_PROVIDERS`.
- Provider key: the lowercased `provider_name` for OIDC, `github` for GitHub. `allowed_email_domains` and `default_pg_role` are looked up by that key.

Adapter behavior, class `SocialAccountAdapter` in `mathesar/sso.py`:

| Hook | Behavior |
|---|---|
| `pre_social_login` | Rejects logins without an email. For GitHub only a verified primary email counts. Rejects emails outside `allowed_email_domains` when that list is set. |
| Account linking | Settings `SOCIALACCOUNT_EMAIL_AUTHENTICATION` and `SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT` are on. An SSO login whose email matches an existing user logs in as that user. |
| `save_user` | Runs only when a new user is created. Adds a `UserDatabaseRoleMap` for each `default_pg_role` entry. Then sets up a per-user database if that feature is on. |
| `on_authentication_error` | Flash message and redirect to the login page. |

- `default_pg_role` entries must match existing `Server`, `Database`, and `ConfiguredRole` rows (by host, port, database name, role name). If one is missing, the login fails and the new user is rolled back.
- A user created by an admin before their first SSO login keeps the admin-assigned role. `save_user` does not run for them.
- SSO never creates admins.
- `REQUIRE_SSO_LOGIN` takes effect only if at least one provider is configured (`resolve_require_sso_login`).
- With `REQUIRE_SSO_LOGIN` on: the login form POST returns 403, `users.password.replace_own` raises, and `users.patch_self` refuses email changes.
- The route `/auth/3rdparty/<anything>/` renders the login view. It shadows allauth's own pages for cancelled logins, errors, and signup.
- Tests: `config/tests/test_sso_config.py`. See the note on `config/tests/` in `.agents/docs/02-backend/testing.md`.

## From user to database connection

1. An admin connects a database (`databases.setup.connect_existing` or `databases.setup.create_new`). This creates `Server`, `Database`, `ConfiguredRole`, and a `UserDatabaseRoleMap` for that admin.
2. Optional: create a Postgres role with `roles.add`. This runs `CREATE ROLE` or `CREATE USER` through the caller's own connection, so the caller's role needs `CREATEROLE`.
3. Store the role's credentials with `roles.configured.add` (admin only).
4. Make a user a collaborator with `collaborators.add` (admin only).
5. Grant privileges with `databases.privileges.replace_for_roles`, `schemas.privileges.replace_for_roles`, `tables.privileges.replace_for_roles`.
6. On each RPC call, `connect(database_id, user)` in `mathesar/rpc/utils.py` opens a connection as the mapped role.

- `api_tests/test_happy_db_setups.py` walks through exactly these steps and is the best executable reference. The same steps as shell commands are in `.agents/docs/01-setup/drive-the-app.md`, section "Test as a user with limited privileges".
- Steps 2 and 3 are independent. `roles.add` does not store the password. `roles.configured.add` does not check that the role exists or that the password is right. A mismatch shows up as a connection error later.
- `roles.configured.*` never returns a password. `ConfiguredRoleInfo` has only `id`, `name`, `server_id`.
- `databases.setup.create_new` stores the internal database role (from `POSTGRES_USER` and `POSTGRES_PASSWORD`) as a `ConfiguredRole` and maps the calling admin to it. That role is often a Postgres superuser.
- Admins are not exempt from needing a mapping. `databases.configured.list` shows them every database, but `connect` raises `NoConnectionAvailable` (code `-28030`) without a map row.

## What gates each operation

| Operation | Django-level gate | Postgres-level gate |
|---|---|---|
| See a database record | Admin, or own map row (`databases.configured.list`) | None |
| Any `auth="login"` method with `database_id` | Map row for that database. Admins skip this check. | Depends on the method |
| Read or write records, DDL on schemas, tables, columns, constraints | Map row | Privileges of the mapped role. Failure is `InsufficientPrivilege` from psycopg. |
| Listing schemas, tables, columns | Map row | Results are filtered or annotated with `current_role_priv` and `current_role_owns` |
| Create, drop, alter Postgres roles and memberships (`roles.*`) | Map row | Role attributes such as `CREATEROLE` |
| Grant and revoke privileges, transfer ownership (`*.privileges.*`) | Map row | Ownership or grant option |
| Drop a database (`databases.delete`) | Map row | Database ownership |
| Table and column metadata (`*.metadata.*`) | Map row | None. Any collaborator can read and write it. |
| Explorations: list, get, add, replace, delete | Map row | None |
| `explorations.run`, CSV export views | Map row | Privileges of the mapped role |
| Forms: list, delete, regenerate token, publish | Map row | None |
| Forms: add, patch | Map row, plus a role check (see forms below) | None at save time |

- "Standard users can change metadata and explorations regardless of Postgres privileges" is a documented product limitation (`docs/docs/snippets/metadata-access-control.md`).
- The frontend hides or disables actions using `current_role_priv` and `current_role_owns`. That is presentation only. The server-side gate is Postgres.

## Admin-only RPC methods

Methods declared without `auth=` (default `"superuser"`) or with `auth="superuser"`:

| Namespace | Methods |
|---|---|
| `analytics` | `get_state`, `initialize`, `disable`, `view_report` |
| `collaborators` | `add`, `delete`, `set_role` |
| `columns` | `reset_mash` |
| `databases` | `upgrade_sql` |
| `databases.configured` | `patch`, `disconnect` |
| `databases.setup` | `create_new`, `connect_existing` |
| `roles.configured` | `add`, `delete`, `set_password` |
| `servers.configured` | `patch` |
| `users` | `add`, `delete`, `get`, `list`, `patch_other` |
| `users.password` | `revoke` |

Check the current state with:

```
grep -rn "@mathesar_rpc_method" mathesar/rpc/ | grep -v 'auth="login"\|auth=.login.\|auth="anonymous"'
```

`mathesar/tests/rpc/test_endpoints.py` pins the auth level of every method. Changing a level requires editing that list.

Login-level methods exempt from the per-database check (`authorization_ignore_list` in `mathesar/rpc/decorators.py`): `analytics.upload_feedback`, `databases.configured.list`, `servers.configured.list`, `users.patch_self`, `users.password.replace_own`. The two list methods filter their results by the caller's map rows.

## Anonymous and shared form access

Admin-facing guidance (rate limiting, associated roles, upload limits): `docs/docs/administration/forms-config.md`.

- Page: `/shares/forms/<token>` is served by `anonymous_route_home` in `mathesar/views/__init__.py` without login. It sets the CSRF cookie and creates a session.
- For visitors who are not logged in, `common_data` contains only base fields and `routing_context: 'anonymous'`.
- Four RPC methods use `auth="anonymous"`: `forms.get`, `forms.get_source_info`, `forms.list_related_records`, `forms.submit`.
- Their checks are in `mathesar/utils/forms.py`, function `has_permission_for_form`: the form has `publish_public`, or the caller is logged in and is a collaborator on the form's database.
- `forms.submit` additionally requires `publish_public` for every caller.
- Failed checks are `assert` statements. They surface as RPC code `-31002` (`AssertionError`).
- Database work for a form uses `Form.connection`: the form's `associated_role`, not the visitor's role and not the creator's session.
- So the associated role's privileges are the whole security boundary of a public form. `forms.list_related_records` exposes record summaries of related tables to anyone with the token.
- When saving a form, `validate_and_get_associated_role` requires the chosen role to be the saver's own mapped role or one of its parent roles. Admins may choose any stored role.
- `forms.regenerate_token` replaces the UUID and invalidates old links.

File access for anonymous form users, guards in `mathesar/auth.py`:

- The file views in `mathesar/views/download_link.py` use the guard `FILE_ACCESS_VIA_LOGIN_OR_SHARED_FORM_FIELD`.
- It passes for a logged-in user. Otherwise it needs query parameters `form_token` (a public form) and `form_field_key` (a field whose column has a file backend), and the backend's `public_form_access.enabled` must not be false.
- Anonymous upload size is capped by `public_form_access.max_upload_size` (default 1 GiB). Logged-in uploads have no cap in this code.
- The file header of `mathesar/auth.py` notes that auth checks are not centralized and links the tracking issue.

## `PER_USER_DATABASES_ENABLED`

- Setting defined in `config/settings/common_settings.py`. Marked experimental in `docs/docs/releases/0.11.0.md`.
- When true, `set_up_home_role_and_db_for_user` in `mathesar/utils/permissions.py` runs for each new user. Callers: `add_user` in `mathesar/utils/users.py` and `SocialAccountAdapter.save_user`.
- It uses the internal database credentials to create, on the internal server: a login role named after the username with a random 16-character password, and a database named after the username owned by that role.
- It then grants `CREATE` on schema `public`, installs Mathesar SQL as the new role, and stores `Server`, `Database`, `ConfiguredRole`, and `UserDatabaseRoleMap` rows.
- The docstring warns that name collisions with existing roles or databases are not handled.
- The internal database role therefore needs `CREATEROLE` and `CREATEDB`.
- This is why `User.username` is capped at 63 characters.
- The flag is passed to the frontend as `per_user_databases_enabled` in `common_data`.

## Where secrets are stored

| Secret | Storage |
|---|---|
| Mathesar user passwords | Django password hashers, in the `password` column of `mathesar_user` |
| Stored role passwords | `ConfiguredRole.password`, Fernet-encrypted with a key derived from `SECRET_KEY` |
| File storage credentials | The file storage config, plus an encrypted copy in each `DownloadLink.fsspec_kwargs` |
| `SECRET_KEY` | Env variable, or generated into the git-ignored `.secrets` directory |
| Internal database password | Env `POSTGRES_PASSWORD` |
| SSO client secrets | Env `SSO_CONFIG_DICT` or the SSO YAML file. Never in the database. |
| Form share tokens | `Form.token`, plain UUID |

- Losing or changing `SECRET_KEY` makes every stored role password and download link unusable. Decryption does not raise. It returns ciphertext, and connections fail with a Postgres authentication error.
- It also invalidates the `mash` of every stored file reference (see "File storage" in `.agents/docs/02-backend/overview.md`).
- Passwords travel in plain text inside RPC params (`roles.add`, `roles.configured.add`, `databases.setup.connect_existing`, `users.add`). Do not log RPC params.
- Connections are opened with the plaintext role password taken from the decrypted field. Do not put a connection or `conn.info` in logs or error messages.
