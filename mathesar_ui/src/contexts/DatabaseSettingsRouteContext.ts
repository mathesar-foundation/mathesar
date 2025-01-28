import { type Readable, derived } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { User } from '@mathesar/api/rpc/users';
import type { Collaborator } from '@mathesar/models/Collaborator';
import type { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
import type { Database } from '@mathesar/models/Database';
import type { Role } from '@mathesar/models/Role';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { CancellablePromise, ImmutableMap } from '@mathesar-component-library';

import type { DatabaseRouteContext } from './DatabaseRouteContext';
import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('database settings route store');

export type CombinedLoginRole = {
  name: string;
  role?: Role;
  configuredRole?: ConfiguredRole;
};

// TODO: Make CancellablePromise chainable
const getUsersPromise = () => {
  const promise = api.users.list().run();
  return new CancellablePromise<ImmutableMap<User['id'], User>>(
    (resolve, reject) => {
      promise
        .then(
          (response) =>
            resolve(new ImmutableMap(response.map((user) => [user.id, user]))),
          (err) => reject(err),
        )
        .catch((err) => reject(err));
    },
    () => promise.cancel(),
  );
};

export class DatabaseSettingsRouteContext {
  databaseRouteContext: DatabaseRouteContext;

  database: Database;

  configuredRoles;

  combinedLoginRoles: Readable<CombinedLoginRole[]>;

  collaborators;

  users: AsyncStore<void, ImmutableMap<User['id'], User>>;

  constructor(databaseRouteContext: DatabaseRouteContext) {
    this.databaseRouteContext = databaseRouteContext;
    this.database = this.databaseRouteContext.database;
    this.configuredRoles = this.database.constructConfiguredRolesStore();
    this.combinedLoginRoles = derived(
      [this.databaseRouteContext.roles, this.configuredRoles],
      ([$roles, $configuredRoles]) => {
        const isLoading = $configuredRoles.isLoading || $roles.isLoading;
        if (isLoading) {
          return [];
        }
        const isStable = $configuredRoles.isStable && $roles.isStable;
        const loginRoles = $roles.resolvedValue?.filterValues(
          (value) => value.login,
        );
        const configuredRoles = $configuredRoles.resolvedValue?.mapKeys(
          (cr) => cr.name,
        );
        if (isStable && loginRoles && configuredRoles) {
          const allRoles = [...loginRoles.values()].map((role) => ({
            name: role.name,
            role,
            configuredRole: configuredRoles.get(role.name),
          }));
          const allLoginRoleNames = new Set(allRoles.map((ar) => ar.name));
          const configuredRolesNotInAllRoles = [...configuredRoles.values()]
            .filter((cr) => !allLoginRoleNames.has(cr.name))
            .map((configuredRole) => ({
              name: configuredRole.name,
              configuredRole,
            }));
          return [...allRoles, ...configuredRolesNotInAllRoles];
        }
        if ($configuredRoles.isStable && configuredRoles) {
          return [...configuredRoles.values()].map((configuredRole) => ({
            name: configuredRole.name,
            configuredRole,
          }));
        }
        return [];
      },
    );
    this.collaborators = this.database.constructCollaboratorsStore();
    this.users = new AsyncStore(getUsersPromise);
  }

  async configureRole(combinedLoginRole: CombinedLoginRole, password: string) {
    if (combinedLoginRole.configuredRole) {
      return combinedLoginRole.configuredRole.setPassword(password);
    }

    if (combinedLoginRole.role) {
      const configuredRole = await combinedLoginRole.role.configure(password);
      this.configuredRoles.updateResolvedValue((configuredRoles) =>
        configuredRoles.with(configuredRole.id, configuredRole),
      );
    }

    return undefined;
  }

  async removeConfiguredRole(configuredRole: ConfiguredRole) {
    await configuredRole.delete();
    this.configuredRoles.updateResolvedValue((configuredRoles) =>
      configuredRoles.without(configuredRole.id),
    );
    /**
     * When a configured role is removed from the Role Configuration page,
     * Collaborators list needs to be reset, since the drop statement cascades.
     *
     * TODO: Discuss on whether we should cascade or throw error?
     */
    this.collaborators.reset();
  }

  async addCollaborator(
    userId: User['id'],
    configuredRoleId: ConfiguredRole['id'],
  ) {
    const newCollaborator = await this.database.addCollaborator(
      userId,
      configuredRoleId,
    );
    this.collaborators.updateResolvedValue((collaborators) =>
      collaborators.with(newCollaborator.id, newCollaborator),
    );
    return newCollaborator;
  }

  async deleteCollaborator(collaborator: Collaborator) {
    await collaborator.delete();
    this.collaborators.updateResolvedValue((c) => c.without(collaborator.id));
  }

  static construct(databaseRouteContext: DatabaseRouteContext) {
    return setRouteContext(
      contextKey,
      new DatabaseSettingsRouteContext(databaseRouteContext),
    );
  }

  static get() {
    return getRouteContext<DatabaseSettingsRouteContext>(contextKey);
  }
}
