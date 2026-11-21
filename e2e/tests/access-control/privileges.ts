import type { Database, Schema, Table } from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';

function tableName(table: Table): string {
  return `${quoteIdentifier(table.schema.name)}.${quoteIdentifier(table.name)}`;
}

async function run(database: Database, sql: string): Promise<void> {
  await runSql(database.name, sql);
}

/** `privileges` as in GRANT, for example `CONNECT, CREATE`. */
export function grantOnDatabase(
  database: Database,
  role: string,
  privileges: string,
): Promise<void> {
  return run(
    database,
    `GRANT ${privileges} ON DATABASE ${quoteIdentifier(database.name)} TO ${quoteIdentifier(role)}`,
  );
}

/**
 * New databases grant CONNECT and TEMPORARY to every role. This leaves them to
 * the roles they are granted to.
 */
export function revokeDatabaseFromPublic(database: Database): Promise<void> {
  return run(
    database,
    `REVOKE ALL ON DATABASE ${quoteIdentifier(database.name)} FROM PUBLIC`,
  );
}

export function grantOnSchema(
  schema: Schema,
  role: string,
  privileges: string,
): Promise<void> {
  return run(
    schema.database,
    `GRANT ${privileges} ON SCHEMA ${quoteIdentifier(schema.name)} TO ${quoteIdentifier(role)}`,
  );
}

/** `privileges` as in GRANT, for example `SELECT, UPDATE ("Pages")`. */
export function grantOnTable(
  table: Table,
  role: string,
  privileges: string,
): Promise<void> {
  return run(
    table.schema.database,
    `GRANT ${privileges} ON ${tableName(table)} TO ${quoteIdentifier(role)}`,
  );
}

export function makeOwnerOfSchema(schema: Schema, role: string): Promise<void> {
  return run(
    schema.database,
    `ALTER SCHEMA ${quoteIdentifier(schema.name)} OWNER TO ${quoteIdentifier(role)}`,
  );
}

export function makeOwnerOfTable(table: Table, role: string): Promise<void> {
  return run(
    table.schema.database,
    `ALTER TABLE ${tableName(table)} OWNER TO ${quoteIdentifier(role)}`,
  );
}

/** The privileges out of `candidates` that PostgreSQL reports for the role. */
async function heldPrivileges(
  database: Database,
  candidates: string[],
  check: string,
  values: unknown[],
): Promise<string[]> {
  const rows = await runSql<{ privilege: string }>(
    database.name,
    `SELECT privilege
     FROM unnest($1::text[]) WITH ORDINALITY AS candidate(privilege, position)
     WHERE ${check}
     ORDER BY position`,
    [candidates, ...values],
  );
  return rows.map(({ privilege }) => privilege);
}

export function privilegesOnDatabase(
  database: Database,
  role: string,
): Promise<string[]> {
  return heldPrivileges(
    database,
    ['CONNECT', 'CREATE', 'TEMPORARY'],
    'has_database_privilege($2, current_database(), privilege)',
    [role],
  );
}

export function privilegesOnSchema(
  schema: Schema,
  role: string,
): Promise<string[]> {
  return heldPrivileges(
    schema.database,
    ['USAGE', 'CREATE'],
    'has_schema_privilege($2, $3::oid, privilege)',
    [role, schema.oid],
  );
}

export function privilegesOnTable(
  table: Table,
  role: string,
): Promise<string[]> {
  return heldPrivileges(
    table.schema.database,
    [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER',
    ],
    'has_table_privilege($2, $3::oid, privilege)',
    [role, table.oid],
  );
}

async function owner(
  database: Database,
  sql: string,
  values: unknown[],
): Promise<string | undefined> {
  const [row] = await runSql<{ owner: string }>(database.name, sql, values);
  return row?.owner;
}

export function ownerOfDatabase(
  database: Database,
): Promise<string | undefined> {
  return owner(
    database,
    `SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = $1`,
    [database.name],
  );
}

export function ownerOfSchema(schema: Schema): Promise<string | undefined> {
  return owner(
    schema.database,
    `SELECT pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE oid = $1`,
    [schema.oid],
  );
}

export function ownerOfTable(table: Table): Promise<string | undefined> {
  return owner(
    table.schema.database,
    `SELECT pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid = $1`,
    [table.oid],
  );
}
