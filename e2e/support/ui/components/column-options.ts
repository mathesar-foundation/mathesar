import type { Locator, Page } from '@playwright/test';

import { openMenu } from './menu';
import { openSelect } from './select';

/**
 * A column in an open menu of columns. The accessible name of an entry starts
 * with the data type of the column, so the entry is found by the name it shows.
 */
export function columnMenuItem(page: Page, columnName: string): Locator {
  return openMenu(page)
    .getByRole('menuitem')
    .filter({ has: page.getByText(columnName, { exact: true }) });
}

/** Chooses a column in a select whose options show the data type next to the name. */
export async function chooseColumn(
  trigger: Locator,
  columnName: string,
): Promise<void> {
  const listbox = await openSelect(trigger);
  await listbox
    .getByRole('option')
    .filter({ has: trigger.page().getByText(columnName, { exact: true }) })
    .click();
}
