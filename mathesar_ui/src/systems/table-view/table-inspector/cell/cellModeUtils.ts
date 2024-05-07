import type { SelectedCellData } from '@mathesar/components/inspector/cell/cellInspectorUtils';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import type {
  ProcessedColumns,
  RecordRow,
  RecordSummariesForSheet,
} from '@mathesar/stores/table-data';
import { defined } from '@mathesar-component-library';

export function getSelectedCellData(
  selection: SheetSelection,
  selectableRowsMap: Map<string, RecordRow>,
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
  const row = selectableRowsMap.get(rowId);
  const value = row?.record[columnId];
  const column = processedColumns.get(Number(columnId));
  const recordSummary = defined(
    value,
    (v) => recordSummaries.get(columnId)?.get(String(v)),
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
