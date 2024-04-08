import { some } from 'iter-tools';
import { derived, get, writable, type Readable } from 'svelte/store';

import {
  ImmutableMap,
  WritableMap,
  defined,
} from '@mathesar-component-library';
import connectionsApi, {
  type Connection,
  type CreateFromKnownConnectionProps,
  type CreateFromScratchProps,
  type CreateWithNewUserProps,
  type UpdatableConnectionProperties,
} from '@mathesar/api/rest/connections';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import type { MakeWritablePropertiesReadable } from '@mathesar/utils/typeUtils';

const commonData = preloadCommonData();

function sortConnections(c: Iterable<Connection>): Connection[] {
  return [...c].sort((a, b) => a.nickname.localeCompare(b.nickname));
}

/**
 * @returns true if the given connection is the only one that points to the same
 * database among all the supplied connections. Connections with the same ids
 * will not be compared.
 */
export function connectionHasUniqueDatabaseReference(
  connection: Connection,
  allConnections: Iterable<Connection>,
): boolean {
  return !some(
    (c) =>
      c.id !== connection.id &&
      c.host === connection.host &&
      c.port === connection.port &&
      c.database === connection.database,
    allConnections,
  );
}

class ConnectionsStore {
  private readonly unsortedConnections = new WritableMap<
    Connection['id'],
    Connection
  >();

  readonly connections: Readable<ImmutableMap<Connection['id'], Connection>>;

  readonly currentConnectionId = writable<Connection['id'] | undefined>();

  readonly currentConnection: Readable<Connection | undefined>;

  constructor() {
    this.unsortedConnections.reconstruct(
      commonData.connections.map((c) => [c.id, c]),
    );
    this.connections = derived(
      this.unsortedConnections,
      (uc) =>
        new ImmutableMap(sortConnections(uc.values()).map((c) => [c.id, c])),
    );
    this.currentConnectionId.set(commonData.current_connection ?? undefined);
    this.currentConnection = derived(
      [this.connections, this.currentConnectionId],
      ([connections, id]) => defined(id, (v) => connections.get(v)),
    );
  }

  private addConnection(connection: Connection) {
    this.unsortedConnections.set(connection.id, connection);
  }

  async createFromKnownConnection(props: CreateFromKnownConnectionProps) {
    const connection = await connectionsApi.createFromKnownConnection(props);
    this.addConnection(connection);
    return connection;
  }

  async createFromScratch(props: CreateFromScratchProps) {
    const connection = await connectionsApi.createFromScratch(props);
    this.addConnection(connection);
    return connection;
  }

  async createWithNewUser(props: CreateWithNewUserProps) {
    const connection = await connectionsApi.createWithNewUser(props);
    this.addConnection(connection);
    return connection;
  }

  setCurrentConnectionId(connectionId: Connection['id']) {
    this.currentConnectionId.set(connectionId);
  }

  clearCurrentConnectionId() {
    this.currentConnectionId.set(undefined);
  }

  async updateConnection(
    id: Connection['id'],
    properties: Partial<UpdatableConnectionProperties>,
  ): Promise<Connection> {
    const connection = await connectionsApi.update(id, properties);
    this.unsortedConnections.set(id, connection);
    return connection;
  }

  async deleteConnection(id: Connection['id'], deleteMathesarSchemas = false) {
    const connections = get(this.connections);
    const connection = connections.get(id);
    if (!connection) return;
    const databaseIsUnique = connectionHasUniqueDatabaseReference(
      connection,
      connections.values(),
    );
    await connectionsApi.delete(id, deleteMathesarSchemas && databaseIsUnique);
    this.unsortedConnections.delete(id);
  }
}

export const connectionsStore: MakeWritablePropertiesReadable<ConnectionsStore> =
  new ConnectionsStore();

/** @deprecated Use connectionsStore.currentConnection instead */
export const currentDatabase = connectionsStore.currentConnection;
