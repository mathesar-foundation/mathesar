import type { CancellablePromise } from '@mathesar/component-library';

import type { RawServer } from './apiTypes';
import type { ConfiguredRole } from './ConfiguredRole';
import type { Database } from './Database';

export class Server {
  id: number;

  host: string;

  port: string;

  constructor(rawServer: RawServer) {
    this.id = rawServer.id;
    this.host = rawServer.host;
    this.port = rawServer.port;
  }

  requestDatabases(): CancellablePromise<Database[]> {
    throw new Error('Not implemented');
  }

  requestConfiguredRoles(): CancellablePromise<ConfiguredRole[]> {
    throw new Error('Not implemented');
  }
}
