import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';

import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { States } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';
import { ColumnsDataStore } from './columns';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';
import type { ProcessedColumnsStore } from './processedColumns';
import { processColumn } from './processedColumns';

export interface TableStructureProps {
  id: DBObjectEntry['id'];
  abstractTypesMap: AbstractTypesMap;
}

export class TableStructure {
  id: DBObjectEntry['id'];

  columnsDataStore: ColumnsDataStore;

  constraintsDataStore: ConstraintsDataStore;

  processedColumns: ProcessedColumnsStore;

  isLoading: Readable<boolean>;

  constructor(props: TableStructureProps) {
    this.id = props.id;
    this.columnsDataStore = new ColumnsDataStore({ parentId: this.id });
    this.constraintsDataStore = new ConstraintsDataStore(this.id);
    this.processedColumns = derived(
      [this.columnsDataStore.columns, this.constraintsDataStore],
      ([columns, constraintsData]) =>
        new Map(
          columns.map((column) => [
            column.id,
            processColumn({
              tableId: this.id,
              column,
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
