/* eslint-disable max-classes-per-file */

import { setContext, getContext } from 'svelte';
import { derived, get, writable, type Writable } from 'svelte/store';
import userApi, {
  type User,
  type UnsavedUser,
  type DatabaseRole,
  type SchemaRole,
  type UserRole,
} from '@mathesar/api/users';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';
import type { MakeWritablePropertiesReadable } from '@mathesar/utils/typeUtils';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import {
  roleAllowsOperation,
  type AccessOperation,
} from '@mathesar/utils/permissions';

export class UserModel {
  readonly id: User['id'];

  readonly isSuperUser: User['is_superuser'];

  readonly fullName: User['full_name'];

  readonly email: User['email'];

  readonly username: User['username'];

  private databaseRoles: Map<DatabaseRole['database'], DatabaseRole>;

  private schemaRoles: Map<SchemaRole['schema'], SchemaRole>;

  constructor(userDetails: User) {
    this.id = userDetails.id;
    this.isSuperUser = userDetails.is_superuser;
    this.databaseRoles = new Map(
      userDetails.database_roles.map((role) => [role.database, role]),
    );
    this.schemaRoles = new Map(
      userDetails.schema_roles.map((role) => [role.schema, role]),
    );
    this.fullName = userDetails.full_name;
    this.email = userDetails.email;
    this.username = userDetails.username;
  }

  hasPermission(
    dbObject: {
      database?: Pick<Database, 'id'>;
      schema?: Pick<SchemaEntry, 'id'>;
    },
    operation: AccessOperation,
  ): boolean {
    if (this.isSuperUser) {
      return true;
    }
    const { database, schema } = dbObject;
    if (schema) {
      const userSchemaRole = this.schemaRoles.get(schema.id);
      if (userSchemaRole) {
        return roleAllowsOperation(userSchemaRole.role, operation);
      }
    }
    if (database) {
      const userDatabaseRole = this.databaseRoles.get(database.id);
      if (userDatabaseRole) {
        return roleAllowsOperation(userDatabaseRole.role, operation);
      }
    }
    if (schema && !database) {
      throw new Error(
        'Schema needs to be accompanied by the database for permission checks',
      );
    }
    return false;
  }

  getRoleForDb(database: Pick<Database, 'id'>) {
    return this.databaseRoles.get(database.id);
  }

  getRoleForSchema(schema: Pick<SchemaEntry, 'id'>) {
    return this.schemaRoles.get(schema.id);
  }

  hasDirectDbAccess(database: Pick<Database, 'id'>) {
    return this.databaseRoles.has(database.id);
  }

  hasDbAccess(database: Pick<Database, 'id'>) {
    return this.hasDirectDbAccess(database) || this.isSuperUser;
  }

  hasDirectSchemaAccess(schema: Pick<SchemaEntry, 'id'>) {
    return this.schemaRoles.has(schema.id);
  }

  hasSchemaAccess(
    database: Pick<Database, 'id'>,
    schema: Pick<SchemaEntry, 'id'>,
  ) {
    return this.hasDbAccess(database) || this.hasDirectSchemaAccess(schema);
  }

  getDisplayName(): string {
    return this.username;
  }

  getUser(): User {
    return {
      id: this.id,
      is_superuser: this.isSuperUser,
      username: this.username,
      database_roles: [...this.databaseRoles.values()],
      schema_roles: [...this.schemaRoles.values()],
      full_name: this.fullName,
      email: this.email,
    };
  }

  with(userDetails: Partial<Omit<UnsavedUser, 'password'>>): UserModel {
    return new UserModel({
      ...this.getUser(),
      ...userDetails,
    });
  }

  withNewDatabaseRole(dbRole: DatabaseRole) {
    return new UserModel({
      ...this.getUser(),
      database_roles: [...this.databaseRoles.values(), dbRole],
    });
  }

  withoutDatabaseRole(dbRole: Pick<DatabaseRole, 'database'>) {
    return new UserModel({
      ...this.getUser(),
      database_roles: [...this.databaseRoles.values()].filter(
        (entry) => entry.database !== dbRole.database,
      ),
    });
  }

  withNewSchemaRole(schemaRole: SchemaRole) {
    return new UserModel({
      ...this.getUser(),
      schema_roles: [...this.schemaRoles.values(), schemaRole],
    });
  }

  withoutSchemaRole(schemaRole: Pick<SchemaRole, 'schema'>) {
    return new UserModel({
      ...this.getUser(),
      schema_roles: [...this.schemaRoles.values()].filter(
        (entry) => entry.schema !== schemaRole.schema,
      ),
    });
  }
}

const contextKey = Symbol('users list store');

class WritableUsersStore {
  readonly requestStatus: Writable<RequestStatus | undefined> = writable();

  readonly users = writable<UserModel[]>([]);

  readonly count = writable(0);

  private request: ReturnType<typeof userApi.list> | undefined;

  constructor() {
    void this.fetchUsers();
  }

  /**
   * @throws Error
   */
  private async fetchUsersSilently() {
    this.request?.cancel();
    this.request = userApi.list();
    const response = await this.request;
    this.users.set(response.results.map((user) => new UserModel(user)));
    this.count.set(response.count);
  }

  async fetchUsers() {
    try {
      this.requestStatus.set({
        state: 'processing',
      });
      await this.fetchUsersSilently();
      this.requestStatus.set({
        state: 'success',
      });
    } catch (e) {
      this.requestStatus.set({
        state: 'failure',
        errors: [getErrorMessage(e)],
      });
    }
  }

  async getUserDetails(userId: number) {
    const requestStatus = get(this.requestStatus);
    if (requestStatus?.state === 'success') {
      return get(this.users).find((user) => user.id === userId);
    }
    if (requestStatus?.state === 'processing') {
      const result = await this.request;
      const user = result?.results.find((entry) => entry.id === userId);
      if (user) {
        return new UserModel(user);
      }
    }
    return undefined;
  }

  async delete(userId: number) {
    this.requestStatus.set({
      state: 'processing',
    });
    await userApi.delete(userId);
    this.users.update((users) => users.filter((user) => user.id !== userId));
    this.count.update((count) => count - 1);
    this.requestStatus.set({
      state: 'success',
    });
    // Re-fetching the users isn't strictly necessary, but we do it anyway
    // since it's a good opportunity to ensure the UI is up-to-date.
    void this.fetchUsersSilently();
  }

  async addDatabaseRoleForUser(
    userId: number,
    database: Pick<Database, 'id'>,
    role: UserRole,
  ) {
    const dbRole = await userApi.addDatabaseRole(userId, database.id, role);
    this.users.update((users) =>
      users.map((user) => {
        if (user.id === userId) {
          return user.withNewDatabaseRole(dbRole);
        }
        return user;
      }),
    );
    void this.fetchUsersSilently();
  }

  async removeDatabaseAccessForUser(
    userId: number,
    database: Pick<Database, 'id'>,
  ) {
    const user = get(this.users).find((entry) => entry.id === userId);
    const dbRole = user?.getRoleForDb(database);
    if (dbRole) {
      await userApi.deleteDatabaseRole(dbRole.id);
      this.users.update((users) =>
        users.map((entry) => {
          if (entry.id === userId) {
            return entry.withoutDatabaseRole(dbRole);
          }
          return entry;
        }),
      );
      void this.fetchUsersSilently();
    }
  }

  async addSchemaRoleForUser(
    userId: number,
    schema: Pick<SchemaEntry, 'id'>,
    role: UserRole,
  ) {
    const schemaRole = await userApi.addSchemaRole(userId, schema.id, role);
    this.users.update((users) =>
      users.map((user) => {
        if (user.id === userId) {
          return user.withNewSchemaRole(schemaRole);
        }
        return user;
      }),
    );
    void this.fetchUsersSilently();
  }

  async removeSchemaAccessForUser(
    userId: number,
    schema: Pick<SchemaEntry, 'id'>,
  ) {
    const user = get(this.users).find((entry) => entry.id === userId);
    const schemaRole = user?.getRoleForSchema(schema);
    if (schemaRole) {
      await userApi.deleteSchemaRole(schemaRole.id);
      this.users.update((users) =>
        users.map((entry) => {
          if (entry.id === userId) {
            return entry.withoutSchemaRole(schemaRole);
          }
          return entry;
        }),
      );
      void this.fetchUsersSilently();
    }
  }

  getUsersWithAccessToDb(database: Pick<Database, 'id'>) {
    return derived(this.users, ($users) =>
      $users.filter((user) => user.hasDbAccess(database)),
    );
  }

  getUsersWithoutAccessToDb(database: Pick<Database, 'id'>) {
    return derived(this.users, ($users) =>
      $users.filter((user) => !user.hasDbAccess(database)),
    );
  }

  getNormalUsersWithDirectSchemaRole(schema: Pick<SchemaEntry, 'id'>) {
    return derived(this.users, ($users) =>
      $users.filter(
        (user) => !user.isSuperUser && user.hasDirectSchemaAccess(schema),
      ),
    );
  }

  getNormalUsersWithoutDirectSchemaRole(schema: Pick<SchemaEntry, 'id'>) {
    return derived(this.users, ($users) =>
      $users.filter(
        (user) => !user.isSuperUser && !user.hasDirectSchemaAccess(schema),
      ),
    );
  }

  getUsersWithAccessToSchema(
    database: Pick<Database, 'id'>,
    schema: Pick<SchemaEntry, 'id'>,
  ) {
    return derived(this.users, ($users) =>
      $users.filter((user) => user.hasSchemaAccess(database, schema)),
    );
  }
}

export type UsersStore = MakeWritablePropertiesReadable<WritableUsersStore>;

export function getUsersStoreFromContext(): UsersStore | undefined {
  return getContext<WritableUsersStore>(contextKey);
}

export function setUsersStoreInContext(): UsersStore {
  if (getUsersStoreFromContext() !== undefined) {
    throw Error('UsersStore context has already been set');
  }
  const usersStore = new WritableUsersStore();
  setContext(contextKey, usersStore);
  return usersStore;
}

/* eslint-enable max-classes-per-file */
