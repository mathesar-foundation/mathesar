import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  type ClientPosition,
  type ContextMenuController,
  type ModalController,
  buttonMenuEntry,
  hyperlinkMenuEntry,
  menuSection,
  subMenu,
} from '@mathesar/component-library';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type { SheetClipboardHandler } from '@mathesar/components/sheet/clipboard/SheetClipboardHandler';
import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import type { ImperativeFilterController } from '@mathesar/pages/table/ImperativeFilterController';
import type { TabularData } from '@mathesar/stores/table-data';
import type RecordStore from '@mathesar/systems/record-view/RecordStore';
import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
import { match } from '@mathesar/utils/patternMatching';

import { getRowActions } from '../row-actions';
import { copyCells } from './entries/copyCells';
import { deleteColumn } from './entries/deleteColumn';
import { modifyFilters } from './entries/modifyFilters';
import { modifyGrouping } from './entries/modifyGrouping';
import { modifySorting } from './entries/modifySorting';
import { openTable } from './entries/openTable';
import { pasteCells } from './entries/pasteCells';
import { selectCellRange } from './entries/selectCellRange';
import { setNull } from './entries/setNull';
import { viewLinkedRecord } from './entries/viewLinkedRecord';

export function openTableCellContextMenu({
  targetCell,
  position,
  contextMenu,
  modalRecordView,
  tabularData,
  imperativeFilterController,
  clipboardHandler,
  beginSelectingCellRange,
}: {
  targetCell: SheetCellDetails;
  position: ClientPosition;
  contextMenu: ContextMenuController;
  modalRecordView: ModalController<RecordStore> | undefined;
  tabularData: TabularData;
  imperativeFilterController: ImperativeFilterController | undefined;
  clipboardHandler: SheetClipboardHandler;
  beginSelectingCellRange: () => void;
}): 'opened' | 'empty' {
  const { selection } = tabularData;

  function* getEntriesForMultipleRows(rowIds: string[]) {
    // Use the headless row actions component
    const actions = getRowActions({
      rowIds,
      tabularData,
      modalRecordView,
    });

    for (const action of actions) {
      if (action.href) {
        yield hyperlinkMenuEntry({
          icon: action.icon,
          label: action.label,
          href: action.href,
        });
      } else {
        yield buttonMenuEntry({
          icon: action.icon,
          label: action.label,
          onClick: action.onClick ?? (() => {}),
          danger: action.danger,
          disabled: action.disabled,
        });
      }
    }
  }

  function* getEntriesForOneRow(rowId: string) {
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
    yield* copyCells({
      clipboardHandler,
    });
    yield* pasteCells({
      selection,
      clipboardHandler,
    });
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
