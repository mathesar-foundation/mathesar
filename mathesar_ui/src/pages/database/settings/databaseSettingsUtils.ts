import { getContext, setContext } from 'svelte';
import { type Readable, type Writable, derived, writable } from 'svelte/store';

import { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
import type { Database } from '@mathesar/models/Database';
import { Role } from '@mathesar/models/Role';

const contextKey = Symbol('database settings store');

class DatabaseSettingsContext {
  database: Database;

  configuredRoles;

  roles;

  combinedRoles: Readable<
    { name: string; role?: Role; configuredRole?: ConfiguredRole }[]
  >;

  constructor(database: Database) {
    this.database = database;
    this.configuredRoles = database.fetchConfiguredRoles();
    this.roles = database.fetchRoles();
    this.combinedRoles = derived(
      [this.roles, this.configuredRoles],
      ([$roles, $configuredRoles]) => {
        const isLoading = $configuredRoles.isLoading || $roles.isLoading;
        if (isLoading) {
          return [];
        }
        const isStable = $configuredRoles.isStable && $roles.isStable;
        const roles = $roles.resolvedValue;
        const configuredRoles = $configuredRoles.resolvedValue?.mapKeys(
          (cr) => cr.name,
        );
        if (isStable && roles && configuredRoles) {
          return [...roles.values()].map((role) => ({
            name: role.name,
            role,
            configuredRole: configuredRoles.get(role.name),
          }));
        }
        if ($configuredRoles.isStable && configuredRoles) {
          [...configuredRoles.values()].map((configuredRole) => ({
            name: configuredRole.name,
            configuredRole,
          }));
        }
        return [];
      },
    );
  }
}

export function getDatabaseSettingsContext(): Readable<DatabaseSettingsContext> {
  const store = getContext<Writable<DatabaseSettingsContext>>(contextKey);
  if (store === undefined) {
    throw Error('Database settings context has not been set');
  }
  return store;
}

export function setDatabaseSettingsContext(
  database: Database,
): Readable<DatabaseSettingsContext> {
  let store = getContext<Writable<DatabaseSettingsContext>>(contextKey);
  const databaseSettingsContext = new DatabaseSettingsContext(database);
  if (store !== undefined) {
    store.set(databaseSettingsContext);
    return store;
  }
  store = writable(databaseSettingsContext);
  setContext(contextKey, store);
  return store;
}
