import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';

interface ActiveCellData {
  column: CellColumnFabric;
  value: unknown;
  recordSummary?: string;
}

interface SelectionData {
  cellCount: number;
}

export interface SelectedCellData {
  activeCellData?: ActiveCellData;
  selectionData: SelectionData;
}
