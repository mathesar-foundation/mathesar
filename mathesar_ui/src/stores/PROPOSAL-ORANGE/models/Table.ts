import { type Writable, writable } from 'svelte/store';

import type { CancellablePromise } from '@mathesar/component-library';

import type { RawTable } from './apiTypes';
import type { Schema } from './Schema';

export class Table {
  oid: number;

  name: Writable<string>;

  description: Writable<string | null>;

  schema: Schema;

  constructor(props: { schema: Schema; rawTable: RawTable }) {
    this.oid = props.rawTable.oid;
    this.name = writable(props.rawTable.name);
    this.description = writable(props.rawTable.description);
    this.schema = props.schema;
  }

  requestColumns(): CancellablePromise<unknown[]> {
    throw new Error('Not implemented');
  }
}
