/* eslint-disable max-classes-per-file */

import { setContext, getContext } from 'svelte';
import { derived, get, writable, type Writable } from 'svelte/store';
import userApi, {
  type User,
  type UnsavedUser,
  type DatabaseRole,
  type SchemaRole,
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

  readonly full_name: User['full_name'];

  readonly email: User['email'];

  readonly username: User['username'];

  private databaseRoles: Map<DatabaseRole['id'], DatabaseRole>;

  private schemaRoles: Map<SchemaRole['id'], SchemaRole>;

  constructor(userDetails: User) {
    this.id = userDetails.id;
    this.isSuperUser = userDetails.is_superuser;
    this.databaseRoles = new Map(
      userDetails.database_roles.map((role) => [role.id, role]),
    );
    this.schemaRoles = new Map(
      userDetails.schema_roles.map((role) => [role.id, role]),
    );
    this.full_name = userDetails.full_name;
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
    return false;
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
      full_name: this.full_name,
      email: this.email,
    };
  }

  with(userDetails: Partial<Omit<UnsavedUser, 'password'>>): UserModel {
    return new UserModel({
      ...this.getUser(),
      ...userDetails,
    });
  }
}

const contextKey = Symbol('users list store');

class WritableUsersStore {
  readonly requestStatus: Writable<RequestStatus | undefined> = writable();

  readonly users = writable<User[]>([]);

  readonly count = writable(0);

  private request: ReturnType<typeof userApi.list> | undefined;

  constructor() {
    void this.fetchUsers();
  }

  async fetchUsers() {
    try {
      this.requestStatus.set({
        state: 'processing',
      });
      this.request = userApi.list();
      const response = await this.request;
      this.users.set(response.results);
      this.count.set(response.count);
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
      return result?.results.find((user) => user.id === userId);
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
    void this.fetchUsers();
  }

  getUsersWithAccessToDb(databaseId: Database['id']) {
    return derived(this.users, ($users) =>
      $users.filter(
        (user) =>
          user.database_roles.find(
            (dbRoles) => dbRoles.database === databaseId,
          ) || user.is_superuser,
      ),
    );
  }

  getUsersWithoutAccessToDb(databaseId: Database['id']) {
    return derived(this.users, ($users) =>
      $users.filter(
        (user) =>
          user.database_roles.find(
            (dbRoles) => dbRoles.database !== databaseId,
          ) && !user.is_superuser,
      ),
    );
  }

  getUsersWithSchemaAccess(schemaId: SchemaEntry['id']) {
    return derived(this.users, ($users) =>
      $users.filter((user) =>
        user.schema_roles.find((dbRoles) => dbRoles.schema === schemaId),
      ),
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
