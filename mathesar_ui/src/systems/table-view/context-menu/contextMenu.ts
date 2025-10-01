import { get } from 'svelte/store';

import {
  type ClientPosition,
  type ContextMenuController,
  type ModalController,
  menuSection,
} from '@mathesar/component-library';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
import type { ImperativeFilterController } from '@mathesar/pages/table/ImperativeFilterController';
import type { TabularData } from '@mathesar/stores/table-data';
import type RecordStore from '@mathesar/systems/record-view/RecordStore';
import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
import { match } from '@mathesar/utils/patternMatching';

import { deleteRecords } from './entries/deleteRecords';
import { duplicateRecord } from './entries/duplicateRecord';
import { modifyFilters } from './entries/modifyFilters';
import { modifyGrouping } from './entries/modifyGrouping';
import { modifySorting } from './entries/modifySorting';
import { openTable } from './entries/openTable';
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
}: {
  targetCell: SheetCellDetails;
  position: ClientPosition;
  contextMenu: ContextMenuController;
  modalRecordView: ModalController<RecordStore> | undefined;
  tabularData: TabularData;
  imperativeFilterController: ImperativeFilterController | undefined;
}): void {
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

  function* getEntriesForOneColumn(columnId: string) {
    const column = tabularData.getProcessedColumn(columnId);
    if (!column) return;

    yield* modifyFilters({ tabularData, column, imperativeFilterController });
    yield* modifySorting({ tabularData, column });
    yield* modifyGrouping({ tabularData, column });

    yield menuSection(...openTable({ column }));
  }

  function* getEntriesForMultipleCells(cellIds: string[]) {
    yield* setNull({ tabularData, cellIds });
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

  const entries = match(targetCell, 'type', {
    'row-header-cell': ({ rowId }) => {
      selection.update((s) => (s.rowIds.has(rowId) ? s : s.ofOneRow(rowId)));
      const { rowIds } = get(selection);
      const soleRowId = takeFirstAndOnly(rowIds);
      return soleRowId
        ? [...getEntriesForOneRow(soleRowId)]
        : [...getEntriesForMultipleRows([...rowIds])];
    },

    'column-header-cell': ({ columnId }) => {
      selection.update((s) =>
        s.columnIds.has(columnId) ? s : s.ofOneColumn(columnId),
      );
      const { columnIds } = get(selection);
      const soleColumnId = takeFirstAndOnly(columnIds);
      return soleColumnId ? [...getEntriesForOneColumn(soleColumnId)] : [];
    },

    'data-cell': ({ cellId }) => {
      selection.update((s) =>
        s.cellIds.has(cellId) ? s : s.ofOneCell(cellId),
      );
      const { cellIds } = get(selection);
      const soleCellId = takeFirstAndOnly(cellIds);
      return soleCellId
        ? [...getEntriesForOneCell(cellId)]
        : [...getEntriesForMultipleCells([...cellIds])];
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

  contextMenu.open({ position, entries });
}
