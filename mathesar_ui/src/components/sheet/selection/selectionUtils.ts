import type { Writable } from 'svelte/store';

import { defined, type ImmutableSet } from '@mathesar-component-library';
import type Series from './Series';
import type SheetSelection from './SheetSelection';

export type SheetCellDetails =
  | { type: 'data-cell'; cellId: string }
  | { type: 'column-header-cell'; columnId: string }
  | { type: 'row-header-cell'; rowId: string };

export function findContainingSheetCell(
  element: HTMLElement,
): SheetCellDetails | undefined {
  const containingElement = element.closest('[data-sheet-element]');
  if (!containingElement) return undefined;

  const elementType = containingElement.getAttribute('data-sheet-element');
  if (!elementType) return undefined;

  if (elementType === 'data-cell') {
    const cellId = containingElement.getAttribute('data-cell-selection-id');
    if (!cellId) return undefined;
    return { type: 'data-cell', cellId };
  }

  if (elementType === 'column-header-cell') {
    const columnId = containingElement.getAttribute('data-column-identifier');
    if (!columnId) return undefined;
    return { type: 'column-header-cell', columnId };
  }

  if (elementType === 'row-header-cell') {
    const rowId = containingElement.getAttribute('data-row-selection-id');
    if (!rowId) return undefined;
    return { type: 'row-header-cell', rowId };
  }

  return undefined;
}

export function beginSelection({
  selection,
  sheetElement,
  startingCell,
  targetCell,
  selectionInProgress,
}: {
  selection: Writable<SheetSelection>;
  sheetElement: HTMLElement;
  startingCell: SheetCellDetails;
  targetCell: SheetCellDetails;
  selectionInProgress: Writable<boolean>;
}) {
  let previousTarget: HTMLElement | undefined;

  function drawToCell(endingCell: SheetCellDetails) {
    selection.update((s) => s.ofSheetCellRange(startingCell, endingCell));
  }

  function drawToPoint(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target === previousTarget) return; // For performance
    const cell = findContainingSheetCell(target);
    if (!cell) return;
    drawToCell(cell);
  }

  function finish() {
    sheetElement.removeEventListener('mousemove', drawToPoint);
    window.removeEventListener('mouseup', finish);
    selectionInProgress.set(false);
  }

  selectionInProgress.set(true);
  drawToCell(targetCell);
  sheetElement.addEventListener('mousemove', drawToPoint);
  window.addEventListener('mouseup', finish);
}

function positive(n: number): number {
  return Math.max(0, n);
}

/**
 * Given a set of (contiguous) selected values within a series, this function
 * will formulate a new set of selected values to fit within a new series such
 * that the starting index and width of the selection are preserved to the best
 * extent possible.
 *
 * @return A tuple containing the starting and ending values of the new
 * selection.
 */
export function fitSelectedValuesToSeriesTransformation<T>(
  selectedValues: ImmutableSet<T>,
  oldSeries: Series<T>,
  newSeries: Series<T>,
): [T, T] {
  const matchingMin = newSeries.min(selectedValues);
  const matchingMax = newSeries.max(selectedValues);
  if (matchingMin !== undefined && matchingMax !== undefined) {
    return [matchingMin, matchingMax];
  }

  const width = Math.min(selectedValues.size, newSeries.length);
  const oldStartingIndex =
    defined(oldSeries.min(selectedValues), (v) => oldSeries.getIndex(v)) ?? 0;
  const indexReduction = positive(
    oldStartingIndex + width - 1 - newSeries.length,
  );
  const newStartingIndex = positive(oldStartingIndex - indexReduction);
  const newStartingValue = newSeries.at(newStartingIndex) as T;
  const newEndingValue = newSeries.at(newStartingIndex + width - 1) as T;
  return [newStartingValue, newEndingValue];
}
