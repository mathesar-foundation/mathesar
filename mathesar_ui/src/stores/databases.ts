import { map } from 'iter-tools';
import { type Readable, derived, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawDatabase } from '@mathesar/api/rpc/databases';
import type { RawServer } from '@mathesar/api/rpc/servers';
import { Database } from '@mathesar/models/Database';
import { Server } from '@mathesar/models/Server';
import { batchRun } from '@mathesar/packages/json-rpc-client-builder';
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

function* generateDatabaseEntries(
  rawServers: Iterable<RawServer>,
  rawDatabases: Iterable<RawDatabase>,
): Iterable<[number, Database]> {
  const serverMap = new Map(
    map((s) => [s.id, new Server({ rawServer: s })], rawServers),
  );
  for (const rawDatabase of rawDatabases) {
    const server =
      serverMap.get(rawDatabase.server_id) ??
      Server.dummy(rawDatabase.server_id);
    const database = new Database({ rawDatabase, server });
    yield [database.id, database];
  }
}

class DatabasesStore {
  private readonly unsortedDatabases = new WritableMap<
    Database['id'],
    Database
  >();

  readonly databases: Readable<ImmutableMap<Database['id'], Database>>;

  private readonly currentDatabaseId = writable<Database['id'] | undefined>();

  readonly currentDatabase: Readable<Database | undefined>;

  constructor(
    databases: Iterable<[number, Database]>,
    currentDatabaseId: number | null | undefined,
  ) {
    this.unsortedDatabases.reconstruct(databases);
    this.databases = derived(
      this.unsortedDatabases,
      (ud) =>
        new ImmutableMap(sortDatabases(ud.values()).map((d) => [d.id, d])),
    );
    this.currentDatabaseId.set(currentDatabaseId ?? undefined);
    this.currentDatabase = derived(
      [this.databases, this.currentDatabaseId],
      ([d, id]) => defined(id, (v) => d.get(v)),
    );
  }

  private addDatabase(database: Database) {
    this.unsortedDatabases.set(database.id, database);
  }

  async connectExistingDatabase(
    props: Parameters<typeof api.databases.setup.connect_existing>[0],
  ) {
    const { database, server } = await api.databases.setup
      .connect_existing(props)
      .run();
    const connectedDatabase = new Database({
      rawDatabase: database,
      server: new Server({ rawServer: server }),
    });
    this.addDatabase(connectedDatabase);
    return connectedDatabase;
  }

  async createNewDatabase(
    props: Parameters<typeof api.databases.setup.create_new>[0],
  ) {
    const { database, server } = await api.databases.setup
      .create_new(props)
      .run();
    const connectedDatabase = new Database({
      rawDatabase: database,
      server: new Server({ rawServer: server }),
    });
    this.addDatabase(connectedDatabase);
    return connectedDatabase;
  }

  async disconnectDatabase(database: Database) {
    await api.databases.configured
      .disconnect({
        database_id: database.id,
      })
      .run();
    this.unsortedDatabases.delete(database.id);
  }

  async refresh() {
    const [rawServers, rawDatabases] = await batchRun([
      api.servers.configured.list(),
      api.databases.configured.list({}),
    ]);
    const databases = generateDatabaseEntries(rawServers, rawDatabases);
    this.unsortedDatabases.reconstruct(databases);
  }

  setCurrentDatabaseId(databaseId: Database['id']) {
    this.currentDatabaseId.set(databaseId);
  }

  clearCurrentDatabaseId() {
    this.currentDatabaseId.set(undefined);
  }
}

export const databasesStore: MakeWritablePropertiesReadable<DatabasesStore> =
  new DatabasesStore(
    generateDatabaseEntries(commonData.servers, commonData.databases),
    commonData.current_database,
  );

/** ⚠️ This readable store contains a type assertion designed to sacrifice type
 * safety for the benefit of convenience.
 *
 * We need to access `currentDatabase` like EVERYWHERE throughout the app, and
 * we'd like to avoid checking if it's defined every time. So we assert that it
 * is defined, and we'll just have to be careful to **never use the value from
 * this store within a context where no database is set.**
 */
export const currentDatabase =
  databasesStore.currentDatabase as Readable<Database>;
