import { Client } from 'pg';

import type { Database } from '../../support/api/mathesar';
import { runSql } from '../../support/api/postgres';
import { env } from '../../support/env';

export interface ServerRole {
  login: boolean;
}

/** A role as the PostgreSQL server knows it, if it exists. */
export async function findServerRole(
  name: string,
): Promise<ServerRole | undefined> {
  const [role] = await runSql<ServerRole>(
    'postgres',
    'SELECT rolcanlogin AS login FROM pg_roles WHERE rolname = $1',
    [name],
  );
  return role;
}

/** The roles that are direct members of the role. */
export async function childRolesOf(parentRole: string): Promise<string[]> {
  const rows = await runSql<{ name: string }>(
    'postgres',
    `SELECT child.rolname AS name
     FROM pg_auth_members
       JOIN pg_roles parent ON parent.oid = pg_auth_members.roleid
       JOIN pg_roles child ON child.oid = pg_auth_members.member
     WHERE parent.rolname = $1
     ORDER BY child.rolname`,
    [parentRole],
  );
  return rows.map(({ name }) => name);
}

/** Whether the server accepts the password of the role for the database. */
export async function canLogIn(
  database: Database,
  role: string,
  password: string,
): Promise<boolean> {
  const client = new Client({
    ...env.postgres,
    database: database.name,
    user: role,
    password,
  });
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.end();
  }
}
