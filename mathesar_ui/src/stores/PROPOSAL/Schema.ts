import { type Readable, type Writable, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { ImmutableMap } from '@mathesar/component-library';

import AsyncStore, { type AsyncStoreValue } from '../AsyncStore';

import type { RawSchema, RawTable } from './apiTypes';
import type { Database } from './Database';
import type { Table } from './Table';

function buildTables(
  tablesListStore: Readable<AsyncStoreValue<RawTable[], string>>,
  schema: Schema,
): Readable<ImmutableMap<Table['oid'], Table>> {
  throw new Error('Not implemented'); // (follow patterns in buildSchemas)
}

export class Schema {
  /** A static back-reference to the database containing this schema */
  database: Database;

  oid: number;

  name: Writable<string>;

  description: Writable<string | null>;

  tablesList: AsyncStore<void, RawTable[]>;

  tables: Readable<ImmutableMap<Table['oid'], Table>>;

  constructor(p: { database: Database; rawSchema: RawSchema }) {
    this.database = p.database;
    this.oid = p.rawSchema.oid;
    this.name = writable(p.rawSchema.name);
    this.description = writable(p.rawSchema.description);
    this.tablesList = new AsyncStore(() =>
      api.tables
        .list_with_metadata({
          database_id: this.database.id,
          schema_oid: this.oid,
        })
        .run(),
    );
    this.tables = buildTables(this.tablesList, this);
  }

  get url(): string {
    return `${this.database.url}${this.oid}/`;
  }

  patch(rawSchema: RawSchema): Promise<void> {
    throw new Error('Not implemented');
  }

  delete(): Promise<void> {
    throw new Error('Not implemented');
  }

  createTable(/* ... */): Promise<void> {
    throw new Error('Not implemented');
  }
}
