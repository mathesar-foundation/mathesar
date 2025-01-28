import type { ResultValue } from '@mathesar/api/rpc/records';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type { SelectedCellData } from '@mathesar/components/sheet/selection';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';

import { type QueryRow, getRowSelectionId } from '../../QueryRunner';
import type { ProcessedQueryOutputColumnMap } from '../../utils';

export function getSelectedCellData(
  selection: SheetSelection,
  rows: QueryRow[],
  processedColumns: ProcessedQueryOutputColumnMap,
): SelectedCellData {
  const { activeCellId } = selection;
  const selectionData = { cellCount: selection.cellIds.size };
  const fallback = { selectionData };
  if (!activeCellId) return fallback;
  const { rowId, columnId } = parseCellId(activeCellId);
  // TODO: Usage of `find` is not ideal for perf here. Would be nice to store
  // rows in a map for faster lookup.
  const row = rows.find((r) => getRowSelectionId(r) === rowId);
  if (!row) return fallback;
  const value = row.record[columnId] as ResultValue | undefined;
  const column = processedColumns.get(columnId);
  const activeCellData = column && { column, value };
  return { activeCellData, selectionData };
}
