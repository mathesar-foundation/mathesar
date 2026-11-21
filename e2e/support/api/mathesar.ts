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

/**
 * How Mathesar summarizes a record: text parts and column parts, in order. A
 * column part is a chain of attnums, from this table along the links it follows.
 */
export type RecordSummaryTemplate = (string | number[])[];

/** Display options of a column by their stored names, for example `{ date_format: 'friendly' }`. */
export interface ColumnMetadata {
  [option: string]: string | number | null;
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

/** A user as Mathesar stores it. */
export interface UserDetails {
  id: number;
  username: string;
  isAdmin: boolean;
  fullName: string | null;
  email: string | null;
  displayLanguage: string;
}

interface UserInfo {
  id: number;
  username: string;
  is_superuser: boolean;
  full_name: string | null;
  email: string | null;
  display_language: string;
}

/** A PostgreSQL role that Mathesar stores the password of. */
export interface StoredRole {
  id: number;
  name: string;
  password: string;
}

/** A stored role as the API lists it. The API never returns the password. */
export interface StoredRoleInfo {
  id: number;
  name: string;
}

/** A user's access to a database, by the ids of the user and of the stored role. */
export interface Collaboration {
  userId: number;
  storedRoleId: number;
}

interface DatabaseConnectionResult {
  database: { id: number; name: string; server_id: number };
}

/** A connected database as Mathesar stores it. */
export interface StoredDatabase extends Database {
  nickname: string | null;
  needsUpgrade: boolean;
}

interface StoredDatabaseInfo {
  id: number;
  name: string;
  server_id: number;
  nickname: string | null;
  needs_upgrade_attention: boolean;
}

/** A PostgreSQL server as Mathesar stores it. */
export interface StoredServer {
  id: number;
  host: string;
  port: number | null;
  sslmode: string;
}

/** What Mathesar needs to connect a database that exists on a server. */
export interface ExistingDatabase {
  name: string;
  role: string;
  password: string;
  /** Defaults to the server of the stack. */
  host?: string;
}

export interface Exploration {
  id: number;
  name: string;
  description: string | null;
}

/** A step that an exploration applies to its columns, in the format of the API. */
export interface ExplorationTransformation {
  type: 'filter' | 'order' | 'hide' | 'summarize';
  spec: unknown;
}

export interface ExplorationColumn {
  alias: string;
  attnum: number;
  /** The foreign keys that lead from the base table to the table of the column. */
  joinPath?: [table: number, attnum: number][][];
}

/** An exploration to save through the API. */
export interface NewExploration {
  name: string;
  /** Columns of the base table by name, in the order of the result. */
  columns: string[];
  description?: string;
  transformations?: ExplorationTransformation[];
  /** In the format of the API. */
  displayOptions?: unknown;
}

/** A saved exploration with all that the Data Explorer stores for it. */
export interface ExplorationDefinition extends Exploration {
  baseTableOid: number;
  columns: ExplorationColumn[];
  transformations: ExplorationTransformation[];
  /** Column alias to the name shown in the result. */
  displayNames: Record<string, string>;
  /** In the format of the API. */
  displayOptions: unknown;
}

interface ExplorationInfo extends Exploration {
  base_table_oid: number;
  initial_columns: {
    alias: string;
    attnum: number;
    join_path?: [number, number][][];
  }[];
  transformations: ExplorationTransformation[] | null;
  display_names: Record<string, string> | null;
  display_options: unknown;
}

export interface Form {
  id: number;
  name: string;
  description: string | null;
  /** The last part of the public link. */
  token: string;
}

/** How the visitor of a form fills a foreign key field. */
export type ForeignKeyRule = 'must_pick' | 'can_pick_or_create' | 'must_create';

/** A field of a form to save through the API. */
export interface NewFormField {
  /** A column of the table that the field belongs to. Also the label, unless one is given. */
  column: string;
  label?: string;
  help?: string;
  required?: boolean;
  /** Shows a text column as a text area. */
  large?: boolean;
  /** For a foreign key column: the table it refers to and the fields that create a record there. */
  link?: { table: Table; rule: ForeignKeyRule; fields?: NewFormField[] };
}

/** A form to save through the API. */
export interface NewForm {
  name: string;
  description?: string;
  fields: NewFormField[];
  /** Defaults to the role of the user who saves the form. */
  associatedRole?: StoredRole;
  buttonLabel?: string;
  confirmationMessage?: string;
  redirectUrl?: string;
}

/** A field of a form as Mathesar stores it. */
export interface FormFieldDefinition {
  label: string | null;
  help: string | null;
  required: boolean;
  columnAttnum: number;
  large: boolean;
  /** Only a foreign key field has a rule. */
  rule: ForeignKeyRule | null;
  /** The fields that create the linked record, in their order. */
  fields: FormFieldDefinition[];
}

/** A saved form with all that the form builder stores for it. */
export interface FormDefinition extends Form {
  baseTableOid: number;
  isPublic: boolean;
  associatedRoleId: number | null;
  buttonLabel: string | null;
  confirmationMessage: string | null;
  redirectUrl: string | null;
  /** In the order of the form. */
  fields: FormFieldDefinition[];
}

interface FormFieldInfo {
  index: number;
  label: string | null;
  help: string | null;
  column_attnum: number;
  fk_interaction_rule: ForeignKeyRule | null;
  styling: { size?: string } | null;
  is_required: boolean;
  child_fields: FormFieldInfo[] | null;
}

interface FormInfo extends Form {
  base_table_oid: number;
  publish_public: boolean;
  associated_role_id: number | null;
  submit_button_label: string | null;
  submit_message: { text: string } | null;
  submit_redirect_url: string | null;
  fields: FormFieldInfo[];
}

function toFormFieldDefinitions(
  fields: FormFieldInfo[],
): FormFieldDefinition[] {
  return [...fields]
    .sort((a, b) => a.index - b.index)
    .map((field) => ({
      label: field.label,
      help: field.help,
      required: field.is_required,
      columnAttnum: field.column_attnum,
      large: field.styling?.size === 'large',
      rule: field.fk_interaction_rule,
      fields: toFormFieldDefinitions(field.child_fields ?? []),
    }));
}

/** Field definitions in the format of the API, with keys like those the form builder generates. */
function toFormFieldDefs(fields: NewFormField[], table: Table): unknown[] {
  return fields.map((field, index) => ({
    key: `_id-${crypto.randomUUID()}`,
    index,
    label: field.label ?? field.column,
    help: field.help ?? null,
    column_attnum: table.columns[field.column],
    styling: field.large ? { size: 'large' } : {},
    is_required: field.required ?? false,
    ...(field.link
      ? {
          kind: 'foreign_key',
          related_table_oid: field.link.table.oid,
          fk_interaction_rule: field.link.rule,
          child_fields: toFormFieldDefs(
            field.link.fields ?? [],
            field.link.table,
          ),
        }
      : { kind: 'scalar_column' }),
  }));
}

/** Mathesar's own database on the server of the stack. `env.ts` has no setting for it. */
const INTERNAL_DATABASE = 'mathesar_django';

let nameCounter = 0;

/** A name that no other test or worker uses, readable in the UI. */
export function uniqueName(prefix: string): string {
  nameCounter += 1;
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${process.pid}_${nameCounter}_${random}`;
}

const RUN_ROLE_PREFIX = `e2e_${env.runId}_`;

/**
 * A name for a role on the server. The role stays until the teardown of the
 * run drops it: a role dropped while other tests run breaks their pages.
 */
export function uniqueRoleName(): string {
  return uniqueName(`${RUN_ROLE_PREFIX}role`);
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

  /** The connected database with this name, if there is one. */
  async findDatabase(name: string): Promise<StoredDatabase | undefined> {
    const databases = await this.rpc.call<StoredDatabaseInfo[]>(
      'databases.configured.list',
    );
    const database = databases.find((candidate) => candidate.name === name);
    return (
      database && {
        id: database.id,
        name,
        serverId: database.server_id,
        nickname: database.nickname,
        needsUpgrade: database.needs_upgrade_attention,
      }
    );
  }

  /**
   * Drops a database by name, connected or not, as the cleanup for one that the UI created.
   * Disconnects every record of it, also those that a failing test stored twice.
   */
  async dropDatabaseNamed(name: string): Promise<void> {
    const databases = await this.rpc.call<StoredDatabaseInfo[]>(
      'databases.configured.list',
    );
    const records = databases.filter((database) => database.name === name);
    for (const { id } of records) {
      await this.rpc.call('databases.configured.disconnect', {
        database_id: id,
        strict: false,
      });
    }
    await runSql(
      'postgres',
      `DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`,
    );
  }

  /** Connects a database that exists on a server, as the Connect Database form does. */
  async connectDatabase(existing: ExistingDatabase): Promise<Database> {
    const { database } = await this.rpc.call<DatabaseConnectionResult>(
      'databases.setup.connect_existing',
      {
        host: existing.host ?? env.postgresFromMathesar.host,
        port: env.postgresFromMathesar.port,
        database: existing.name,
        role: existing.role,
        password: existing.password,
      },
    );
    return {
      id: database.id,
      name: existing.name,
      serverId: database.server_id,
    };
  }

  /** Disconnects a database. Mathesar also forgets its server and the stored roles, if no other database uses them. */
  async disconnectDatabaseAndServer(database: Database): Promise<void> {
    await this.rpc.call('databases.configured.disconnect', {
      database_id: database.id,
      strict: false,
      disconnect_db_server: true,
    });
  }

  async setNickname(database: Database, nickname: string): Promise<void> {
    await this.rpc.call('databases.configured.patch', {
      database_id: database.id,
      patch: { nickname },
    });
  }

  listServers(): Promise<StoredServer[]> {
    return this.rpc.call<StoredServer[]>('servers.configured.list');
  }

  /** Marks the database as installed by an older Mathesar. No API does this, so it writes to Mathesar's own database. */
  async markAsNeedingUpgrade(database: Database): Promise<void> {
    await runSql(
      INTERNAL_DATABASE,
      `UPDATE mathesar_database SET last_confirmed_sql_version = '0.0.0' WHERE id = $1`,
      [database.id],
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

  async findUser(username: string): Promise<UserDetails | undefined> {
    const users = await this.rpc.call<UserInfo[]>('users.list');
    const user = users.find((candidate) => candidate.username === username);
    return (
      user && {
        id: user.id,
        username,
        isAdmin: user.is_superuser,
        fullName: user.full_name,
        email: user.email,
        displayLanguage: user.display_language,
      }
    );
  }

  /** Sets the language of the app for a user: `en`, `es`, `fr` or `ja`. */
  async setDisplayLanguage(user: User, language: string): Promise<void> {
    const stored = await this.rpc.call<UserInfo>('users.get', {
      user_id: user.id,
    });
    await this.rpc.call('users.patch_other', {
      user_id: user.id,
      username: stored.username,
      is_superuser: stored.is_superuser,
      email: stored.email,
      full_name: stored.full_name,
      display_language: language,
    });
  }

  /** Deletes a user that a test created through the UI or may have deleted itself. */
  async deleteUserNamed(username: string): Promise<void> {
    const user = await this.findUser(username);
    if (user) await this.rpc.call('users.delete', { user_id: user.id });
  }

  async isUsageDataCollectionEnabled(): Promise<boolean> {
    const { enabled } = await this.rpc.call<{ enabled: boolean }>(
      'analytics.get_state',
    );
    return enabled;
  }

  async setUsageDataCollection(enabled: boolean): Promise<void> {
    if ((await this.isUsageDataCollectionEnabled()) === enabled) return;
    await this.rpc.call(enabled ? 'analytics.initialize' : 'analytics.disable');
  }

  /** The version of Mathesar that the instance runs. */
  async version(): Promise<string> {
    const report = await this.rpc.call<{ mathesar_version: string }>(
      'analytics.view_report',
    );
    return report.mathesar_version;
  }

  /** Creates a login role with no privileges and stores its password in Mathesar. */
  async createStoredRole(
    database: Database,
    name = uniqueRoleName(),
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

  /**
   * Removes the roles of this run from Mathesar and from the server. Their
   * databases must be gone, as they are once the workers of the run stopped.
   */
  async dropRolesOfRun(): Promise<void> {
    // The API lists stored roles only through a database of their server.
    const storedRoles = await runSql<{ id: number }>(
      INTERNAL_DATABASE,
      'SELECT id FROM mathesar_configuredrole WHERE starts_with(name, $1)',
      [RUN_ROLE_PREFIX],
    );
    for (const { id } of storedRoles) {
      await this.rpc.call('roles.configured.delete', {
        configured_role_id: id,
      });
    }
    const roles = await runSql<{ name: string }>(
      'postgres',
      'SELECT rolname AS name FROM pg_roles WHERE starts_with(rolname, $1)',
      [RUN_ROLE_PREFIX],
    );
    if (roles.length === 0) return;
    // In one statement, since a role can be the grantor of another's membership.
    await runSql(
      'postgres',
      `DROP ROLE ${roles.map(({ name }) => quoteIdentifier(name)).join(', ')}`,
    );
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

  /** Gives a user access to a database through the stored role of the admin who created it. */
  async addCollaboratorWithCreatorRole(
    database: Database,
    user: User,
  ): Promise<void> {
    const [creator] = await this.listCollaborators(database);
    if (!creator) throw new Error(`No collaborator on ${database.name}`);
    await this.rpc.call('collaborators.add', {
      database_id: database.id,
      user_id: user.id,
      configured_role_id: creator.storedRoleId,
    });
  }

  async listCollaborators(database: Database): Promise<Collaboration[]> {
    const collaborators = await this.rpc.call<
      { user_id: number; configured_role_id: number }[]
    >('collaborators.list', { database_id: database.id });
    return collaborators.map((collaborator) => ({
      userId: collaborator.user_id,
      storedRoleId: collaborator.configured_role_id,
    }));
  }

  /** Stores a password for a role name, whether or not that role exists on the server. */
  async storeRole(
    database: Database,
    name: string,
    password: string,
  ): Promise<StoredRole> {
    const { id } = await this.rpc.call<{ id: number }>('roles.configured.add', {
      server_id: database.serverId,
      name,
      password,
    });
    return { id, name, password };
  }

  /** The roles on the server of the database that Mathesar stores a password of. */
  async listStoredRoles(database: Database): Promise<StoredRoleInfo[]> {
    const roles = await this.rpc.call<StoredRoleInfo[]>(
      'roles.configured.list',
      { database_id: database.id, server_id: database.serverId },
    );
    return roles.map(({ id, name }) => ({ id, name }));
  }

  /** The roles that Mathesar stores a password of for a server. The API lists them only through a database. */
  async storedRoleNamesOfServer(serverId: number): Promise<string[]> {
    const roles = await runSql<{ name: string }>(
      INTERNAL_DATABASE,
      'SELECT name FROM mathesar_configuredrole WHERE server_id = $1 ORDER BY name',
      [serverId],
    );
    return roles.map(({ name }) => name);
  }

  /** The PostgreSQL role that this user reaches the database as. */
  async currentRoleName(database: Database): Promise<string> {
    const { current_role: role } = await this.rpc.call<{
      current_role: { name: string };
    }>('roles.get_current_role', { database_id: database.id });
    return role.name;
  }

  /** Leaves a table as an import that the user has not confirmed yet. */
  async markImportUnconfirmed(table: Table): Promise<void> {
    await this.rpc.call('tables.metadata.set', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
      metadata: { import_verified: false },
    });
  }

  /** Creates the table of an uploaded data file and leaves it unconfirmed, as the import page does. */
  async importDataFile(schema: Schema, dataFileId: number): Promise<Table> {
    const { name } = await this.rpc.call<{ name: string }>('tables.import', {
      database_id: schema.database.id,
      schema_oid: schema.oid,
      data_file_id: dataFileId,
    });
    const table = await this.getTable(schema, name);
    await this.rpc.call('tables.metadata.set', {
      database_id: schema.database.id,
      table_oid: table.oid,
      metadata: { import_verified: false, data_file_id: dataFileId },
    });
    return table;
  }

  /** Whether the import of a table is confirmed. A table that was not imported counts as confirmed. */
  async isImportConfirmed(
    table: Pick<Table, 'oid' | 'schema'>,
  ): Promise<boolean> {
    const { metadata } = await this.rpc.call<{
      metadata: { import_verified: boolean | null } | null;
    }>('tables.get_with_metadata', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
    });
    return metadata?.import_verified !== false;
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

  async listExplorations(schema: Schema): Promise<Exploration[]> {
    const explorations = await this.rpc.call<Exploration[]>(
      'explorations.list',
      { database_id: schema.database.id, schema_oid: schema.oid },
    );
    return explorations.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }

  /** Saves an exploration of one table. Columns get the alias that the Data Explorer gives them. */
  async defineExploration(
    table: Table,
    exploration: NewExploration,
  ): Promise<Exploration> {
    const aliases = exploration.columns.map(
      (column) => `${table.name}_${column}`,
    );
    return this.rpc.call<Exploration>('explorations.add', {
      database_id: table.schema.database.id,
      exploration_def: {
        name: exploration.name,
        description: exploration.description,
        base_table_oid: table.oid,
        schema_oid: table.schema.oid,
        initial_columns: exploration.columns.map((column, index) => ({
          attnum: table.columns[column],
          alias: aliases[index],
        })),
        display_names: Object.fromEntries(
          aliases.map((alias) => [alias, alias]),
        ),
        // As the Data Explorer saves it. Without a list, the export fails.
        transformations: exploration.transformations ?? [],
        display_options: exploration.displayOptions,
      },
    });
  }

  /** The saved exploration with this name, if there is one. */
  async findExploration(
    schema: Schema,
    name: string,
  ): Promise<ExplorationDefinition | undefined> {
    const explorations = await this.rpc.call<ExplorationInfo[]>(
      'explorations.list',
      { database_id: schema.database.id, schema_oid: schema.oid },
    );
    const found = explorations.find((candidate) => candidate.name === name);
    return (
      found && {
        id: found.id,
        name: found.name,
        description: found.description,
        baseTableOid: found.base_table_oid,
        columns: found.initial_columns.map(
          ({ alias, attnum, join_path: joinPath }) => ({
            alias,
            attnum,
            ...(joinPath && { joinPath }),
          }),
        ),
        transformations: found.transformations ?? [],
        displayNames: found.display_names ?? {},
        displayOptions: found.display_options,
      }
    );
  }

  async listForms(schema: Schema): Promise<Form[]> {
    const forms = await this.rpc.call<Form[]>('forms.list', {
      database_id: schema.database.id,
      schema_oid: schema.oid,
    });
    return forms.map(({ id, name, description, token }) => ({
      id,
      name,
      description,
      token,
    }));
  }

  async deleteForm(schema: Schema, form: Form): Promise<void> {
    await this.rpc.call('forms.delete', {
      database_id: schema.database.id,
      form_id: form.id,
    });
  }

  /** Opens the public link of a form. */
  async publishForm(schema: Schema, form: Form): Promise<void> {
    await this.rpc.call('forms.set_publish_public', {
      database_id: schema.database.id,
      form_id: form.id,
      publish_public: true,
    });
  }

  /** Closes the public link of a form. */
  async unpublishForm(schema: Schema, form: Form): Promise<void> {
    await this.rpc.call('forms.set_publish_public', {
      database_id: schema.database.id,
      form_id: form.id,
      publish_public: false,
    });
  }

  /** Saves a form with fields and settings, as the form builder does. */
  async defineForm(table: Table, form: NewForm): Promise<Form> {
    const { id, name, description, token } = await this.rpc.call<Form>(
      'forms.add',
      {
        database_id: table.schema.database.id,
        form_def: {
          name: form.name,
          description: form.description ?? null,
          version: 1,
          schema_oid: table.schema.oid,
          base_table_oid: table.oid,
          associated_role_id: form.associatedRole?.id ?? null,
          header_title: { text: form.name },
          header_subtitle: form.description ? { text: form.description } : null,
          submit_button_label: form.buttonLabel ?? null,
          submit_message: form.confirmationMessage
            ? { text: form.confirmationMessage }
            : null,
          submit_redirect_url: form.redirectUrl ?? null,
          fields: toFormFieldDefs(form.fields, table),
        },
      },
    );
    return { id, name, description, token };
  }

  /** The saved form with this id, if there is one. */
  async findForm(
    schema: Schema,
    id: number,
  ): Promise<FormDefinition | undefined> {
    const forms = await this.rpc.call<FormInfo[]>('forms.list', {
      database_id: schema.database.id,
      schema_oid: schema.oid,
    });
    const found = forms.find((candidate) => candidate.id === id);
    return (
      found && {
        id,
        name: found.name,
        description: found.description,
        token: found.token,
        baseTableOid: found.base_table_oid,
        isPublic: found.publish_public,
        associatedRoleId: found.associated_role_id,
        buttonLabel: found.submit_button_label,
        confirmationMessage: found.submit_message?.text ?? null,
        redirectUrl: found.submit_redirect_url,
        fields: toFormFieldDefinitions(found.fields),
      }
    );
  }

  /** Turns an integer column into a user column, which holds Mathesar users. */
  async makeUserColumn(table: Table, column: string): Promise<void> {
    await this.rpc.call('columns.metadata.set', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
      column_meta_data_list: [
        { attnum: table.columns[column], user_display_field: 'username' },
      ],
    });
  }

  /** Stores display settings of a column, as the inspector or a resize does. */
  async setColumnMetadata(
    table: Table,
    column: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.rpc.call('columns.metadata.set', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
      column_meta_data_list: [{ attnum: table.columns[column], ...metadata }],
    });
  }

  /** Makes Mathesar record in a user column who last edited each record. */
  async trackEditingUserIn(table: Table, column: string): Promise<void> {
    await this.rpc.call('tables.metadata.set', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
      metadata: { user_tracking_attnum: table.columns[column] },
    });
  }

  /** The display options stored for a column, without the unset ones. */
  async columnMetadata(table: Table, column: string): Promise<ColumnMetadata> {
    const columns = await this.rpc.call<
      { id: number; metadata: ColumnMetadata | null }[]
    >('columns.list_with_metadata', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
    });
    const metadata =
      columns.find(({ id }) => id === table.columns[column])?.metadata ?? {};
    return Object.fromEntries(
      Object.entries(metadata).filter(
        ([key, value]) => key !== 'attnum' && value !== null,
      ),
    );
  }

  async setRecordSummaryTemplate(
    table: Table,
    template: RecordSummaryTemplate,
  ): Promise<void> {
    await this.rpc.call('tables.metadata.set', {
      database_id: table.schema.database.id,
      table_oid: table.oid,
      metadata: { record_summary_template: template },
    });
  }

  /** The stored template of a table. `null` stands for the default summary. */
  async recordSummaryTemplate(
    table: Table,
  ): Promise<RecordSummaryTemplate | null> {
    const metadata = await this.rpc.call<
      { table_oid: number; record_summary_template: RecordSummaryTemplate }[]
    >('tables.metadata.list', { database_id: table.schema.database.id });
    const stored = metadata.find(({ table_oid: oid }) => oid === table.oid);
    return stored?.record_summary_template ?? null;
  }

  /** The stored order of the columns, as attnums. `null` stands for the order of the table. */
  async columnOrder(table: Table): Promise<number[] | null> {
    const metadata = await this.rpc.call<
      { table_oid: number; column_order: number[] | null }[]
    >('tables.metadata.list', { database_id: table.schema.database.id });
    const stored = metadata.find(({ table_oid: oid }) => oid === table.oid);
    return stored?.column_order ?? null;
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
