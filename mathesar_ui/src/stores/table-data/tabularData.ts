import { getContext, setContext } from 'svelte';
import {
  derived,
  writable,
  get,
  type Readable,
  type Writable,
} from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { States } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';
import { SheetSelection } from '@mathesar/components/sheet';
import { Meta } from './meta';
import { ColumnsDataStore } from './columns';
import type { RecordRow, TableRecordsData } from './records';
import { RecordsData } from './records';
import { Display } from './display';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';
import type {
  ProcessedColumn,
  ProcessedColumnsStore,
} from './processedColumns';
import { processColumn } from './processedColumns';

export interface TabularDataProps {
  id: DBObjectEntry['id'];
  abstractTypesMap: AbstractTypesMap;
  meta?: Meta;
  /**
   * Keys are columns ids. Values are cell values.
   *
   * Setting an entry in this Map will apply a filter condition which the user
   * cannot see or remove. And the column used for the filter condition will be
   * removed from view.
   */
  contextualFilters?: Map<number, number | string>;
  hasEnhancedPrimaryKeyCell?: Parameters<
    typeof processColumn
  >[0]['hasEnhancedPrimaryKeyCell'];
}

export type TabularDataSelection = SheetSelection<RecordRow, ProcessedColumn>;

export class TabularData {
  id: DBObjectEntry['id'];

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  processedColumns: ProcessedColumnsStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  isLoading: Readable<boolean>;

  selection: TabularDataSelection;

  constructor(props: TabularDataProps) {
    const contextualFilters =
      props.contextualFilters ?? new Map<number, string | number>();
    this.id = props.id;
    this.meta = props.meta ?? new Meta();
    this.columnsDataStore = new ColumnsDataStore({
      parentId: this.id,
      hiddenColumns: contextualFilters.keys(),
    });
    this.constraintsDataStore = new ConstraintsDataStore(this.id);
    this.recordsData = new RecordsData(
      this.id,
      this.meta,
      this.columnsDataStore,
      contextualFilters,
    );
    this.display = new Display(
      this.meta,
      this.columnsDataStore,
      this.recordsData,
    );

    this.processedColumns = derived(
      [this.columnsDataStore.columns, this.constraintsDataStore],
      ([columns, constraintsData]) =>
        new Map(
          columns.map((column, columnIndex) => [
            column.id,
            processColumn({
              tableId: this.id,
              column,
              columnIndex,
              constraints: constraintsData.constraints,
              abstractTypeMap: props.abstractTypesMap,
              hasEnhancedPrimaryKeyCell: props.hasEnhancedPrimaryKeyCell,
            }),
          ]),
        ),
    );

    this.selection = new SheetSelection({
      getColumns: () => [...get(this.processedColumns).values()],
      getRows: () => this.recordsData.getRecordRows(),
      getMaxSelectionRowIndex: () => {
        const totalCount = get(this.recordsData.totalCount) ?? 0;
        const savedRecords = get(this.recordsData.savedRecords);
        const newRecords = get(this.recordsData.newRecords);
        const pagination = get(this.meta.pagination);
        const { offset } = pagination;
        const pageSize = pagination.size;
        /**
         * We are not subtracting 1 from the below maxRowIndex calculation
         * inorder to account for the add-new-record placeholder row
         */
        return (
          Math.min(pageSize, totalCount - offset, savedRecords.length) +
          newRecords.length
        );
      },
    });

    this.isLoading = derived(
      [
        this.columnsDataStore.fetchStatus,
        this.constraintsDataStore,
        this.recordsData.state,
      ],
      ([columnsStatus, constraintsData, recordsDataState]) =>
        columnsStatus?.state === 'processing' ||
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
      this.meta.grouping.update((g) => g.withoutColumn(columnId));
      this.meta.filtering.update((f) => f.withoutColumn(columnId));
      this.constraintsDataStore.fetch();
    });
    this.columnsDataStore.on('columnPatched', async () => {
      await this.recordsData.fetch();
    });
  }

  refresh(): Promise<
    [
      Column[] | undefined,
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
    this.selection.destroy();
  }
}

const tabularDataStoreContextKey = {};

export function setTabularDataStoreInContext(
  t: TabularData,
): Writable<TabularData> {
  const store = writable(t);
  setContext(tabularDataStoreContextKey, store);
  return store;
}

export function getTabularDataStoreFromContext(): Writable<TabularData> {
  return getContext(tabularDataStoreContextKey);
}
