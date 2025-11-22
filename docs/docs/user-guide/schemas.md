# Schemas

## What is a schema?

"Schema" is one of those funny words that can mean different things in different contexts, even within the word of relational database systems.

While all relational databases store their data in [tables](./tables.md), PostgreSQL has an additional level of nesting which requires every table to live within one and only one schema. You might think of a schema as a sort of folder. PostgreSQL sometimes calls it a "namespace". Schemas exist to help organize tables (and other database objects such as functions) into logical groups and avoid naming collisions.

Schemas cannot contain other schemas, so there is a fixed hierarchy of objects... Within a database you have multiple schemas. And within a schema you have multiple tables. Mathesar's interface mirrors this structure.

## The "public" schema

Every PostgreSQL database has a schema named `public`. It cannot be deleted or renamed. It's also common for PostgreSQL servers to be configured to allow all roles to create tables within the public schema. And it's common for people to use PostgreSQL heavily without ever venturing outside the public schema. If you don't need to separate your data into different schemas, you can put everything in the public schema and more or less forget about schemas altogether.

## Managing schemas within your database

Mathesar lets you add/remove/rename the schemas in your database from within the database page. You can also add descriptions to your schemas which are stored in PostgreSQL as [COMMENTs](https://www.postgresql.org/docs/current/sql-comment.html).

However, your ability to alter schemas may be limited by [access control](./access-control.md) &mdash; and you won't be able to change the public schema.

## Organizing your data &mdash; schemas or databases?

If you have separate, self-contained data projects you can choose between organizing them into separate schemas within the same database or into entirely separate databases.

## Schema Permissions {:#permissions}

- **Owner:** In PostgreSQL, every schema has a role set as its [owner](./roles.md#ownership).

    Only the owner can:
    
    - Drop the schema
    - Manage schema-level privileges
    - Transfer ownership

- **Granted Privileges:** Additionally, the following privileges on one schema may be granted to specific roles in PostgreSQL:
    - `USAGE`- Allows the role to see the tables within the schema.
    - `CREATE`- Allows the role to create new tables within the schema.

See the [PostgreSQL docs](https://www.postgresql.org/docs/17/ddl-priv.html) for more info.

To manage the owner and granted privileges for a schema, navigate to the schema page in Mathesar and click on the **Schema Permissions** button at the top right.

## Mathesar's internal schemas {:#internal}

Mathesar allows you to work with all the schemas in your database _except_ for the following Mathesar-specific "internal" schemas:

- `mathesar_types` - This holds Mathesar's custom [data types](./data-types.md) that you can use for your data.
- `msar` - This holds the bulk of Mathesar's application code, defined as PostgreSQL functions.
- `__msar` - This is a deprecated schema which holds some Mathesar functions that are [gradually being migrated](https://github.com/mathesar-foundation/mathesar/blob/develop/db/sql/STANDARDS.md#quoting-escaping-sql-injection-and-security) to the `msar` schema.

The first time you use Mathesar to connect to your database, Mathesar installs these schemas. Mathesar's approach to [tightly integrating with PostgreSQL](./index.md#postgres) means these schemas are required for Mathesar to function with your database. For Mathesar to successfully install them, you'll need to enure that the PostgreSQL role you provide has `CREATE` privileges on the database. After the schemas are installed and your database is connected, you can revoke the `CREATE` privilege if do not wish for your users to be able to create other schemas.

