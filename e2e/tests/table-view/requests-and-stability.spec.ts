import type { Page, Response } from '@playwright/test';

import type { Table } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { ABORTED_RECORDS_REQUEST } from '../../support/page-errors';
import { recordRpcFetches } from '../../support/rpc-log';
import { openMenu } from '../../support/ui/components/menu';
import { chooseOption } from '../../support/ui/components/select';
import type { SortDropdown } from '../../support/ui/components/sort-dropdown';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, test } from './fixtures';

/** What the table page asks for while it loads, in alphabetical order. */
const PAGE_LOAD_CALLS = [
  'columns.list_with_metadata',
  'constraints.list',
  'records.list',
  'records.list',
  'records.list',
  'tables.list_joinable',
];

interface RecordedTablePage {
  tablePage: TablePage;
  /** The RPC methods that the page called since it loaded, in order. */
  calls: string[];
}

async function openRecordingCalls(
  page: Page,
  table: Table,
): Promise<RecordedTablePage> {
  const calls = await recordRpcFetches(page);
  const tablePage = new TablePage(page);
  await tablePage.goto(table);
  await expect.poll(() => [...calls].sort()).toEqual(PAGE_LOAD_CALLS);
  calls.splice(0);
  return { tablePage, calls };
}

/** Makes the Label cell of the second record active, opens the Cell tab and scrolls far down. */
async function selectAndScrollAway(
  page: Page,
  { sheet, inspector }: TablePage,
): Promise<void> {
  await sheet.cell(1, 'Label').click();
  await inspector.tab('Cell').click();
  await sheet.cell(1, 'Label').hover();
  await page.mouse.wheel(0, 3000);
  await expect(sheet.rowContaining('row 110')).toBeInViewport();
}

/**
 * The records of a view change replaced the old ones in place: the second
 * record is active again, scrolled to the top, and the inspector tab stayed.
 */
async function expectRecordsReplacedInPlace(
  { sheet, inspector }: TablePage,
  activeCellText: string,
): Promise<void> {
  await expect(sheet.activeCell).toHaveText(activeCellText);
  await expect(sheet.activeCell).toBeInViewport();
  await inspector.expectOpenTab('Cell');
}

test.describe('the requests of the table page', () => {
  test('loading the table asks for each part once and for the records three times', async ({
    page,
    longTable,
  }) => {
    const calls = await recordRpcFetches(page);
    const tablePage = new TablePage(page);
    await tablePage.goto(longTable);

    await expect.poll(() => [...calls].sort()).toEqual(PAGE_LOAD_CALLS);
    await expect(tablePage.sheet.cell(0, 'Label')).toHaveText('row 1');
    expect([...calls].sort()).toEqual(PAGE_LOAD_CALLS);
  });

  test('opening the Filter, Sort, Group and Hide dropdowns asks for nothing and changes nothing', async ({
    page,
    longTable,
    filter,
    sort,
    group,
    hide,
  }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    for (const trigger of [filter.trigger, sort.trigger, group.trigger]) {
      await trigger.click();
      await expect(openMenu(page)).toBeVisible();
      await tablePage.heading.click();
    }
    await hide.trigger.click();
    await expect(hide.panel).toBeVisible();
    await tablePage.heading.click();

    await expect(tablePage.sheet.rowContaining('row 110')).toBeInViewport();
    await tablePage.inspector.expectOpenTab('Cell');
    expect(calls).toEqual([]);
  });

  test('typing a filter value asks for the records once the typing pauses', async ({
    page,
    longTable,
    filter,
  }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    const condition = await filter.addFirstCondition('Number');
    await chooseOption(condition.condition, 'is greater than');

    await condition.value.pressSequentially('1190', { delay: 50 });

    await expect(tablePage.recordCount).toHaveText('Showing 1–10 of 10');
    expect(calls).toEqual(['records.list']);
  });

  test('Refresh asks for each part once more and keeps the view', async ({
    page,
    longTable,
    sort,
  }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await sort.addFirstEntry('Label');
    await expect(tablePage.sheet.cell(1, 'Label')).toHaveText('row 10');
    await tablePage.heading.click();
    calls.splice(0);

    await tablePage.refreshButton.click();

    const refreshCalls = [
      'columns.list_with_metadata',
      'constraints.list',
      'records.list',
      'tables.list_joinable',
    ];
    await expect.poll(() => [...calls].sort()).toEqual(refreshCalls);
    await expect(tablePage.sheet.cell(1, 'Label')).toHaveText('row 10');
    await expect(sort.trigger).toHaveText('Sort 1');
    expect([...calls].sort()).toEqual(refreshCalls);
  });
});

test.describe('a view change asks for the records only and keeps the selection and the inspector tab', () => {
  test('sorting', async ({ page, longTable, sort }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    await sort.addFirstEntry('Label');

    await expectRecordsReplacedInPlace(tablePage, 'row 10');
    expect(calls).toEqual(['records.list']);
  });

  test('filtering', async ({ page, longTable, filter }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    const condition = await filter.addFirstCondition('Number');
    await condition.apply('is greater than', '600');

    await expectRecordsReplacedInPlace(tablePage, 'row 602');
    expect(calls).toEqual(['records.list']);
  });

  test('grouping', async ({ page, longTable, group }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    await group.addFirstEntry('Label');

    await expectRecordsReplacedInPlace(tablePage, 'row 10');
    expect(calls).toEqual(['records.list']);
  });

  test('going to the next page', async ({ page, longTable, pagination }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    await pagination.nextButton.click();

    await expectRecordsReplacedInPlace(tablePage, 'row 502');
    expect(calls).toEqual(['records.list']);
  });

  test('a new page size', async ({ page, longTable, pagination }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    await selectAndScrollAway(page, tablePage);

    await chooseOption(pagination.pageSize, '100');

    await expect(pagination.currentPage).toHaveText('Page 1 of 12');
    await expectRecordsReplacedInPlace(tablePage, 'row 2');
    expect(calls).toEqual(['records.list']);
  });
});

test.describe('hiding and showing a column', () => {
  test('asks for nothing and keeps the scroll position and the selection', async ({
    page,
    longTable,
    hide,
  }) => {
    const { tablePage, calls } = await openRecordingCalls(page, longTable);
    const { sheet } = tablePage;
    await selectAndScrollAway(page, tablePage);

    await hide.trigger.click();
    await hide.checkbox('Number').check();
    await expect(sheet.columnHeader('Number')).toHaveCount(0);
    await expect(sheet.rowContaining('row 110')).toBeInViewport();
    await hide.checkbox('Number').uncheck();
    await expect(sheet.columnHeader('Number')).toBeVisible();
    await expect(sheet.rowContaining('row 110')).toBeInViewport();

    await tablePage.heading.click();
    await sheet.cell(sheet.rowContaining('row 110'), 'Label').hover();
    await page.mouse.wheel(0, -3000);
    await expect(sheet.activeCell).toHaveText('row 2');
    await tablePage.inspector.expectOpenTab('Cell');
    expect(calls).toEqual([]);
  });
});

interface RpcCall {
  method: string;
}

function isRecordsResponse(response: Response): boolean {
  const body = response.request().postDataJSON() as RpcCall | RpcCall[] | null;
  return [body ?? []].flat().some((call) => call.method === 'records.list');
}

/** Limits how fast the page downloads, in bytes per second. -1 lifts the limit. */
async function limitDownloads(
  page: Page,
  bytesPerSecond: number,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: bytesPerSecond,
    uploadThroughput: -1,
  });
}

/** Sorts, and sorts again while the records of the first sort still download. */
async function sortTwiceQuickly(page: Page, sort: SortDropdown): Promise<void> {
  await limitDownloads(page, 2000);
  const firstRecordsArriving = page.waitForResponse(isRecordsResponse);
  await sort.addFirstEntry('Label');
  await firstRecordsArriving;
  await chooseOption(sort.entry(0).direction, 'Z-A');
  await limitDownloads(page, -1);
}

test.describe('a view change while the records of the last one still download', () => {
  test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

  test(
    'throws an uncaught AbortError',
    pinsKnownBug('records-request-abort-uncaught'),
    async ({ page, longTablePage, sort, browserName }) => {
      test.skip(
        browserName !== 'chromium',
        'Only Chromium can slow down a download, through the DevTools Protocol',
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await sortTwiceQuickly(page, sort);

      await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 999');
      await expect
        .poll(() => errors)
        .toContain('signal is aborted without reason');
    },
  );

  test.fixme('drops the old records without an error', async ({
    page,
    longTablePage,
    sort,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Only Chromium can slow down a download, through the DevTools Protocol',
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await sortTwiceQuickly(page, sort);

    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 999');
    expect(errors).toEqual([]);
  });
});
