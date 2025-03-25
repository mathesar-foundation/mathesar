import { type Readable, derived } from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';

import { ColumnsDataStore } from './columns';
import { type ConstraintsData, ConstraintsDataStore } from './constraints';
import {
  ProcessedColumn,
  type ProcessedColumnsStore,
} from './processedColumns';

export interface TableStructureProps {
  database: Pick<Database, 'id'>;
  table: Pick<Table, 'oid'>;
}

export class TableStructure {
  oid: DBObjectEntry['id'];

  columnsDataStore: ColumnsDataStore;

  constraintsDataStore: ConstraintsDataStore;

  processedColumns: ProcessedColumnsStore;

  isLoading: Readable<boolean>;

  constructor(props: TableStructureProps) {
    this.oid = props.table.oid;
    this.columnsDataStore = new ColumnsDataStore(props);
    this.constraintsDataStore = new ConstraintsDataStore(props);
    this.processedColumns = derived(
      [this.columnsDataStore.columns, this.constraintsDataStore],
      ([columns, constraintsData]) =>
        new Map(
          columns.map((column, columnIndex) => [
            column.id,
            new ProcessedColumn({
              tableOid: this.oid,
              column,
              columnIndex,
              constraints: constraintsData.constraints,
            }),
          ]),
        ),
    );
    this.isLoading = derived(
      [this.columnsDataStore.fetchStatus, this.constraintsDataStore],
      ([columnsFetchStatus, constraintsData]) =>
        columnsFetchStatus?.state === 'processing' ||
        constraintsData.state === States.Loading,
    );
  }

  refresh(): Promise<[Column[] | undefined, ConstraintsData | undefined]> {
    // TODO batch these request via RPC batching
    return Promise.all([
      this.columnsDataStore.fetch(),
      this.constraintsDataStore.fetch(),
    ]);
  }

  destroy(): void {
    this.constraintsDataStore.destroy();
    this.columnsDataStore.destroy();
  }
}
