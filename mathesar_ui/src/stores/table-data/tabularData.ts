import { getContext, setContext } from 'svelte';
import { type Readable, type Writable, derived, writable } from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
import type { Database } from '@mathesar/api/rpc/databases';
import type { Table } from '@mathesar/api/rpc/tables';
import Plane from '@mathesar/components/sheet/selection/Plane';
import Series from '@mathesar/components/sheet/selection/Series';
import SheetSelectionStore from '@mathesar/components/sheet/selection/SheetSelectionStore';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type { ShareConsumer } from '@mathesar/utils/shares';
import { orderProcessedColumns } from '@mathesar/utils/tables';

import { ColumnsDataStore } from './columns';
import type { ConstraintsData } from './constraints';
import { ConstraintsDataStore } from './constraints';
import { Display } from './display';
import { Meta } from './meta';
import type { ProcessedColumnsStore } from './processedColumns';
import { processColumn } from './processedColumns';
import type { TableRecordsData } from './records';
import { RecordsData } from './records';

export interface TabularDataProps {
  database: Pick<Database, 'id'>;
  table: Table;
  abstractTypesMap: AbstractTypesMap;
  meta?: Meta;
  shareConsumer?: ShareConsumer;
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

export class TabularData {
  table: Table;

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  processedColumns: ProcessedColumnsStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  isLoading: Readable<boolean>;

  selection: SheetSelectionStore;

  shareConsumer?: ShareConsumer;

  constructor(props: TabularDataProps) {
    const contextualFilters =
      props.contextualFilters ?? new Map<number, string | number>();
    this.table = props.table;
    this.meta = props.meta ?? new Meta();
    this.shareConsumer = props.shareConsumer;
    this.columnsDataStore = new ColumnsDataStore({
      database: props.database,
      tableOid: this.table.oid,
      hiddenColumns: contextualFilters.keys(),
      shareConsumer: this.shareConsumer,
    });
    this.constraintsDataStore = new ConstraintsDataStore({
      tableId: this.table.oid,
      shareConsumer: this.shareConsumer,
    });
    this.recordsData = new RecordsData({
      tableId: this.table.oid,
      meta: this.meta,
      columnsDataStore: this.columnsDataStore,
      contextualFilters,
      shareConsumer: this.shareConsumer,
    });
    this.display = new Display(
      this.meta,
      this.columnsDataStore,
      this.recordsData,
    );

    this.table = props.table;

    this.processedColumns = derived(
      [this.columnsDataStore.columns, this.constraintsDataStore],
      ([columns, constraintsData]) =>
        orderProcessedColumns(
          new Map(
            columns.map((column, columnIndex) => [
              column.id,
              processColumn({
                tableId: this.table.oid,
                column,
                columnIndex,
                constraints: constraintsData.constraints,
                abstractTypeMap: props.abstractTypesMap,
                hasEnhancedPrimaryKeyCell: props.hasEnhancedPrimaryKeyCell,
              }),
            ]),
          ),
          this.table,
        ),
    );

    const plane = derived(
      [
        this.recordsData.selectableRowsMap,
        this.processedColumns,
        this.display.placeholderRowId,
      ],
      ([selectableRowsMap, processedColumns, placeholderRowId]) => {
        const rowIds = new Series([...selectableRowsMap.keys()]);
        const columns = [...processedColumns.values()];
        const columnIds = new Series(columns.map((c) => String(c.id)));
        return new Plane(rowIds, columnIds, placeholderRowId);
      },
    );
    this.selection = new SheetSelectionStore(plane);

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
      this.meta.grouping.update((g) => g.withoutColumns([columnId]));
      this.meta.filtering.update((f) => f.withoutColumns([columnId]));
      await this.constraintsDataStore.fetch();
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

  refreshAfterColumnExtraction(
    extractedColumnIds: Column['id'][],
    foreignKeyColumnId?: Column['id'],
  ) {
    this.meta.sorting.update((s) => {
      const firstExtractedColumnWithSort = extractedColumnIds.find((columnId) =>
        s.has(columnId),
      );
      if (
        firstExtractedColumnWithSort &&
        foreignKeyColumnId &&
        !s.has(foreignKeyColumnId)
      ) {
        const sortDirection = s.get(firstExtractedColumnWithSort);
        return s
          .without(extractedColumnIds)
          .with(foreignKeyColumnId, sortDirection ?? 'ASCENDING');
      }
      return s.without(extractedColumnIds);
    });
    this.meta.filtering.update((f) => f.withoutColumns(extractedColumnIds));
    this.meta.grouping.update((g) => {
      const extractedColumnsHaveGrouping = extractedColumnIds.some((columnId) =>
        g.hasColumn(columnId),
      );
      if (
        extractedColumnsHaveGrouping &&
        foreignKeyColumnId &&
        !g.hasColumn(foreignKeyColumnId)
      ) {
        return g.withoutColumns(extractedColumnIds).withEntry({
          columnId: foreignKeyColumnId,
        });
      }
      return g.withoutColumns(extractedColumnIds);
    });
    return this.refresh();
  }

  addEmptyRecord() {
    void this.recordsData.addEmptyRecord();
    this.selection.update((s) => s.ofNewRecordDataEntryCell());
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
