import { api } from '@mathesar/api/rpc';
import type { RawDatabase } from '@mathesar/api/rpc/databases';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { ImmutableMap, SortedImmutableMap } from '@mathesar-component-library';

import { Collaborator } from './Collaborator';
import { ConfiguredRole } from './ConfiguredRole';
import { Role } from './Role';
import type { Server } from './Server';

export class Database {
  readonly id: number;

  readonly name: string;

  readonly server: Server;

  constructor(props: { server: Server; rawDatabase: RawDatabase }) {
    this.id = props.rawDatabase.id;
    this.name = props.rawDatabase.name;
    this.server = props.server;
  }

  fetchConfiguredRoles() {
    return new AsyncRpcApiStore(api.configured_roles.list, {
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

  fetchRoles() {
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

  fetchCollaborators() {
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
}
