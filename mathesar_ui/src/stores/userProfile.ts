/* eslint-disable max-classes-per-file */

import { setContext, getContext } from 'svelte';
import {
  get,
  writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Writable,
} from 'svelte/store';
import type {
  User,
  UnsavedUser,
  DatabaseRole,
  SchemaRole,
} from '@mathesar/api/users';
import {
  roleAllowsOperation,
  type AccessOperation,
} from '@mathesar/utils/permissions';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';

const contextKey = Symbol('UserProfileStore');

export class UserProfile {
  readonly id: User['id'];

  readonly isSuperUser: User['is_superuser'];

  readonly full_name: User['full_name'];

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

  with(userDetails: Partial<Omit<UnsavedUser, 'password'>>): UserProfile {
    return new UserProfile({
      ...this.getUser(),
      ...userDetails,
    });
  }
}

export class UserProfileStore implements Writable<UserProfile> {
  store: Writable<UserProfile>;

  constructor(userProfile: UserProfile) {
    this.store = writable(userProfile);
  }

  set(value: UserProfile): void {
    this.store.set(value);
  }

  update(updater: Updater<UserProfile>): void {
    this.store.update(updater);
  }

  subscribe(run: Subscriber<UserProfile>): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): UserProfile {
    return get(this.store);
  }
}

/* eslint-enable max-classes-per-file */

export function getUserProfileStoreFromContext(): UserProfileStore | undefined {
  return getContext<UserProfileStore>(contextKey);
}

export function setUserProfileStoreInContext(user: User): void {
  if (getUserProfileStoreFromContext() !== undefined) {
    throw Error('User profile store context has already been set');
  }
  setContext(contextKey, new UserProfileStore(new UserProfile(user)));
}
