import type { SelectedCellData } from '@mathesar/components/inspector/cell/cellInspectorUtils';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import type {
  ProcessedColumns,
  RecordSummariesForSheet,
} from '@mathesar/stores/table-data';

export function getSelectedCellData(
  selection: SheetSelection,
  selectableRowsMap: Map<string, Record<string, unknown>>,
  processedColumns: ProcessedColumns,
  recordSummaries: RecordSummariesForSheet,
): SelectedCellData {
  const { activeCellId } = selection;
  const selectionData = {
    cellCount: selection.cellIds.size,
  };
  if (activeCellId === undefined) {
    return { selectionData };
  }
  const { rowId, columnId } = parseCellId(activeCellId);
  const record = selectableRowsMap.get(rowId) ?? {};
  const value = record[columnId];
  const column = processedColumns.get(Number(columnId));
  const recordSummary = recordSummaries.get(columnId)?.get(String(value));
  return {
    activeCellData: column && {
      column,
      value,
      recordSummary,
    },
    selectionData,
  };
}
