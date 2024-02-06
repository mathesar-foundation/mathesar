export interface SheetVirtualRowsApi {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToPosition: (vScrollOffset: number, hScrollOffset: number) => void;
  recalculateHeightsAfterIndex: (index: number) => void;
}

/**
 * These are the different kinds of cells that we can have within a sheet.
 *
 * - `origin-cell`: The cell in the top-left corner of the sheet.
 *
 * - `column-header-cell`: Contains the column names.
 *
 * - `new-column-cell`: Contains the `+` button for adding a new column.
 *
 * - `row-header-cell`: Contains the row numbers.
 *
 * - `data-cell`: Regular data cells.
 */
export type SheetCellType =
  | 'origin-cell'
  | 'column-header-cell'
  | 'new-column-cell'
  | 'row-header-cell'
  | 'data-cell';

/**
 * These are values used for the `data-sheet-element` attribute on the sheet
 * elements.
 *
 * - `header-row`: The top most row of the sheet. It contains the column header
 *   cells.
 *
 * - `data-row`: Used for the remaining rows, including (for now) weird ones
 *   like grouping headers and such.
 *
 * - `positionable-cell`: Cells that span multiple columns or are taken out of
 *   regular flow e.g. "New records" message, grouping headers, etc.
 */
export type SheetElement =
  | 'header-row'
  | 'data-row'
  | 'positionable-cell'
  | SheetCellType;
