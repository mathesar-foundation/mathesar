import type { RawDatabase } from '@mathesar/api/rpc/databases';

import type { Server } from './servers';

export class Database {
  readonly id: number;

  name: string;

  readonly server: Server;

  constructor(props: { server: Server; rawDatabase: RawDatabase }) {
    this.id = props.rawDatabase.id;
    this.name = props.rawDatabase.name;
    if (props.rawDatabase.server_id !== props.server.id) {
      throw new Error('Server ids do not match');
    }
    this.server = props.server;
  }
}
