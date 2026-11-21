# Django models

Every model in `mathesar/models/`, what the internal database stores versus what is read live from user databases, and the migration conventions.
Read this before adding a field, a model, or a migration, or when debugging data that "disappeared" after a table was recreated.
Authorization rules built on these models are in `agents/docs/02-backend/auth-permissions.md`.

## Where things are stored

| Stored in the internal Django database | Read live from the user database on each request |
|---|---|
| Mathesar users, sessions, SSO accounts (allauth tables) | Schemas, tables, views, columns, constraints |
| Server, database, and role connection records | Records (rows) |
| Which user uses which role on which database | Postgres roles, privileges, ownership |
| Display metadata for tables and columns | Table and column names, types, defaults, comments |
| Saved explorations and forms | Foreign key relationships and join paths |
| Uploaded CSV data file records, file download links | |
| Analytics reports | |

- Django keeps no copy of user database structure. There is no `Table` or `Column` model.
- Metadata rows point at database objects by `(database, table_oid)` or `(database, table_oid, attnum)`. These are plain integers, not foreign keys.
- A table that is dropped and recreated (for example by a dump and restore) gets a new OID. Its metadata, explorations, and forms no longer match.
- `tables.delete` and `columns.delete` do not remove the matching metadata rows. Orphan rows stay in the internal database.

## Files

| File | Models |
|---|---|
| `mathesar/models/users.py` | `User` |
| `mathesar/models/base.py` | `BaseModel`, `Server`, `Database`, `ConfiguredRole`, `UserDatabaseRoleMap`, `ColumnMetaData`, `TableMetaData`, `Explorations`, `Form`, `FormField`, `DataFile`, `DownloadLink` |
| `mathesar/models/analytics.py` | `InstallationID`, `AnalyticsReport` |
| `mathesar/models/exceptions.py` | `NoConnectionAvailable`, `NoAdminConnectionAvailable` (exceptions, not models) |
| `mathesar/models/__init__.py` | Re-exports all models, so `from mathesar.models import User` works. |

`BaseModel` is abstract and adds `created_at` and `updated_at`. Every model except `User` inherits it. Table names are Django defaults, for example `mathesar_database`.

## Connection models

| Model | Key fields | Notes |
|---|---|---|
| `Server` | `host`, `port` (nullable), `sslmode` (`disable`, `prefer`, `require`) | Unique on `(host, port)`. Two partial constraints make a null port unique per host too. `host` may be a Unix socket directory. |
| `Database` | `name`, `nickname`, `server` FK (reverse name `databases`), `last_confirmed_sql_version` | Unique on `(name, server)`. `name` is the real Postgres database name. |
| `ConfiguredRole` | `name`, `server` FK (reverse name `roles`), `password` (encrypted) | Unique on `(name, server)`. A stored login for a Postgres role. The role itself lives on the server. |
| `UserDatabaseRoleMap` | `user`, `database`, `configured_role`, `server` | Unique on `(user, database)`: one role per user per database. The RPC API calls a row a "collaborator". |

Relationship in one line: a `User` reaches a `Database` through exactly one `UserDatabaseRoleMap`, which names the `ConfiguredRole` whose credentials open the connection.

Behavior on these models (all in `mathesar/models/base.py`):

| Member | Does |
|---|---|
| `UserDatabaseRoleMap.connection` | Opens a psycopg connection with the mapped role's name and decrypted password. |
| `Database.connect_user(user)` | Finds the user's map row and returns its connection. Raises `NoConnectionAvailable` if there is none. |
| `Database.connect_manually(role, password)` | Connection with explicit credentials. |
| `Database.connect_admin()` | Finds the owner of schema `msar` using any working map row, then connects as that role if it is a `ConfiguredRole`. Else `NoAdminConnectionAvailable`. |
| `Database.install_sql(username, password)` | Installs Mathesar SQL, then saves `last_confirmed_sql_version = mathesar.__version__`. |
| `Database.uninstall_sql(...)` | Removes Mathesar SQL. |
| `Database.needs_upgrade_attention` | True when the stored SQL version differs from `mathesar.__version__`. |
| `Database.object_counts` | Schema, table, and record counts through the first map row whose connection works. Used by analytics. |

Importing `mathesar/models/base.py` imports `db/sql/install.py` and `db/connection.py`. The models are the bridge between Django and the `db` package.

Hidden constraints:

- `Database` and `ConfiguredRole` each have a second unique constraint on `(id, server)`. It exists only so composite foreign keys can reference it.
- `mathesar/migrations/0002_custom_db_server_integrity_constraints.py` adds two composite foreign keys with raw SQL: `(database_id, server_id)` and `(configured_role_id, server_id)` on `mathesar_userdatabaserolemap`.
- `mathesar/migrations/0007_form_formfield.py` adds the same pair on `mathesar_form` (with `associated_role_id`).
- Effect: a map row or form cannot combine a database and a role from different servers. The database raises `IntegrityError`.
- These constraints are not visible in the model classes.

## Metadata models

| Model | Identity | Fields |
|---|---|---|
| `ColumnMetaData` | Unique `(database, table_oid, attnum)` | Display options by type: `bool_*`, `num_*`, `mon_*`, `time_format`, `date_format`, `duration_min`, `duration_max`. Also `display_width`, `file_backend`, `user_display_field`. |
| `TableMetaData` | Unique `(database, table_oid)` | `data_file` FK (set null), `import_verified`, `column_order` (JSON list of attnums), `record_summary_template` (JSON), `mathesar_added_pkey_attnum`, `user_tracking_attnum`. |

- `ColumnMetaData.file_backend` is what makes a column a file attachment column. The value is a backend key from the file storage config.
- `ColumnMetaData.user_display_field` makes an integer column a "user" column. The cell holds a Mathesar user id, shown as full name, email, or username.
- `TableMetaData.user_tracking_attnum` names the column that `records.add`, `records.patch`, and form submission fill with the acting user's id (`apply_track_editing_user` in `mathesar/utils/user_display.py`).
- `TableMetaData.mathesar_added_pkey_attnum` records the primary key column Mathesar created (`tables.add`, `tables.import`, `columns.add_primary_key_column`).
- A check constraint keeps `num_min_frac_digits` and `num_max_frac_digits` at 20 or less and ordered.
- `get_table_meta_data` in `mathesar/utils/tables.py` creates an empty row when none exists. Reading metadata can write.
- Metadata is not per user. All Mathesar users of a database share it.
- The `*.metadata.set` RPC methods use `update_or_create` with the incoming dict as `defaults`. A new model field must also be added to the TypedDicts in `mathesar/rpc/columns/metadata.py` or `mathesar/rpc/tables/metadata.py`.

## Explorations and forms

| Model | Key fields | Notes |
|---|---|---|
| `Explorations` | `database`, `name`, `base_table_oid`, `schema_oid`, `initial_columns`, `transformations`, `display_options`, `display_names`, `description` | A saved query definition as JSON. `name` is unique across the whole installation, not per database. |
| `Form` | `token` (UUID, unique), `name`, `version`, `database`, `server`, `schema_oid`, `base_table_oid`, `associated_role` FK (set null), `publish_public`, header and submit settings | `token` is the public identifier in share URLs. `Form.connection` connects as `associated_role`. |
| `FormField` | `key`, `form` FK (reverse name `fields`), `index`, `kind`, `column_attnum`, `related_table_oid`, `fk_interaction_rule`, `parent_field` self FK (reverse name `child_fields`), `styling`, `is_required` | Fields form a tree. Children of a foreign key field describe columns of the related table. |

- `FormField.kind` is `scalar_column` or `foreign_key`. A check constraint requires `related_table_oid` and `fk_interaction_rule` for foreign key fields.
- `fk_interaction_rule` is `must_pick`, `can_pick_or_create`, or `must_create`.
- `(key, form)` is unique.
- `patch_form` in `mathesar/utils/forms.py` deletes all fields and recreates them on every update. Field ids are not stable.
- Deleting a `ConfiguredRole` sets `Form.associated_role` to null. The form then raises `NoConnectionAvailable`.

## Files and links

| Model | Key fields | Notes |
|---|---|---|
| `DataFile` | `file`, `user`, `created_from`, `type`, `base_name`, `header`, `delimiter`, `escapechar`, `quotechar`, `encoding` | An uploaded or pasted CSV or TSV. The file is stored under a directory named after the username in the default storage. |
| `DownloadLink` | `mash` (primary key), `sessions` M2M to Django `Session`, `uri`, `thumbnail` (JSON cache), `fsspec_kwargs` (encrypted JSON) | Grants specific browser sessions access to one stored file. |

- `DataFile` rows and files are never deleted by backend code.
- `DataFile.created_from` and `DataFile.type` declare uppercase choices. `create_datafile` in `mathesar/utils/datafiles.py` stores lowercase values (`file`, `paste`, `csv`, `tsv`). Choices are not enforced on save.
- `DataFile.max_level` and `DataFile.sheet_index` are unused leftovers.
- `DownloadLink.fsspec_kwargs` is a copy of the storage backend credentials at link creation time.
- Links with no remaining session are deleted by `maintain_download_links` in `mathesar/utils/download_links.py`.

## User and analytics models

- `User` in `mathesar/models/users.py` extends `AbstractUser`. It removes `first_name` and `last_name`.
- Added fields: `full_name`, `short_name`, `password_change_needed`, `display_language`.
- `username` is limited to 63 characters, the Postgres identifier limit, because per-user databases and roles are named after it.
- `AUTH_USER_MODEL` is `mathesar.User`. Admin rights are the stock `is_superuser` flag. Groups and Django permissions are not used.
- `User.metadata_privileges` always returns `'read write'`. Nothing calls it.
- `InstallationID` holds at most one row (`id` fixed at 1). Its existence means analytics is enabled.
- `AnalyticsReport` holds daily counts until uploaded. Deleting `InstallationID` cascades to reports.

## Encrypted fields

| Field | Type |
|---|---|
| `ConfiguredRole.password` | `EncryptedCharField` |
| `DownloadLink.fsspec_kwargs` | `EncryptedJSONField` |

- Both come from the package `django-fernet-encrypted-fields`.
- The key is derived from `SECRET_KEY` with `SALT_KEY` as salt. Settings set `SALT_KEY = SECRET_KEY`.
- With a different `SECRET_KEY`, decryption fails silently and the field returns the ciphertext. The visible symptom is a Postgres authentication failure for every stored role.
- Assign plaintext to these fields. Encryption happens on save.

## Migrations

- Location: `mathesar/migrations/`. The history is linear, `mathesar/migrations/0001_initial.py` to `mathesar/migrations/0013_datafile_encoding.py`.
- Run by `mathesar/install.py`, which calls `migrate`. That happens at every start of the dev container and of the `production` Docker target, and in the non-Docker install script. The `minimal` Docker target does not run it.
- Create with `python manage.py makemigrations mathesar`.
- File names are mixed: Django auto names, descriptive names, and one release name (`mathesar/migrations/0003_v021.py`).
- `DEFAULT_AUTO_FIELD` is `AutoField`: integer primary keys.
- Database rules that Django cannot express go in `migrations.RunSQL` with a `reverse_sql`, as in the two migrations named under "Hidden constraints".
- No migration uses `RunPython`.
- `pyproject.toml` excludes the directory from the `vulture` dead code check.
- Migrations only ever touch the internal database. Changes to user databases go through `db/sql/` (see `agents/docs/02-backend/sql.md`).

Notable migrations:

| Migration | Why it matters |
|---|---|
| `mathesar/migrations/0001_initial.py` | All base tables, including the custom `User`. |
| `mathesar/migrations/0002_custom_db_server_integrity_constraints.py` | Raw SQL composite foreign keys on the role map. |
| `mathesar/migrations/0003_v021.py` | Makes `ConfiguredRole.password` nullable. Adds `Database.nickname` and `ColumnMetaData.display_width`. Named after a release, not after its content. |
| `mathesar/migrations/0005_make_server_port_nullable.py` | Null port support and the two partial unique constraints on `Server`. |
| `mathesar/migrations/0007_form_formfield.py` | Forms, with raw SQL composite foreign keys. |
| `mathesar/migrations/0008_downloadlink.py` | Download links. Depends on the `sessions` app. |
| `mathesar/migrations/0011_columnmetadata_user_type.py` | `user_display_field` and `user_tracking_attnum`. Written by hand. |
| `mathesar/migrations/0012_alter_user_username.py` | Username length cut from 150 to 63. |

## Checklist: add a model field

1. Edit the model in `mathesar/models/`.
2. Generate the migration.
3. Update the TypedDict and its `from_model` in the matching `mathesar/rpc/` module, or the field never reaches the client.
4. Update the frontend types under `mathesar_ui/src/api/rpc/`.
5. Update `docs/docs/api/methods.md` if a new TypedDict was added.
6. Add or adjust tests in `mathesar/tests/rpc/`.
