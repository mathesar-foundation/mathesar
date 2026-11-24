import type { Locator } from '@playwright/test';

import type { Sheet } from './sheet';

export type ColumnIndicator =
  'sorted ascending' | 'sorted descending' | 'filtered' | 'grouped';

/** The indicator icons carry no label. Each is known by a part of its drawing. */
const DRAWING: Record<ColumnIndicator, string> = {
  'sorted ascending': 'M320 32h32',
  'sorted descending': 'M320 480c-17.7',
  filtered: 'M3.9 54.9',
  grouped: 'M64 144c26.5',
};

/** The icons in a column header that tell how the column takes part in the view. */
export function columnIndicators(sheet: Sheet, columnName: string): Locator {
  return sheet.columnHeader(columnName).locator('.indicator-icons svg');
}

export function columnIndicator(
  sheet: Sheet,
  columnName: string,
  indicator: ColumnIndicator,
): Locator {
  return sheet
    .columnHeader(columnName)
    .locator(`.indicator-icons svg:has(path[d*="${DRAWING[indicator]}"])`);
}
