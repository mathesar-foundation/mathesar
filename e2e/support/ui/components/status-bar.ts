import type { Locator } from '@playwright/test';

import type { TablePage } from '../pages/table-page';

function statusBar(tablePage: TablePage): Locator {
  return tablePage.page.locator('.status-pane');
}

function statusButton(tablePage: TablePage, name: string): Locator {
  return statusBar(tablePage).getByRole('button', { name, exact: true });
}

/** The refresh button while the records load. */
export function loadingButton(tablePage: TablePage): Locator {
  return statusButton(tablePage, 'Loading');
}

/** The refresh button once the records failed to load. */
export function retryButton(tablePage: TablePage): Locator {
  return statusButton(tablePage, 'Retry');
}

/**
 * Waits until the records of the last view change have arrived or failed. A
 * change made while they arrive throws (known bug records-request-abort-uncaught).
 */
export async function expectLoadingEnded(tablePage: TablePage): Promise<void> {
  await tablePage.expectLoaded();
}

/** The New Record button, found by its place: a narrow status bar hides its label. */
export function newRecordButtonByPlace(tablePage: TablePage): Locator {
  return statusBar(tablePage).getByRole('button').first();
}
