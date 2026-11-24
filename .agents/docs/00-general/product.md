# Product context

What Mathesar is, who uses it, the vocabulary, and the product rules that decide design questions. Read this before changing user-facing behavior or naming something.

## What it is

Mathesar is a self-hosted web application that gives a spreadsheet-like interface to PostgreSQL databases. Users view and edit records, build tables and relationships, query across tables, and collect data through forms, without writing SQL. It works on the database directly: a table in Mathesar is a PostgreSQL table, a relationship is a foreign key, and access control is PostgreSQL roles and privileges.

- License: GPLv3. Maintained by the Mathesar Foundation, a 501(c)(3) nonprofit.
- Status: public beta since 0.2.0 (January 2025). Latest release: 0.12.0 (July 2026).
- Hosted version: Mathesar Cloud (`https://mathesar.cloud`), early beta since June 2026. Its code is not in this repo.
- User documentation source: `docs/docs/`. Published at `https://docs.mathesar.org`.

## Users

- An administrator (developer, DBA, IT person) installs Mathesar and connects databases.
- Collaborators use it daily. Many have no database background.
- A key audience has an existing production PostgreSQL database and wants a UI on top of it.

## Product rules

These come from the project's product principles (`https://wiki.mathesar.org/product/principles/`) and from review history. They settle most design questions.

1. Mathesar is a front end to existing databases. It must not alter data or require its own data model. Anything it creates is standard PostgreSQL that other tools can use.
1. Database concepts are not hidden and are not required knowledge. The UI says "schema", "table", "foreign key" where they apply.
1. PostgreSQL is the source of truth for data, structure and permissions. Mathesar stores only a thin layer of metadata (display options, record summary templates, saved explorations, forms).
1. Permission checks on user data happen in PostgreSQL, under the role of the current user. Do not duplicate them in Python or in the front end.
1. Convention over configuration. Prefer a sensible default to a new setting.
1. Keep implementation simple. Between two options that both rest on assumptions about users, pick the one that is simpler to build.
1. User-facing changes that are not specified in the issue need product approval from a maintainer before they merge.

## Vocabulary

The UI, PostgreSQL and the code use different words for the same things. Use the UI term in strings and docs, and the code term in identifiers.

| UI term | PostgreSQL concept | In the code |
|---|---|---|
| Database | Database | Django model `Database`, addressed by `database_id` |
| Server | Host and port | Django model `Server`, `server_id` |
| Internal database | The database Mathesar itself uses | Django `default` database, set by the `POSTGRES_*` variables |
| Internal server | The PostgreSQL server that hosts the internal database | Target of `databases.setup.create_new` |
| Schema | Schema | `schema_oid` in Python and RPC, `sch_id` in SQL |
| Table | Table (views are listed too) | `table_oid` in Python and RPC, `tab_id` in SQL |
| Column | Attribute | `attnum` in Python and RPC, `col_id` in SQL |
| Record | Row | `record`, an object keyed by attnum |
| Relationship, link | Foreign key constraint | `links` in `db/links.py`, RPC namespace `data_modeling` |
| Record summary | None (Mathesar metadata) | `record_summary_template` on `TableMetaData` |
| Data type | One or more PostgreSQL types | "abstract type" in `mathesar_ui/src/stores/abstract-types/` |
| Exploration, Data Explorer | A saved query definition | Django model `Explorations`, RPC namespace `explorations` |
| Form | None (Mathesar object that inserts rows) | Django models `Form` and `FormField`, RPC namespace `forms` |
| Mathesar user (Admin or Standard) | None | Django model `User`, `is_superuser` |
| Role | Role | RPC namespace `roles` |
| Stored role | Role whose password Mathesar keeps | Django model `ConfiguredRole`, RPC namespace `roles.configured` |
| Collaborator | A user mapped to one stored role on one database | Django model `UserDatabaseRoleMap`, RPC namespace `collaborators` |
| Metadata | None | Django models `TableMetaData`, `ColumnMetaData` |
| File (column type) | A `json` or `jsonb` column whose values point at objects in a storage backend | `file_backend` on `ColumnMetaData`, `mathesar/utils/download_links.py`, Django model `DownloadLink` |

Mathesar installs its own functions and types into three schemas in every connected database: `msar`, `__msar` (deprecated) and `mathesar_types`. The UI hides them.

## Features

Table view with inline editing, filter, sort and group. Record page with related records. Schema and table management. Relationships, including many-to-many. Data Explorer (read-only query builder). Forms with public links. CSV and TSV import, CSV export. File attachments (S3-compatible or Azure storage). Users, collaborators, roles and privileges. Single sign-on (OIDC, GitHub). UI in English, Spanish, French and Japanese.

Where each one lives in the code: `.agents/docs/04-features/index.md`. How each one behaves for users: `docs/docs/user-guide/`.

## Limits to respect

- PostgreSQL only (versions 14 to 18).
- The RPC API is documented as unstable. Breaking changes are allowed, but the front end in this repo must change in the same PR.
- The Data Explorer is read-only.
- Supported Python versions are 3.10 to 3.14. Support for a Python or PostgreSQL version is dropped only in a minor release (`docs/docs/administration/version-support.md`).
- Releases 0.1.x cannot be upgraded to 0.2.0 or later. No code needs to stay compatible with 0.1.x data.

## Where direction is recorded

- Roadmap items: open issues labeled `type: project`.
- Requirements and proposals for larger features: `https://wiki.mathesar.org/product/`.
- Release notes: `docs/docs/releases/`.
