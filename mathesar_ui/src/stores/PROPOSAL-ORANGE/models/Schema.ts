import { type Writable, writable } from 'svelte/store';

import type { CancellablePromise } from '@mathesar/component-library';

import type { RawSchema } from './apiTypes';
import type { Database } from './Database';
import type { Table } from './Table';

export class Schema {
  oid: number;

  name: Writable<string>;

  database: Database;

  constructor(props: { database: Database; rawSchema: RawSchema }) {
    this.oid = props.rawSchema.oid;
    this.name = writable(props.rawSchema.name);
    this.database = props.database;
  }

  requestTables(): CancellablePromise<Table[]> {
    throw new Error('Not implemented');
  }
}
