import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  type ClientPosition,
  type ContextMenuController,
  type ModalController,
  menuSection,
  subMenu,
} from '@mathesar/component-library';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import type { ImperativeFilterController } from '@mathesar/pages/table/ImperativeFilterController';
import type { TabularData } from '@mathesar/stores/table-data';
import type RecordStore from '@mathesar/systems/record-view/RecordStore';
import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
import { match } from '@mathesar/utils/patternMatching';

import { deleteColumn } from './entries/deleteColumn';
import { deleteRecords } from './entries/deleteRecords';
import { duplicateRecord } from './entries/duplicateRecord';
import { modifyFilters } from './entries/modifyFilters';
import { modifyGrouping } from './entries/modifyGrouping';
import { modifySorting } from './entries/modifySorting';
import { openTable } from './entries/openTable';
import { selectCellRange } from './entries/selectCellRange';
import { setNull } from './entries/setNull';
import { viewLinkedRecord } from './entries/viewLinkedRecord';
import { viewRowRecord } from './entries/viewRowRecord';

export function openTableCellContextMenu({
  targetCell,
  position,
  contextMenu,
  modalRecordView,
  tabularData,
  imperativeFilterController,
  beginSelectingCellRange,
}: {
  targetCell: SheetCellDetails;
  position: ClientPosition;
  contextMenu: ContextMenuController;
  modalRecordView: ModalController<RecordStore> | undefined;
  tabularData: TabularData;
  imperativeFilterController: ImperativeFilterController | undefined;
  beginSelectingCellRange: () => void;
}): 'opened' | 'empty' {
  const { selection } = tabularData;

  function* getEntriesForMultipleRows(rowIds: string[]) {
    yield* deleteRecords({ tabularData, rowIds });
  }

  function* getEntriesForOneRow(rowId: string) {
    const recordId = tabularData.getRecordIdFromRowId(rowId);
    yield* viewRowRecord({ tabularData, recordId, modalRecordView });
    yield* duplicateRecord({ tabularData, rowId });

    yield* getEntriesForMultipleRows([rowId]);
  }

  function* getEntriesForArbitraryRows(rowIds: Iterable<string>) {
    const soleRowId = takeFirstAndOnly(rowIds);
    if (soleRowId) {
      yield* getEntriesForOneRow(soleRowId);
    } else {
      yield* getEntriesForMultipleRows([...rowIds]);
    }
  }

  function* getEntriesForOneColumn(columnId: string) {
    const column = tabularData.getProcessedColumn(columnId);
    if (!column) return;

    yield* modifyFilters({ tabularData, column, imperativeFilterController });
    yield* modifySorting({ tabularData, column });
    yield* modifyGrouping({ tabularData, column });

    yield menuSection(...openTable({ column }));

    yield* deleteColumn({ tabularData, column });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function* getEntriesForMultipleColumns(columnIds: string[]) {
    // None yet
  }

  function* getEntriesForArbitraryColumns(columnIds: Iterable<string>) {
    const soleColumnId = takeFirstAndOnly(columnIds);
    if (soleColumnId) {
      yield* getEntriesForOneColumn(soleColumnId);
    } else {
      yield* getEntriesForMultipleColumns([...columnIds]);
    }
  }

  function* getEntriesForMultipleCells(cellIds: string[]) {
    yield* setNull({ tabularData, cellIds });
    yield* selectCellRange({ beginSelectingCellRange });
  }

  function* getEntriesForOneCell(cellId: string) {
    const { columnId } = parseCellId(cellId);
    const column = tabularData.getProcessedColumn(columnId);
    const cellValue = tabularData.recordsData.getCellValue(cellId);

    yield* viewLinkedRecord({
      tabularData,
      column,
      cellValue,
      modalRecordView,
    });

    yield* getEntriesForMultipleCells([cellId]);
  }

  function* getEntriesForArbitraryCells({
    cellIds,
    rowIds,
    columnIds,
  }: SheetSelection) {
    const soleCellId = takeFirstAndOnly(cellIds);
    if (soleCellId) {
      yield* getEntriesForOneCell(soleCellId);
    } else {
      yield* getEntriesForMultipleCells([...cellIds]);
    }

    const rowEntries = [...getEntriesForArbitraryRows(rowIds)];
    if (rowEntries.length) {
      yield subMenu({
        label: get(_)('row_plural', { values: { count: rowIds.size } }),
        entries: rowEntries,
      });
    }

    const columnEntries = [...getEntriesForArbitraryColumns(columnIds)];
    if (columnEntries.length) {
      yield subMenu({
        label: get(_)('column_plural', { values: { count: columnIds.size } }),
        entries: columnEntries,
      });
    }
  }

  const entries = match(targetCell, 'type', {
    'row-header-cell': ({ rowId }) => {
      selection.update((s) => (s.rowIds.has(rowId) ? s : s.ofOneRow(rowId)));
      return [...getEntriesForArbitraryRows(get(selection).rowIds)];
    },

    'column-header-cell': ({ columnId }) => {
      selection.update((s) =>
        s.columnIds.has(columnId) ? s : s.ofOneColumn(columnId),
      );
      return [...getEntriesForArbitraryColumns(get(selection).columnIds)];
    },

    'data-cell': ({ cellId }) => {
      selection.update((s) =>
        s.cellIds.has(cellId) ? s : s.ofOneCell(cellId),
      );
      return [...getEntriesForArbitraryCells(get(selection))];
    },

    // We don't (yet?) offer a context menu for placeholder data cells. In the
    // future, we might want to implement paste here, once we have that option
    // in the context menu.
    'placeholder-data-cell': () => [],

    // We don't offer a context menu for the placeholder row header cell.
    // Clicking this cell inserts a new blank row. So we probably don't want
    // any context menu options here.
    'placeholder-row-header-cell': () => [],
  });

  if (!entries.length) return 'empty';

  contextMenu.open({ position, entries });
  return 'opened';
}
