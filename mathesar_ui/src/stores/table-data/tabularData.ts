import { getContext, setContext } from 'svelte';
import { type Readable, type Writable, derived, writable } from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type { SelectedCellData } from '@mathesar/components/sheet/selection';
import Plane from '@mathesar/components/sheet/selection/Plane';
import Series from '@mathesar/components/sheet/selection/Series';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import SheetSelectionStore from '@mathesar/components/sheet/selection/SheetSelectionStore';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import type {
  ProcessedColumns,
  RecordRow,
  RecordSummariesForSheet,
} from '@mathesar/stores/table-data';
import type { ShareConsumer } from '@mathesar/utils/shares';
import { orderProcessedColumns } from '@mathesar/utils/tables';
import { defined } from '@mathesar-component-library';

import { ColumnsDataStore } from './columns';
import { ConstraintsDataStore } from './constraints';
import { Display } from './display';
import { Meta } from './meta';
import { type ProcessedColumnsStore, processColumn } from './processedColumns';
import { RecordsData } from './records';

function getSelectedCellData(
  selection: SheetSelection,
  selectableRowsMap: Map<string, RecordRow>,
  processedColumns: ProcessedColumns,
  linkedRecordSummaries: RecordSummariesForSheet,
): SelectedCellData {
  const { activeCellId } = selection;
  const selectionData = {
    cellCount: selection.cellIds.size,
  };
  if (activeCellId === undefined) {
    return { selectionData };
  }
  const { rowId, columnId } = parseCellId(activeCellId);
  const row = selectableRowsMap.get(rowId);
  const value = row?.record[columnId];
  const column = processedColumns.get(Number(columnId));
  const recordSummary = defined(
    value,
    (v) => linkedRecordSummaries.get(columnId)?.get(String(v)),
  );
  return {
    activeCellData: column && {
      column,
      value,
      recordSummary,
    },
    selectionData,
  };
}

export interface TabularDataProps {
  database: Pick<Database, 'id'>;
  table: Table;
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
  /**
   * When true, load the record summaries associated directly with each record
   * in the table. These are *not* the record summaries associated with linked
   * records. Instead they are the summaries of the records themselves. By
   * default, we don't load these summaries because it's a performance hit. But
   * we need them for the records within the record selector.
   */
  loadIntrinsicRecordSummaries?: boolean;
}

export class TabularData {
  database: Pick<Database, 'id'>;

  table: Table;

  meta: Meta;

  columnsDataStore: ColumnsDataStore;

  processedColumns: ProcessedColumnsStore;

  constraintsDataStore: ConstraintsDataStore;

  recordsData: RecordsData;

  display: Display;

  isLoading: Readable<boolean>;

  selection: SheetSelectionStore;

  selectedCellData: Readable<SelectedCellData>;

  shareConsumer?: ShareConsumer;

  constructor(props: TabularDataProps) {
    this.database = props.database;
    const contextualFilters =
      props.contextualFilters ?? new Map<number, string | number>();
    this.table = props.table;
    this.meta = props.meta ?? new Meta();
    this.shareConsumer = props.shareConsumer;
    this.columnsDataStore = new ColumnsDataStore({
      database: props.database,
      table: this.table,
      hiddenColumns: contextualFilters.keys(),
      shareConsumer: this.shareConsumer,
    });
    this.constraintsDataStore = new ConstraintsDataStore({
      database: props.database,
      table: props.table,
      shareConsumer: this.shareConsumer,
    });
    this.recordsData = new RecordsData({
      database: props.database,
      table: props.table,
      meta: this.meta,
      columnsDataStore: this.columnsDataStore,
      contextualFilters,
      shareConsumer: this.shareConsumer,
      loadIntrinsicRecordSummaries: props.loadIntrinsicRecordSummaries,
    });
    this.display = new Display(this.recordsData);

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

    this.selectedCellData = derived(
      [
        this.selection,
        this.recordsData.selectableRowsMap,
        this.processedColumns,
        this.recordsData.linkedRecordSummaries,
      ],
      (args) => getSelectedCellData(...args),
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

  refresh(): Promise<unknown> {
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
