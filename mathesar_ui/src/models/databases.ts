import type { RawDatabase } from '@mathesar/api/rpc/databases';

import type { Server } from './servers';

export class Database {
  readonly id: number;

  readonly name: string;

  readonly server: Server;

  constructor(props: { server: Server; rawDatabase: RawDatabase }) {
    this.id = props.rawDatabase.id;
    this.name = props.rawDatabase.name;
    this.server = props.server;
  }
}
