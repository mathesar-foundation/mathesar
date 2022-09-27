import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';

import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { States } from '@mathesar/utils/api';
import type { ColumnsData } from './columns';
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
    this.columnsDataStore = new ColumnsDataStore(this.id);
    this.constraintsDataStore = new ConstraintsDataStore(this.id);
    this.processedColumns = derived(
      [this.columnsDataStore, this.constraintsDataStore],
      ([columnsData, constraintsData]) =>
        new Map(
          columnsData.columns.map((column) => [
            column.id,
            processColumn({
              column,
              constraints: constraintsData.constraints,
              abstractTypeMap: props.abstractTypesMap,
            }),
          ]),
        ),
    );
    this.isLoading = derived(
      [this.columnsDataStore, this.constraintsDataStore],
      ([columnsData, constraintsData]) =>
        columnsData.state === States.Loading ||
        constraintsData.state === States.Loading,
    );
  }

  refresh(): Promise<[ColumnsData | undefined, ConstraintsData | undefined]> {
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
