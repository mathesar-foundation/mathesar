import { WritableMap } from '@mathesar/component-library';

import AsyncStore from '../../AsyncStore';
import type { PrefetchedData } from '../models/apiTypes';
import type { Schema } from '../models/Schema';
import { Table } from '../models/Table';

export class GlobalSchemaContext {
  schema: Schema;

  // Contains the table modal, not a different context
  tableMap: AsyncStore<void, WritableMap<Table['oid'], Table>>;

  constructor(schema: Schema, prefetchedData?: PrefetchedData) {
    this.schema = schema;

    let initialTables: Table[] = [];
    if (
      this.schema.database.id === prefetchedData?.current_db_id &&
      this.schema.oid === prefetchedData?.current_schema_oid
    ) {
      initialTables = prefetchedData.current_schema_tables.map(
        (rawTable) => new Table({ schema, rawTable }),
      );
    }

    this.tableMap = new AsyncStore(
      // eslint-disable-next-line arrow-body-style
      async () => {
        // provide runner(api.tables.list)
        return new WritableMap<Table['oid'], Table>();
      },
      () => 'error',
      new WritableMap(initialTables.map((table) => [table.oid, table])),
    );
  }

  updateSchema() {
    //
  }

  addTable() {
    //
  }

  deleteTable() {
    //
  }
}
