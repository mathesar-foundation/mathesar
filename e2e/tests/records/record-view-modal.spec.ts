import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { menuItem } from '../../support/ui/components/menu';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { RecordModal, RecordPage } from '../../support/ui/pages/record-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { recordUrl } from '../../support/ui/urls';
import { expect, test } from '../relationships/library';

async function storedTitleOfDune(schema: Schema): Promise<string | undefined> {
  const [dune] = await runSqlInSchema<{ Title: string }>(
    schema,
    'SELECT "Title" FROM "Books" WHERE id = 1',
  );
  return dune?.Title;
}

test.describe('the record view modal', () => {
  let tablePage: TablePage;
  let modal: RecordModal;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    modal = new RecordModal(page);
    await tablePage.goto(library.books);
    await tablePage.sheet.recordLink(0).click();
    await expect(modal.view.field('Title')).toHaveValue('Dune');
    await expect(
      modal.view.relatedRecords('Books_Tags').sheet.recordRows,
    ).toHaveCount(2);
  });

  test('names the record and its table, links to the record page and has the focus on its close button', async ({
    library,
  }) => {
    await expect(modal.title).toContainText('Dune');
    await expect(modal.title).toContainText('Record in Books');
    await expect(modal.fullPageLink).toHaveAttribute(
      'href',
      recordUrl(library.books, 1),
    );
    await expect(modal.closeButton).toBeFocused();
    await expect(modal.view.linkedRecord('Author').summary).toHaveText(
      'Frank Herbert',
    );
  });

  test('stays open on Escape and on a click beside it', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(modal.closeButton).toBeFocused();
    await modal.clickBeside();

    await modal.expectOpen();
    await modal.view.field('Title').fill('Dune Messiah');
    await expect(modal.view.status).toHaveText('Unsaved Changes');
  });

  test('the close button closes it and gives the focus back to the cell', async () => {
    await modal.closeButton.click();

    await modal.expectClosed();
    await expect(tablePage.sheet.activeCell).toHaveText('1');
    await tablePage.sheet.expectFocusOnActiveCell();
  });

  test('saves the changed fields, stays open and shows the new summary without a status', async ({
    page,
    schema,
  }) => {
    const { view } = modal;
    const rpcCalls = recordRpcCalls(page);
    await view.field('Title').fill('Dune Messiah');
    await expect(view.status).toHaveText('Unsaved Changes');
    await view.saveButton.click();

    await expect(modal.title).toContainText('Dune Messiah');
    await expect(view.saveButton).toHaveCount(0);
    await expect(view.status).toHaveCount(0);
    await modal.expectOpen();
    expect(rpcCalls).toEqual(['records.patch']);
    expect(await storedTitleOfDune(schema)).toBe('Dune Messiah');
  });

  test(
    'the sheet keeps the old value after a save in the modal',
    pinsKnownBug('record-modal-save-leaves-sheet-stale'),
    async ({ page }) => {
      const rpcCalls = recordRpcCalls(page);
      await modal.view.field('Title').fill('Dune Messiah');
      await modal.view.saveButton.click();
      await expect(modal.title).toContainText('Dune Messiah');
      await modal.closeButton.click();

      await modal.expectClosed();
      await expect(tablePage.sheet.cell(0, 'Title')).toHaveText('Dune');
      expect(rpcCalls).toEqual(['records.patch']);
    },
  );

  test.fixme('the sheet shows the saved value once the modal has saved', async () => {
    await modal.view.field('Title').fill('Dune Messiah');
    await modal.view.saveButton.click();
    await expect(modal.title).toContainText('Dune Messiah');
    await modal.closeButton.click();

    await expect(tablePage.sheet.cell(0, 'Title')).toHaveText('Dune Messiah');
  });

  test('lists the records that link to it, under headings that are no links', async () => {
    const tags = modal.view.relatedRecords('Books_Tags');

    await expect(modal.view.relatedRecordHeadings).toHaveText(['Books_Tags']);
    await expect(tags.tableLink).toHaveCount(0);
    await expect(tags.sheet.cell(0, 'Tag')).toHaveText('scifi');
    await expect(tags.sheet.cell(1, 'Tag')).toHaveText('classic');
    await expect(tags.recordCount).toHaveText('2 Records');
  });

  test('a linked record opens in a second modal on top, which closes alone', async ({
    page,
  }) => {
    await modal.view.fieldOptionsButton('Author').click();
    await menuItem(page, 'Quick View Linked Record').click();

    const authorModal = new RecordModal(page, 'Frank Herbert');
    await expect(authorModal.title).toContainText('Record in Authors');
    await expect(authorModal.view.field('Country')).toHaveValue('USA');
    await authorModal.closeButton.click();

    await authorModal.expectClosed();
    await expect(modal.title).toContainText('Dune');
    await modal.expectOpen();
  });

  test('the record selector of a field opens over it and Escape closes the selector only', async ({
    page,
  }) => {
    const selector = new RecordSelector(page);
    const author = modal.view.linkedRecord('Author');
    await author.pickButton.click();
    await expect(selector.rows).toHaveCount(4);
    await page.keyboard.press('Escape');

    await selector.expectClosed();
    await modal.expectOpen();
    await expect(author.root).toBeFocused();
    await expect(author.summary).toHaveText('Frank Herbert');
  });

  test('the link in its title opens the record page', async ({
    page,
    library,
  }) => {
    await modal.fullPageLink.click();

    await expect(page).toHaveURL(recordUrl(library.books, 1));
    await modal.expectClosed();
    const recordPage = new RecordPage(page);
    await expect(recordPage.summary).toHaveText('Dune');
    await expect(recordPage.relatedRecordHeadings).toHaveText(['Books_Tags']);
  });
});

test('"Quick View Record" on the Record tab of the inspector opens the active record', async ({
  page,
  library,
}) => {
  const tablePage = new TablePage(page);
  await tablePage.goto(library.books);
  await tablePage.sheet.cell(2, 'Pages').click();
  await tablePage.inspector.tab('Record').click();
  await tablePage.inspector.button('Quick View Record').click();

  const modal = new RecordModal(page, 'Ulysses');
  await expect(modal.view.field('Pages')).toHaveValue('730');
  await expect(modal.view.relatedRecordHeadings).toHaveText(['Books_Tags']);
});
