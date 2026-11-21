import { RecordSelector } from '../../support/ui/components/record-selector';
import { RecordModal, RecordPage } from '../../support/ui/pages/record-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { windowOf } from '../../support/ui/screenshot-areas';
import { expect, expectSettled, test } from './fixtures';

test('the record page with the records that link to it', async ({
  page,
  library,
}) => {
  const recordPage = new RecordPage(page);
  await recordPage.goto(library.authors, 2);
  await expect(recordPage.field('Name')).toHaveValue('Jane Austen');
  await expect(recordPage.relatedRecords('Books').refreshButton).toBeVisible();
  await expectSettled(page);

  await expect(page).toHaveScreenshot('record-page.png');
});

test.describe('the table page', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    await tablePage.goto(library.books);
    await expect(tablePage.sheet.activeCell).toHaveCount(1);
  });

  test('the record modal of a record', async ({ page }) => {
    await tablePage.sheet.recordLink(1).click();
    const recordModal = new RecordModal(page);
    await expect(recordModal.view.field('Title')).toHaveValue('Emma');
    await expectSettled(page);

    await expect(windowOf(recordModal.root)).toHaveScreenshot(
      'record-modal.png',
    );
  });

  test('the record selector of a linked cell', async ({ page }) => {
    await tablePage.sheet.cell(1, 'Author').dblclick();
    const selector = new RecordSelector(page);
    await expect(selector.rows).toHaveCount(3);
    await expect(selector.searchInput('Name')).toBeFocused();
    await expectSettled(page);

    await expect(windowOf(selector.window)).toHaveScreenshot(
      'record-selector.png',
    );
  });
});
