import { api } from '@mathesar/api/rpc';
import type { RawDatabase } from '@mathesar/api/rpc/databases';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import {
  CancellablePromise,
  ImmutableMap,
  SortedImmutableMap,
} from '@mathesar-component-library';

import { Collaborator } from './Collaborator';
import { ConfiguredRole } from './ConfiguredRole';
import { Role } from './Role';
import type { Server } from './Server';
import { UnderlyingDatabase } from './UnderlyingDatabase';

export class Database {
  readonly id: number;

  readonly name: string;

  readonly server: Server;

  constructor(props: { server: Server; rawDatabase: RawDatabase }) {
    this.id = props.rawDatabase.id;
    this.name = props.rawDatabase.name;
    this.server = props.server;
  }

  constructConfiguredRolesStore() {
    return new AsyncRpcApiStore(api.roles.configured.list, {
      postProcess: (rawConfiguredRoles) =>
        new SortedImmutableMap(
          (v) => [...v].sort(([, a], [, b]) => a.name.localeCompare(b.name)),
          rawConfiguredRoles.map((rawConfiguredRole) => [
            rawConfiguredRole.id,
            new ConfiguredRole({ database: this, rawConfiguredRole }),
          ]),
        ),
    });
  }

  constructRolesStore() {
    return new AsyncRpcApiStore(api.roles.list, {
      postProcess: (rawRoles) =>
        new SortedImmutableMap(
          (v) => [...v].sort(([, a], [, b]) => a.name.localeCompare(b.name)),
          rawRoles.map((rawRole) => [
            rawRole.oid,
            new Role({ database: this, rawRole }),
          ]),
        ),
    });
  }

  constructCollaboratorsStore() {
    return new AsyncRpcApiStore(api.collaborators.list, {
      postProcess: (rawCollaborators) =>
        new ImmutableMap(
          rawCollaborators.map((rawCollaborator) => [
            rawCollaborator.id,
            new Collaborator({ database: this, rawCollaborator }),
          ]),
        ),
    });
  }

  constructDatabasePrivilegesStore() {
    return new AsyncRpcApiStore(api.databases.privileges.list_direct, {
      postProcess: (rawDbPrivilegesForRoles) =>
        new ImmutableMap(
          rawDbPrivilegesForRoles.map((rawDatabasePrivilegesForRole) => [
            rawDatabasePrivilegesForRole.role_oid,
            rawDatabasePrivilegesForRole,
          ]),
        ),
    });
  }

  constructUnderlyingDatabaseStore() {
    return new AsyncRpcApiStore(api.databases.get, {
      postProcess: (rawUnderlyingDatabase) =>
        new UnderlyingDatabase({
          database: this,
          rawUnderlyingDatabase,
        }),
    });
  }

  constructCurrentRoleStore() {
    return new AsyncRpcApiStore(api.roles.get_current_role, {
      postProcess: (currentRole) => ({
        currentRoleOid: currentRole.current_role.oid,
        parentRoleOids: currentRole.parent_roles.map((pr) => pr.oid),
      }),
    });
  }

  addCollaborator(
    userId: number,
    configuredRoleId: ConfiguredRole['id'],
  ): CancellablePromise<Collaborator> {
    const promise = api.collaborators
      .add({
        database_id: this.id,
        user_id: userId,
        configured_role_id: configuredRoleId,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then(
            (rawCollaborator) =>
              resolve(
                new Collaborator({
                  database: this,
                  rawCollaborator,
                }),
              ),
            reject,
          )
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  addRole(
    roleName: string,
    login: boolean,
    password?: string,
  ): CancellablePromise<Role> {
    const promise = api.roles
      .add({
        database_id: this.id,
        rolename: roleName,
        login,
        password,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then(
            (rawRole) =>
              resolve(
                new Role({
                  database: this,
                  rawRole,
                }),
              ),
            reject,
          )
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }
}
