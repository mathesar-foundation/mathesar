import { get } from 'svelte/store';

import { WritableMap } from '@mathesar-component-library';

import AsyncStore from '../../AsyncStore';
import type { PrefetchedData } from '../models/apiTypes';
import { Database } from '../models/Database';
import { Server } from '../models/Server';

import { GlobalDatabaseContext } from './GlobalDatabaseContext';

function buildDatabase(): Database {
  throw new Error('Not implemented');
}

export class AppContext {
  databaseContextMap: AsyncStore<
    void,
    WritableMap<GlobalDatabaseContext['database']['id'], GlobalDatabaseContext>
  >;

  user!: unknown;

  installation_release!: string;

  supported_languages!: Record<string, string>;

  constructor(prefetchedData: PrefetchedData) {
    const serverMap = new Map(
      prefetchedData.servers.map((rawServer) => [
        rawServer.id,
        new Server(rawServer),
      ]),
    );
    const initialDatabaseContexts = prefetchedData.databases.map(
      (rawDatabase) => {
        const server = serverMap.get(rawDatabase.server_id);
        if (!server) {
          throw new Error('server not found');
        }
        return new GlobalDatabaseContext(
          new Database({ server, rawDatabase }),
          prefetchedData,
        );
      },
    );

    this.databaseContextMap = new AsyncStore(
      // eslint-disable-next-line arrow-body-style
      async () => {
        // runner(api.databases.list)
        return new WritableMap<
          GlobalDatabaseContext['database']['id'],
          GlobalDatabaseContext
        >();
      },
      () => 'error',
      new WritableMap(
        initialDatabaseContexts.map((context) => [
          context.database.id,
          context,
        ]),
      ),
    );
  }

  fetchDatabases() {
    return this.databaseContextMap.runIfNotSettled();
  }

  refetchDatabases() {
    return this.databaseContextMap.run();
  }

  async addDatabase(_databaseFormProps: unknown) {
    // Send request
    const db = buildDatabase();
    const dbContextMap = get(this.databaseContextMap);
    if (dbContextMap.isOk) {
      dbContextMap.resolvedValue?.set(db.id, new GlobalDatabaseContext(db));
      return;
    }
    await this.refetchDatabases();
  }
}
