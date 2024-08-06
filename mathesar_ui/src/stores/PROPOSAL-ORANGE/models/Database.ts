import { type Writable, writable } from 'svelte/store';

import type { CancellablePromise } from '@mathesar/component-library';

import type { RawDatabase } from './apiTypes';
import type { Role } from './Role';
import type { Schema } from './Schema';
import type { Server } from './Server';

export class Database {
  id: number;

  name: Writable<string>;

  server: Server;

  constructor(props: { server: Server; rawDatabase: RawDatabase }) {
    this.id = props.rawDatabase.id;
    this.name = writable(props.rawDatabase.name);
    this.server = props.server;
  }

  setName(name: string) {
    // request api.database.patch
    this.name.set(name);
  }

  // Patching multiple objects
  patch(props: unknown) {
    // patch database
    // set properties
  }

  // @throws
  requestSchemas(): CancellablePromise<Schema[]> {
    // request api.schema.list
    // resolve with Schema model object
    throw new Error('Not implemented');
  }

  // Even though they technically belong under a PostgreSQL server, they do not
  // belong under a django "Server" object. Role is not a Django object.
  // Roles require a database id inorder to be queried.
  requestRoles(): CancellablePromise<Role[]> {
    throw new Error('Not implemented');
  }
}
