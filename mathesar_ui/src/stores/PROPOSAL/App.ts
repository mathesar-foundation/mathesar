import { type Readable, derived } from 'svelte/store';

import {
  ImmutableMap,
  WritableMap,
  collapse,
  unite,
} from '@mathesar/component-library';

import type { TODO } from './apiTypes';
import type { Database } from './Database';
import type { Server } from './Server';

function buildDatabases(
  servers: Readable<ImmutableMap<Server['id'], Server>>,
): Readable<ImmutableMap<Database['id'], Database>> {
  const unsortedDatabases = collapse(
    derived(servers, ($servers) =>
      unite(
        [...$servers].map(([, server]) =>
          derived(server.databases.derivedValues(), (d) => [...d]),
        ),
      ),
    ),
  );
  const sortedDatabases = derived(unsortedDatabases, (d) =>
    d.flat().sort((a, b) => a.name.localeCompare(b.name)),
  );
  return derived(
    sortedDatabases,
    (d) => new ImmutableMap(d.map((database) => [database.id, database])),
  );
}

export class App {
  servers: WritableMap<Server['id'], Server>;

  /** All the databases across all servers on the app, sorted alphabetically. */
  databases: Readable<ImmutableMap<Database['id'], Database>>;

  users: TODO;

  constructor() {
    this.servers = new WritableMap();
    this.databases = buildDatabases(this.servers);
  }

  async addDatabase(): Promise<void> {
    // TODO
    //
    // After fetching data from the API, this would:
    //
    // 1. Instantiate a new `Server` if necessary.
    // 1. Instantiate a new `Database` within the sever.
  }
}
