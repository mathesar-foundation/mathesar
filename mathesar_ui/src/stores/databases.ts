import { type Readable, derived, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import { Database } from '@mathesar/api/rpc/databases';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import type { MakeWritablePropertiesReadable } from '@mathesar/utils/typeUtils';
import {
  ImmutableMap,
  WritableMap,
  defined,
} from '@mathesar-component-library';

const commonData = preloadCommonData();

function sortDatabases(c: Iterable<Database>): Database[] {
  return [...c].sort((a, b) => a.name.localeCompare(b.name));
}

class DatabasesStore {
  private readonly unsortedDatabases = new WritableMap<
    Database['id'],
    Database
  >();

  readonly databases: Readable<ImmutableMap<Database['id'], Database>>;

  readonly currentDatabaseId = writable<Database['id'] | undefined>();

  readonly currentDatabase: Readable<Database | undefined>;

  constructor() {
    const serverMap = new Map(commonData.servers.map((s) => [s.id, s]));
    this.unsortedDatabases.reconstruct(
      commonData.databases.map((d) => {
        /**
         * We're using a default value for host as 'unknown' when server is undefined
         * instead of throwing an error.
         *
         * 1. We don't expect server to be undefined.
         * 2. This is a runtime operation where the value is based on response from backend,
         *    so we cannot assume server to be defined even though we expect it to be.
         * 3. Displaying server info is not an important feature of the app,
         *    so it's better to fail gracefully than to throw an error and crash the app.
         */
        const server = serverMap.get(d.server_id) ?? {
          id: d.server_id,
          host: 'unknown',
          port: 0,
        };
        return [d.id, new Database(d, server)];
      }),
    );
    this.databases = derived(
      this.unsortedDatabases,
      (ud) =>
        new ImmutableMap(sortDatabases(ud.values()).map((d) => [d.id, d])),
    );
    this.currentDatabaseId.set(commonData.current_database ?? undefined);
    this.currentDatabase = derived(
      [this.databases, this.currentDatabaseId],
      ([databases, id]) => defined(id, (v) => databases.get(v)),
    );
  }

  private addDatabase(database: Database) {
    this.unsortedDatabases.set(database.id, database);
  }

  async connectExistingDatabase(
    props: Parameters<typeof api.database_setup.connect_existing>[0],
  ) {
    const { database, server } = await api.database_setup
      .connect_existing(props)
      .run();
    const connectedDatabase = new Database(database, server);
    this.addDatabase(connectedDatabase);
    return connectedDatabase;
  }

  async createNewDatabase(
    props: Parameters<typeof api.database_setup.create_new>[0],
  ) {
    const { database, server } = await api.database_setup
      .create_new(props)
      .run();
    const connectedDatabase = new Database(database, server);
    this.addDatabase(connectedDatabase);
    return connectedDatabase;
  }

  setCurrentDatabaseId(databaseId: Database['id']) {
    this.currentDatabaseId.set(databaseId);
  }

  clearCurrentDatabaseId() {
    this.currentDatabaseId.set(undefined);
  }
}

export const databasesStore: MakeWritablePropertiesReadable<DatabasesStore> =
  new DatabasesStore();

/**
 * @throws an error when used in a context where no current database exists.
 * This behavior sacrifices some stability for the sake of developer ergonomics.
 * This sacrifice seems acceptable given that such a large part of the
 * application depends on the existence of one and only one database.
 */
export const currentDatabase = derived(databasesStore.currentDatabase, (c) => {
  if (!c) throw new Error('No current database');
  return c;
});
