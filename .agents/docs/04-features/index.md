# Feature index

Where each user-facing feature lives across the layers. Read this first when an issue names a feature, to find the code to open. Then read the layer docs under `.agents/docs/02-backend/` and `.agents/docs/03-frontend/`.

Each feature lists the same layers in order: SQL (`db/sql/`), Python wrapper (`db/`), service (`mathesar/`), front end (`mathesar_ui/src/`), user docs (`docs/docs/`). A missing layer means the feature does not use it.

Find an RPC method by name: `grep -rn 'mathesar_rpc_method(name="records\.' mathesar/rpc`. Find an SQL function: `grep -nE '^\s*(CREATE OR REPLACE FUNCTION\s+)?msar\.list_records_from_table\(' db/sql/*.sql`.

## Data: view and edit

### Table view (the sheet)

| Layer | Location |
|---|---|
| SQL | Section "DQL FUNCTIONS" of `db/sql/05_msar.sql`: `msar.list_records_from_table`, `msar.add_record_to_table`, `msar.patch_record_in_table`, `msar.delete_records_from_table` |
| Wrapper | `db/records.py` |
| Service | `mathesar/rpc/records.py`, metadata in `mathesar/rpc/tables/metadata.py` and `mathesar/rpc/columns/metadata.py` |
| Front end | Page `mathesar_ui/src/pages/table/`, system `mathesar_ui/src/systems/table-view/`, grid `mathesar_ui/src/components/sheet/`, state `mathesar_ui/src/stores/table-data/` |
| User docs | `docs/docs/user-guide/tables.md` |

Bulk paste, copy and keyboard navigation are in `mathesar_ui/src/components/sheet/clipboard/` and `mathesar_ui/src/components/sheet/selection/`.

### Filter, sort, group, hide columns

| Layer | Location |
|---|---|
| SQL | `msar.build_where_clause`, table `msar.expr_templates` (valid filter keys), `msar.build_order_by_expr`, `msar.build_grouping_expr` in `db/sql/05_msar.sql` |
| Service | Parameters `filter`, `order`, `grouping` of `records.list` in `mathesar/rpc/records.py` |
| Front end | `mathesar_ui/src/stores/table-data/filtering.ts`, `mathesar_ui/src/stores/table-data/sorting.ts`, `mathesar_ui/src/stores/table-data/grouping.ts`, `mathesar_ui/src/stores/table-data/hiddenColumns.ts`, builder UI `mathesar_ui/src/components/filter/`, per-type conditions `mathesar_ui/src/stores/abstract-types/operations/filtering.ts` |

View state is kept in the `q` URL parameter, not in the database.

### Record page and record summaries

| Layer | Location |
|---|---|
| SQL | `msar.get_record_from_table`, `msar.build_record_summary_query_from_template`, `msar.list_by_record_summaries` in `db/sql/05_msar.sql` |
| Service | `records.get`, `records.list_summaries` in `mathesar/rpc/records.py`. Template stored in `TableMetaData.record_summary_template` |
| Front end | `mathesar_ui/src/pages/record/`, `mathesar_ui/src/systems/record-view/`, `mathesar_ui/src/systems/record-view-modal/`, `mathesar_ui/src/stores/table-data/record-summaries/` |

### Data types

| Layer | Location |
|---|---|
| SQL | Custom types in `db/sql/01_msar_types.sql`, casts in `db/sql/45_msar_type_casting.sql`, inference in `db/sql/46_msar_type_inference.sql` |
| Service | `columns.patch` in `mathesar/rpc/columns/base.py`, display options in `ColumnMetaData` |
| Front end | Type mapping `mathesar_ui/src/stores/abstract-types/`, cells and inputs `mathesar_ui/src/components/cell-fabric/`, type picker `mathesar_ui/src/components/abstract-type-control/` |
| User docs | `docs/docs/user-guide/data-types.md`, `docs/docs/user-guide/user-type.md` |

The User type and last-editor tracking: `mathesar/utils/user_display.py`, fields `ColumnMetaData.user_display_field` and `TableMetaData.user_tracking_attnum`.

## Data model

### Schemas, tables, columns, constraints

| Layer | Location |
|---|---|
| SQL | Sections from "ALTER SCHEMA" to "COLUMN ALTERATION FUNCTIONS" of `db/sql/05_msar.sql` |
| Wrapper | `db/schemas.py`, `db/tables.py`, `db/columns.py`, `db/constraints.py` |
| Service | `mathesar/rpc/schemas/base.py`, `mathesar/rpc/tables/base.py`, `mathesar/rpc/columns/base.py`, `mathesar/rpc/constraints.py` |
| Front end | `mathesar_ui/src/pages/schema/`, `mathesar_ui/src/systems/schemas/`, `mathesar_ui/src/systems/table-view/table-inspector/`, `mathesar_ui/src/systems/table-view/constraints/`, stores `mathesar_ui/src/stores/schemas.ts`, `mathesar_ui/src/stores/tables.ts`, `mathesar_ui/src/stores/table-data/columns.ts` |
| User docs | `docs/docs/user-guide/schemas.md`, `docs/docs/user-guide/tables.md` |

### Relationships

Foreign keys, many-to-many mapping tables, picking a related record, and related columns in the table view ("Extend").

| Layer | Location |
|---|---|
| SQL | `msar.add_foreign_key_column`, `msar.add_mapping_table`, `msar.extract_columns_from_table`, `msar.move_columns_to_referenced_table` in `db/sql/05_msar.sql`. Join paths in `db/sql/10_msar_joinable_tables.sql`. Joined columns: `msar.build_join_expr` |
| Wrapper | `db/links.py`, `db/tables.py` |
| Service | `mathesar/rpc/data_modeling.py`, `tables.list_joinable` in `mathesar/rpc/tables/base.py` |
| Front end | Create: `mathesar_ui/src/systems/table-view/link-table/`. Pick a record: `mathesar_ui/src/systems/record-selector/`, `mathesar_ui/src/systems/row-seeker/`, `mathesar_ui/src/systems/multi-tagger/`. Joined columns: `mathesar_ui/src/stores/table-data/joining.ts`, `mathesar_ui/src/stores/table-data/joinedColumns.ts` |
| User docs | `docs/docs/user-guide/relationships.md` |

## Data in and out

### Import (CSV, TSV, paste)

| Layer | Location |
|---|---|
| SQL | `msar.prepare_table_for_import`, `msar.prepare_temp_table_for_import`, `msar.insert_from_select`, `msar.get_preview` in `db/sql/05_msar.sql`, inference in `db/sql/46_msar_type_inference.sql` |
| Service | Upload view `mathesar/views/data_files.py`, parsing `mathesar/utils/datafiles.py` and `mathesar/utils/csv.py`, load `mathesar/imports/datafile.py`, into an existing table `mathesar/views/bulk_insert.py`, RPC `tables.import`, `tables.get_import_preview`, `data_modeling.suggest_types` |
| Front end | New table: `mathesar_ui/src/pages/import/`. Existing table: `mathesar_ui/src/systems/table-view/import/`. HTTP: `mathesar_ui/src/api/rest/dataFiles.ts`, `mathesar_ui/src/api/rest/bulkInsert.ts` |
| User docs | `docs/docs/user-guide/importing-data.md` |

### Export (CSV)

| Layer | Location |
|---|---|
| SQL | `msar.get_table_columns_and_records` in `db/sql/05_msar.sql` |
| Service | `mathesar/views/export.py` (streamed with a server-side cursor through `fetch_table_in_chunks` in `db/tables.py`) |
| Front end | Links in `mathesar_ui/src/systems/table-view/table-inspector/table/TableActions.svelte` and `mathesar_ui/src/systems/data-explorer/action-pane/ActionsPane.svelte` |
| User docs | `docs/docs/user-guide/exporting-data.md` |

### File attachments

| Layer | Location |
|---|---|
| Service | `mathesar/utils/download_links.py`, `mathesar/views/download_link.py`, access guards in `mathesar/auth.py`, model `DownloadLink`, marker `ColumnMetaData.file_backend` |
| Config | `file_storage.yml.example`, variable `FILE_STORAGE_DICT` |
| Front end | `mathesar_ui/src/components/file-attachments/`, `mathesar_ui/src/api/rest/fileAttachments.ts` |
| User docs | `docs/docs/user-guide/files.md`, `docs/docs/administration/file-backend-config.md` |

Needs an object store to test. See `DEVELOPER_GUIDE.md`, "Working with file attachments".

## Query and collect

### Data Explorer (explorations)

| Layer | Location |
|---|---|
| SQL | Aggregates in `db/sql/30_msar_custom_aggregates.sql` |
| Query builder | `db/deprecated/` (SQLAlchemy). This is the only feature that still uses it |
| Service | `mathesar/rpc/explorations.py`, `mathesar/utils/explorations.py`, model `Explorations` |
| Front end | `mathesar_ui/src/pages/data-explorer/`, `mathesar_ui/src/systems/data-explorer/`, list store `mathesar_ui/src/stores/queries.ts`. The code says "query" where the UI says "exploration" |
| User docs | `docs/docs/user-guide/data-explorer.md` |

### Forms

| Layer | Location |
|---|---|
| SQL | `msar.form_insert`, `msar.get_tab_col_info_map` in `db/sql/05_msar.sql` |
| Wrapper | `db/forms.py` |
| Service | `mathesar/rpc/forms.py`, `mathesar/utils/forms.py`, models `Form` and `FormField`, public page view `anonymous_route_home` in `mathesar/views/__init__.py` |
| Front end | Builder: `mathesar_ui/src/pages/data-forms/`, `mathesar_ui/src/systems/data-forms/`. Public fill page: `mathesar_ui/src/pages/shared-data-form/` |
| User docs | `docs/docs/user-guide/forms.md`, `docs/docs/administration/forms-config.md` |

The public form page is the only screen that works without login. Its security boundary is the form's associated role.

## Access

### Databases and connections

| Layer | Location |
|---|---|
| Service | `mathesar/rpc/databases/`, `mathesar/rpc/servers/configured.py`, setup logic `mathesar/utils/permissions.py`, models `Server`, `Database` |
| Front end | `mathesar_ui/src/pages/home/`, `mathesar_ui/src/pages/database/`, `mathesar_ui/src/systems/databases/`, `mathesar_ui/src/stores/databases.ts` |
| User docs | `docs/docs/user-guide/databases.md` |

Sample datasets offered when creating or connecting a database: `mathesar/examples/`.

### Users, login, SSO

| Layer | Location |
|---|---|
| Service | `mathesar/rpc/users.py`, `mathesar/utils/users.py`, `mathesar/views/users/`, `mathesar/sso.py`, `config/sso_config.py`, model `User` |
| Templates | `mathesar/templates/registration/login.html`, `mathesar/templates/installation/complete_installation.html`. Login page text and logo: `config/login_page_config.py` |
| Front end | `mathesar_ui/src/pages/admin-users/`, `mathesar_ui/src/pages/user-profile/`, `mathesar_ui/src/systems/users/` |
| User docs | `docs/docs/user-guide/users.md`, `docs/docs/administration/single-sign-on.md` |

### Roles, collaborators, privileges

| Layer | Location |
|---|---|
| SQL | Section "ROLE MANIPULATION FUNCTIONS" and the privilege listings in `db/sql/05_msar.sql` |
| Wrapper | `db/roles.py` |
| Service | `mathesar/rpc/roles/`, `mathesar/rpc/collaborators.py`, the `privileges.py` module in each of `mathesar/rpc/databases/`, `mathesar/rpc/schemas/`, `mathesar/rpc/tables/`. Models `ConfiguredRole`, `UserDatabaseRoleMap` |
| Front end | `mathesar_ui/src/pages/database/settings/`, permissions modal `mathesar_ui/src/systems/permissions/`, `mathesar_ui/src/models/internal/ObjectCurrentAccess.ts` |
| User docs | `docs/docs/user-guide/access-control.md`, `docs/docs/user-guide/roles.md`, `docs/docs/user-guide/stored-roles.md`, `docs/docs/user-guide/collaborators.md` |

How the pieces fit: `.agents/docs/02-backend/auth-permissions.md`.

## Administration

| Feature | Location |
|---|---|
| Upgrade notice and SQL upgrade | `mathesar_ui/src/pages/admin-update/`, `mathesar_ui/src/stores/releases.ts`, `mathesar_ui/src/3rd-party-apis/github-releases.ts`, RPC `databases.upgrade_sql`, version in `mathesar/__init__.py` |
| Usage analytics and feedback | `mathesar/analytics.py`, `mathesar/rpc/analytics.py`, `mathesar_ui/src/pages/admin-settings/`, `mathesar_ui/src/systems/feedback/`, `docs/docs/user-guide/usage-data-collection.md` |
| Health checks | `HealthCheckMiddleware` in `mathesar/middleware.py` |
| Environment variables | `config/settings/common_settings.py`, `docs/docs/administration/environment-variables.md` |
| Languages | `mathesar_ui/src/i18n/`, `translations/`, `LANGUAGES` in `config/settings/common_settings.py`. See `.agents/docs/03-frontend/i18n.md` |
| Theme (light, dark) | `mathesar_ui/src/utils/uiThemePreference.ts`, tokens under `mathesar_ui/src/component-library/common/styles/themes/` |
