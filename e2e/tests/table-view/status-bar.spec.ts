import { runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { ABORTED_RECORDS_REQUEST } from '../../support/page-errors';
import { failRpcMethod } from '../../support/rpc-failures';
import { chooseOption } from '../../support/ui/components/select';
import {
  loadingButton,
  newRecordButtonByPlace,
  retryButton,
} from '../../support/ui/components/status-bar';
import { TablePage } from '../../support/ui/pages/table-page';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from './fixtures';

test.describe('the status bar of the table page', () => {
  test('says Loading and holds New Record back while the records load', async ({
    page,
    longTablePage,
  }) => {
    const releaseRecords = await holdRpcCalls(page, 'records.list');
    await longTablePage.refreshButton.click();

    await expect(loadingButton(longTablePage)).toBeDisabled();
    await expect(longTablePage.newRecordButton).toBeDisabled();

    releaseRecords();
    await expect(longTablePage.refreshButton).toBeEnabled();
    await expect(longTablePage.newRecordButton).toBeEnabled();
  });

  test.describe(() => {
    // Retry shows while the other parts of the refresh may still load, and
    // cancels them (known bug records-request-abort-uncaught).
    test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

    test('keeps the records after a failed load and loads them again on Retry', async ({
      page,
      schema,
      longTablePage,
    }) => {
      const { sheet } = longTablePage;
      const restore = await failRpcMethod(page, 'records.list', 'Unavailable');
      await longTablePage.refreshButton.click();
      await expect(retryButton(longTablePage)).toBeVisible();
      await expect(sheet.cell(0, 'Label')).toHaveText('row 1');
      await expect(longTablePage.recordCount).toHaveText(
        'Showing 1–500 of 1,200',
      );

      await restore();
      await runSqlInSchema(
        schema,
        `INSERT INTO "Long" ("Label", "Number") VALUES ('row 1201', 1201)`,
      );
      await retryButton(longTablePage).click();

      await expect(longTablePage.recordCount).toHaveText(
        'Showing 1–500 of 1,201',
      );
      await expect(longTablePage.refreshButton).toBeVisible();
    });
  });
});

test.describe('a status bar that gets narrow', () => {
  test('shortens the count and the page, hides the label of New Record and moves the page size into the page jumper', async ({
    page,
    longTablePage,
    pagination,
  }) => {
    await page.setViewportSize({ width: 500, height: 900 });
    await expect(longTablePage.recordCount).toHaveText('1,200 Records');
    await expect(pagination.currentPage).toHaveText('Page 1');
    await expect(newRecordButtonByPlace(longTablePage)).toHaveText('');
    await expect(pagination.pageSize).toHaveCount(0);

    await pagination.currentPage.click();
    await chooseOption(pagination.jumper.pageSize, '100');
    // Refresh has no label at this width, and New Record stays disabled until
    // the records have loaded.
    await expect(newRecordButtonByPlace(longTablePage)).toBeEnabled();
    await pagination.nextButton.click();

    await expect(pagination.currentPage).toHaveText('Page 2');
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 101');
  });
});

// `TablePage.goto` waits for the label of Refresh, which a narrow status bar hides.
test.describe('a status bar that is narrow when the table opens', () => {
  test.use({ viewport: { width: 600, height: 900 } });

  test(
    'labels New Record as Proceed',
    pinsKnownBug('new-record-label-proceed'),
    async ({ page, longTable }) => {
      const tablePage = new TablePage(page);
      await page.goto(tableUrl(longTable));
      await expect(tablePage.recordCount).toHaveText('1,200 Records');

      await expect(newRecordButtonByPlace(tablePage)).toHaveText('Proceed');
    },
  );

  test.fixme('shows New Record without a label', async ({
    page,
    longTable,
  }) => {
    const tablePage = new TablePage(page);
    await page.goto(tableUrl(longTable));
    await expect(tablePage.recordCount).toHaveText('1,200 Records');

    await expect(newRecordButtonByPlace(tablePage)).toHaveText('');
  });
});
