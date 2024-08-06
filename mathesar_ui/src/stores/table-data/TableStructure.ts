import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
import type { Database } from '@mathesar/api/rpc/databases';
import type { Table } from '@mathesar/api/rpc/tables';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';

import { ColumnsDataStore } from './columns';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';
import type { ProcessedColumnsStore } from './processedColumns';
import { processColumn } from './processedColumns';

export interface TableStructureProps {
  database: Pick<Database, 'id'>;
  table: Pick<Table, 'oid'>;
  abstractTypesMap: AbstractTypesMap;
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
            processColumn({
              tableId: this.oid,
              column,
              columnIndex,
              constraints: constraintsData.constraints,
              abstractTypeMap: props.abstractTypesMap,
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
