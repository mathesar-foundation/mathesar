import type { Locator } from '@playwright/test';

import { pauseClock } from '../../support/ui/clock';
import { Toasts } from '../../support/ui/components/toast';
import { toastCloseButton } from '../../support/ui/components/toast-close-button';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, test } from './fixtures';

async function verticalExtent(
  toast: Locator,
): Promise<{ top: number; bottom: number }> {
  const box = (await toast.boundingBox())!;
  return { top: box.y, bottom: box.y + box.height };
}

test('stacks toasts from the oldest down and closes the gap when one is closed', async ({
  page,
  library,
}) => {
  const tablePage = new TablePage(page);
  const { sheet } = tablePage;
  const toasts = new Toasts(page);
  await page.clock.install();
  await tablePage.goto(library.books);
  // The table selects its first cell once it has loaded, which would undo a click.
  await expect(sheet.activeCell).toHaveCount(1);
  // Each copy of a larger selection shows a toast of its own.
  await sheet.cell(0, 'Title').click();
  await page.keyboard.press('Control+c');
  await sheet.cell(1, 'Title').click({ modifiers: ['Shift'] });
  await page.keyboard.press('Control+c');
  await sheet.cell(2, 'Title').click({ modifiers: ['Shift'] });
  await page.keyboard.press('Control+c');
  await pauseClock(page);

  await expect(toasts.items).toHaveText([
    'Copied 1 cell',
    'Copied 2 cells',
    'Copied 3 cells',
  ]);
  const first = await verticalExtent(toasts.items.nth(0));
  const second = await verticalExtent(toasts.items.nth(1));
  const third = await verticalExtent(toasts.items.nth(2));
  expect(second.top).toBeGreaterThanOrEqual(first.bottom);
  expect(third.top).toBeGreaterThanOrEqual(second.bottom);

  await toastCloseButton(toasts).nth(1).click();
  await page.clock.runFor(1000);
  await expect(toasts.items).toHaveText(['Copied 1 cell', 'Copied 3 cells']);
  await expect
    .poll(async () => (await verticalExtent(toasts.items.nth(1))).top)
    .toBeCloseTo(second.top, 0);
});
