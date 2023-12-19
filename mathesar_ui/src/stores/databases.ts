/* eslint-disable max-classes-per-file */

import {
  writable,
  derived,
  type Writable,
  type Readable,
  get,
} from 'svelte/store';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import connectionsApi, {
  type Connection,
  type UpdatableConnectionProperties,
} from '@mathesar/api/connections';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import type { MakeWritablePropertiesReadable } from '@mathesar/utils/typeUtils';

const commonData = preloadCommonData();

class ConnectionModel {
  readonly id: Connection['id'];

  readonly nickname: Connection['nickname'];

  readonly database: Connection['database'];

  readonly username: Connection['username'];

  readonly host: Connection['host'];

  readonly port: Connection['port'];

  constructor(connectionDetails: Connection) {
    this.id = connectionDetails.id;
    this.nickname = connectionDetails.nickname;
    this.database = connectionDetails.database;
    this.username = connectionDetails.username;
    this.host = connectionDetails.host;
    this.port = connectionDetails.port;
  }

  getConnectionJson(): Connection {
    return {
      id: this.id,
      nickname: this.nickname,
      database: this.database,
      username: this.username,
      host: this.host,
      port: this.port,
    };
  }

  with(connectionDetails: Partial<Connection>): ConnectionModel {
    return new ConnectionModel({
      ...this.getConnectionJson(),
      ...connectionDetails,
    });
  }
}

class ConnectionsStore {
  readonly requestStatus: Writable<RequestStatus> = writable();

  readonly connections = writable<ConnectionModel[]>([]);

  readonly count = writable(0);

  readonly currentConnectionId = writable<Connection['id'] | undefined>();

  readonly currentConnection: Readable<ConnectionModel | undefined>;

  constructor() {
    this.requestStatus.set({ state: 'success' });
    this.connections.set(
      commonData.connections.map(
        (connection) => new ConnectionModel(connection),
      ) ?? [],
    );
    this.count.set(commonData.connections.length ?? 0);
    this.currentConnectionId.set(commonData.current_connection ?? undefined);
    this.currentConnection = derived(
      [this.connections, this.currentConnectionId],
      ([connections, currentConnectionId]) =>
        connections.find((c) => c.id === currentConnectionId),
    );
  }

  setCurrentConnectionId(connectionId: Connection['id']) {
    this.currentConnectionId.set(connectionId);
  }

  clearCurrentConnectionId() {
    this.currentConnectionId.set(undefined);
  }

  async updateConnection(
    connectionId: Connection['id'],
    properties: Partial<UpdatableConnectionProperties>,
  ): Promise<Connection> {
    const updatedConnection = await connectionsApi.update(
      connectionId,
      properties,
    );
    const newConnectionModel = new ConnectionModel(updatedConnection);
    this.connections.update((connections) =>
      connections.map((connection) => {
        if (connection.id === connectionId) {
          return newConnectionModel;
        }
        return connection;
      }),
    );
    return newConnectionModel;
  }

  async deleteConnection(
    connectionId: Connection['id'],
    deleteMathesarSchemas = false,
  ) {
    const connections = get(this.connections);
    const connectionToDelete = connections.find(
      (conn) => conn.id === connectionId,
    );
    const otherConnectionsUseSameDb = !!connections.find(
      (conn) =>
        conn.id !== connectionId &&
        conn.database === connectionToDelete?.database,
    );
    const mathesarSchemasShouldBeDeleted =
      !otherConnectionsUseSameDb && deleteMathesarSchemas;
    await connectionsApi.delete(connectionId, mathesarSchemasShouldBeDeleted);
    this.connections.update((conns) =>
      conns.filter((conn) => conn.id !== connectionId),
    );
  }
}

export const connectionsStore: MakeWritablePropertiesReadable<ConnectionsStore> =
  new ConnectionsStore();

/** @deprecated Use connectionsStore.currentConnection instead */
export const currentDatabase = connectionsStore.currentConnection;

/* eslint-enable max-classes-per-file */
