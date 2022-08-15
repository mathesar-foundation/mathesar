import { getContext, setContext } from 'svelte';
import type { Readable, Writable } from 'svelte/store';
import { derived } from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { States } from '@mathesar/utils/api';
import { Meta } from './meta';
import type { ColumnsData } from './columns';
import { ColumnsDataStore } from './columns';
import type { TableRecordsData } from './records';
import { RecordsData } from './records';
import { Display } from './display';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';
import type { ProcessedColumnsStore } from './processedColumns';
import { processColumn } from './processedColumns';

export interface TabularDataProps {
  id: DBObjectEntry['id'];
  abstractTypesMap: AbstractTypesMap;
  meta?: Meta;
}

export class TabularData {
  id: DBObjectEntry['id'];

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  processedColumns: ProcessedColumnsStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  isLoading: Readable<boolean>;

  constructor(props: TabularDataProps) {
    this.id = props.id;
    this.meta = props.meta ?? new Meta();
    this.columnsDataStore = new ColumnsDataStore(this.id);
    this.constraintsDataStore = new ConstraintsDataStore(this.id);
    this.recordsData = new RecordsData(
      this.id,
      this.meta,
      this.columnsDataStore,
    );
    this.display = new Display(
      this.meta,
      this.columnsDataStore,
      this.recordsData,
    );

    this.processedColumns = derived(
      [this.columnsDataStore, this.constraintsDataStore],
      ([columnsData, constraintsData]) =>
        new Map(
          columnsData.columns.map((column) => [
            column.id,
            processColumn(
              column,
              constraintsData.constraints,
              props.abstractTypesMap,
            ),
          ]),
        ),
    );

    this.isLoading = derived(
      [
        this.columnsDataStore,
        this.constraintsDataStore,
        this.recordsData.state,
      ],
      ([columnsData, constraintsData, recordsDataState]) =>
        columnsData.state === States.Loading ||
        constraintsData.state === States.Loading ||
        recordsDataState === States.Loading,
    );

    this.columnsDataStore.on('columnRenamed', async () => {
      await this.refresh();
    });
    this.columnsDataStore.on('columnAdded', async () => {
      await this.recordsData.fetch();
    });
    this.columnsDataStore.on('columnDeleted', async (columnId) => {
      this.meta.sorting.update((s) => s.without(columnId));
      this.meta.grouping.update((g) => g.without(columnId));
      this.meta.filtering.update((f) => f.withoutColumn(columnId));
    });
    this.columnsDataStore.on('columnPatched', async () => {
      await this.recordsData.fetch();
    });
  }

  refresh(): Promise<
    [
      ColumnsData | undefined,
      TableRecordsData | undefined,
      ConstraintsData | undefined,
    ]
  > {
    return Promise.all([
      this.columnsDataStore.fetch(),
      this.recordsData.fetch(),
      this.constraintsDataStore.fetch(),
    ]);
  }

  destroy(): void {
    this.recordsData.destroy();
    this.constraintsDataStore.destroy();
    this.columnsDataStore.destroy();
  }
}

const tabularDataStoreContextKey = {};

export function setTabularDataStoreInContext(s: Writable<TabularData>): void {
  setContext(tabularDataStoreContextKey, s);
}

export function getTabularDataStoreFromContext(): Writable<TabularData> {
  return getContext(tabularDataStoreContextKey);
}
