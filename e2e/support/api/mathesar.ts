import type { QueryResultRow } from 'pg';

import { env } from '../env';
import { quoteIdentifier, runSql } from './postgres';
import { type Credentials, RpcClient } from './rpc';

export interface Database {
  id: number;
  name: string;
  serverId: number;
}

export interface Schema {
  oid: number;
  name: string;
  database: Database;
}

export interface Table {
  oid: number;
  name: string;
  schema: Schema;
  /** Column name to attnum. */
  columns: Record<string, number>;
}

export interface User extends Credentials {
  id: number;
}

export interface NewUser {
  username?: string;
  password?: string;
  isAdmin?: boolean;
  fullName?: string;
  email?: string;
  /** Leaves the user as an admin-created account that must set a new password at first login. */
  mustChangePassword?: boolean;
}

/** A PostgreSQL role that Mathesar stores the password of. */
export interface StoredRole {
  id: number;
  name: string;
  password: string;
}

interface DatabaseConnectionResult {
  database: { id: number; name: string; server_id: number };
}

let nameCounter = 0;

/** A name that no other test or worker uses, readable in the UI. */
export function uniqueName(prefix: string): string {
  nameCounter += 1;
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${process.pid}_${nameCounter}_${random}`;
}

/** Sets up and inspects the state behind the UI, as one Mathesar user. */
export class MathesarApi {
  private constructor(readonly rpc: RpcClient) {}

  static async as(credentials: Credentials): Promise<MathesarApi> {
    return new MathesarApi(await RpcClient.connect(credentials));
  }

  static asAdmin(): Promise<MathesarApi> {
    return MathesarApi.as(env.admin);
  }

  dispose(): Promise<void> {
    return this.rpc.dispose();
  }

  async createDatabase(name = uniqueName('e2e_db')): Promise<Database> {
    const { database } = await this.rpc.call<DatabaseConnectionResult>(
      'databases.setup.create_new',
      { database: name },
    );
    return { id: database.id, name, serverId: database.server_id };
  }

  /** Disconnects the database from Mathesar and drops it from the server. */
  async dropDatabase(database: Database): Promise<void> {
    const connected = await this.rpc.call<{ id: number }[]>(
      'databases.configured.list',
    );
    if (connected.some(({ id }) => id === database.id)) {
      await this.rpc.call('databases.configured.disconnect', {
        database_id: database.id,
        strict: false,
      });
    }
    await runSql(
      'postgres',
      `DROP DATABASE IF EXISTS ${quoteIdentifier(database.name)} WITH (FORCE)`,
    );
  }

  async createSchema(
    database: Database,
    name = uniqueName('e2e_schema'),
  ): Promise<Schema> {
    const { oid } = await this.rpc.call<{ oid: number }>('schemas.add', {
      database_id: database.id,
      name,
    });
    return { oid, name, database };
  }

  async createUser(newUser: NewUser = {}): Promise<User> {
    const {
      username = uniqueName('e2e_user'),
      password = 'e2e-user-password',
      isAdmin = false,
      fullName,
      email,
      mustChangePassword = false,
    } = newUser;
    const temporaryPassword = mustChangePassword
      ? password
      : `${password}-temporary`;
    const { id } = await this.rpc.call<{ id: number }>('users.add', {
      user_def: {
        username,
        password: temporaryPassword,
        is_superuser: isAdmin,
        full_name: fullName,
        email,
      },
    });
    if (!mustChangePassword) {
      const asUser = await RpcClient.connect({
        username,
        password: temporaryPassword,
      });
      await asUser.call('users.password.replace_own', {
        old_password: temporaryPassword,
        new_password: password,
      });
      await asUser.dispose();
    }
    return { id, username, password };
  }

  async deleteUser(user: User): Promise<void> {
    await this.rpc.call('users.delete', { user_id: user.id });
  }

  /** Creates a login role with no privileges and stores its password in Mathesar. */
  async createStoredRole(
    database: Database,
    name = uniqueName('e2e_role'),
  ): Promise<StoredRole> {
    const password = 'e2e-role-password';
    await runSql(
      'postgres',
      `CREATE ROLE ${quoteIdentifier(name)} LOGIN PASSWORD '${password}'`,
    );
    const { id } = await this.rpc.call<{ id: number }>('roles.configured.add', {
      server_id: database.serverId,
      name,
      password,
    });
    return { id, name, password };
  }

  /** Removes the role from Mathesar and from the server, with all it owns in the database. */
  async dropStoredRole(database: Database, role: StoredRole): Promise<void> {
    await this.rpc.call('roles.configured.delete', {
      configured_role_id: role.id,
    });
    const quotedRole = quoteIdentifier(role.name);
    await runSql(database.name, `DROP OWNED BY ${quotedRole}`);
    await runSql('postgres', `DROP ROLE ${quotedRole}`);
  }

  /** Gives a user access to a database through a stored role. */
  async addCollaborator(
    database: Database,
    user: User,
    role: StoredRole,
  ): Promise<void> {
    await this.rpc.call('collaborators.add', {
      database_id: database.id,
      user_id: user.id,
      configured_role_id: role.id,
    });
  }

  /** Looks up a table that exists in PostgreSQL, however it was created. */
  async getTable(schema: Schema, name: string): Promise<Table> {
    const tables = await this.rpc.call<{ oid: number; name: string }[]>(
      'tables.list',
      { database_id: schema.database.id, schema_oid: schema.oid },
    );
    const table = tables.find((candidate) => candidate.name === name);
    if (!table) {
      throw new Error(`No table "${name}" in schema "${schema.name}"`);
    }
    const columns = await this.rpc.call<{ id: number; name: string }[]>(
      'columns.list',
      { database_id: schema.database.id, table_oid: table.oid },
    );
    return {
      oid: table.oid,
      name,
      schema,
      columns: Object.fromEntries(columns.map(({ id, name }) => [name, id])),
    };
  }
}

/** Runs SQL in a schema of a user database, with that schema first on the search path. */
export function runSqlInSchema<Row extends QueryResultRow = QueryResultRow>(
  schema: Schema,
  sql: string,
): Promise<Row[]> {
  return runSql<Row>(
    schema.database.name,
    `SET search_path TO ${quoteIdentifier(schema.name)}, public; ${sql}`,
  );
}
