import { WritableMap } from '@mathesar-component-library';

import AsyncStore from '../../AsyncStore';
import type { PrefetchedData } from '../models/apiTypes';
import type { Database } from '../models/Database';
import { Schema } from '../models/Schema';

import { GlobalSchemaContext } from './GlobalSchemaContext';

export class GlobalDatabaseContext {
  database: Database;

  schemaContextMap: AsyncStore<
    void,
    WritableMap<GlobalSchemaContext['schema']['oid'], GlobalSchemaContext>
  >;

  constructor(database: Database, prefetchedData?: PrefetchedData) {
    this.database = database;

    let initialSchemaContexts: GlobalSchemaContext[] = [];
    if (this.database.id === prefetchedData?.current_db_id) {
      initialSchemaContexts = prefetchedData.current_db_schemas.map(
        (rawSchema) =>
          new GlobalSchemaContext(
            new Schema({
              database,
              rawSchema,
            }),
            prefetchedData,
          ),
      );
    }

    this.schemaContextMap = new AsyncStore(
      async () => {
        const schemas = await database.requestSchemas();
        return new WritableMap(
          schemas.map((schema) => [
            schema.oid,
            new GlobalSchemaContext(schema),
          ]),
        );
      },
      () => 'error',
      new WritableMap(
        initialSchemaContexts.map((context) => [context.schema.oid, context]),
      ),
    );
  }

  async fetchSchemas() {
    await this.schemaContextMap.runIfNotSettled();
  }

  addSchema() {
    // TODO: Implement
  }

  deleteSchema() {
    // TODO: Implement
  }
}
