import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Server } from './servers';

export interface DatabaseResponse {
  id: number;
  name: string;
  server_id: Server['id'];
}

/**
 * TODO_BETA: Modify after store discussion is resolved
 */
export class Database implements DatabaseResponse {
  readonly id: number;

  readonly name: string;

  readonly server_id: number;

  readonly server_host: string;

  readonly server_port: number;

  constructor(databaseResponse: DatabaseResponse, server: Server) {
    this.id = databaseResponse.id;
    this.name = databaseResponse.name;
    if (databaseResponse.server_id !== server.id) {
      throw new Error('Server ids do not match');
    }
    this.server_id = databaseResponse.server_id;
    this.server_host = server.host;
    this.server_port = server.port;
  }
}

export const databases = {
  list: rpcMethodTypeContainer<
    {
      server_id?: DatabaseResponse['server_id'];
    },
    Array<DatabaseResponse>
  >(),
};
