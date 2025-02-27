import { execPipe, filter, first, map } from 'iter-tools';

import { ImmutableSet } from '@mathesar-component-library';

import { parseCellId } from '../../cellIds';
import { fitSelectedValuesToSeriesTransformation } from '../selectionUtils';

import type Basis from './Basis';
import { emptyBasis } from './emptyBasis';
import { basisFromZeroEmptyColumns } from './emptyColumnsBasis';

export function basisFromDataCells(
  _cellIds: Iterable<string>,
  _activeCellId?: string,
): Basis {
  const parsedCells = map(parseCellId, _cellIds);
  const cellIds = new ImmutableSet(_cellIds);
  const activeCellId = (() => {
    if (_activeCellId === undefined) {
      return first(_cellIds);
    }
    if (cellIds.has(_activeCellId)) {
      return _activeCellId;
    }
    return first(_cellIds);
  })();

  return {
    activeCellId,
    cellIds,
    columnIds: new ImmutableSet(map(({ columnId }) => columnId, parsedCells)),
    rowIds: new ImmutableSet(map(({ rowId }) => rowId, parsedCells)),

    pasteOperation: 'update',

    getFullySelectedColumnIds(plane) {
      // This logic is somewhat complex because:
      //
      // - We might want to support non-rectangular selections someday.
      // - For performance, we want to avoid iterating over all the selected
      //   cells.
      const selectedRowCount = this.rowIds.size;
      const availableRowCount = plane.rowIds.length;
      if (selectedRowCount < availableRowCount) {
        // Performance heuristic. If the number of selected rows is less than the
        // total number of rows, we can assume that no column exist in which all
        // rows are selected.
        return new ImmutableSet();
      }

      const selectedColumnCount = this.columnIds.size;
      const selectedCellCount = this.cellIds.size;
      const avgCellsSelectedPerColumn = selectedCellCount / selectedColumnCount;
      if (avgCellsSelectedPerColumn === availableRowCount) {
        // Performance heuristic. We know that no column can have more cells
        // selected than the number of rows. Thus, if the average number of cells
        // selected per column is equal to the number of rows, then we know that
        // all selected columns are fully selected.
        return this.columnIds;
      }

      // This is the worst-case scenario, performance-wise, which is why we try to
      // return early before hitting this branch. This case will only happen when
      // we have a mix of fully selected columns and partially selected columns.
      // This case should be rare because most (maybe all?) selections are
      // rectangular.
      const countSelectedCellsPerColumn = new Map<string, number>();
      for (const cellId of this.cellIds) {
        const { columnId } = parseCellId(cellId);
        const count = countSelectedCellsPerColumn.get(columnId) ?? 0;
        countSelectedCellsPerColumn.set(columnId, count + 1);
      }
      const fullySelectedColumnIds = execPipe(
        countSelectedCellsPerColumn,
        filter(([, count]) => count === availableRowCount),
        map(([id]) => id),
      );
      return new ImmutableSet(fullySelectedColumnIds);
    },

    adaptToModifiedPlane({ oldPlane, newPlane }) {
      if (!newPlane.hasResultRows) return basisFromZeroEmptyColumns();

      const [minRowId, maxRowId] = fitSelectedValuesToSeriesTransformation(
        this.rowIds,
        oldPlane.rowIds,
        newPlane.rowIds,
      );
      const [minColumnId, maxColumnId] =
        fitSelectedValuesToSeriesTransformation(
          this.columnIds,
          oldPlane.columnIds,
          newPlane.columnIds,
        );
      if (
        minRowId === undefined ||
        maxRowId === undefined ||
        minColumnId === undefined ||
        maxColumnId === undefined
      ) {
        return emptyBasis();
      }

      const newCellIds = newPlane.dataCellsInFlexibleRowColumnRange(
        minRowId,
        maxRowId,
        minColumnId,
        maxColumnId,
      );

      return basisFromDataCells(newCellIds, this.activeCellId);
    },
  };
}

export function basisFromOneDataCell(cellId: string): Basis {
  return basisFromDataCells([cellId], cellId);
}
