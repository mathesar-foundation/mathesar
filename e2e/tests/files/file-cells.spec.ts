import { runSqlInSchema } from '../../support/api/mathesar';
import { recordRpcCalls } from '../../support/rpc-log';
import { readClipboardText } from '../../support/ui/clipboard';
import {
  FileDetails,
  FileField,
} from '../../support/ui/components/file-attachments';
import { menuItem } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { Toasts } from '../../support/ui/components/toast';
import { DataExplorerPage } from '../../support/ui/pages/data-explorer-page';
import { TablePage } from '../../support/ui/pages/table-page';
import {
  attachmentCell,
  expect,
  jsonbText,
  storeAttachment,
  storedAttachments,
  test,
} from './fixtures';

test('shows an image as a thumbnail and another file as a button, both named by the storage URI', async ({
  documents: { cover, notes },
  tablePage: { sheet },
}) => {
  await expect(sheet.columnTypeIcon('Attachment')).toHaveAttribute(
    'aria-label',
    'File',
  );
  await expect(attachmentCell(sheet, 0).thumbnail).toHaveAccessibleName(
    cover.uri,
  );
  await expect(attachmentCell(sheet, 1).fileButton).toHaveAccessibleName(
    notes.uri,
  );
});

test('a file reference that Mathesar did not sign shows as its JSON text', async ({
  page,
  documents: { table },
}) => {
  const unsigned = {
    uri: 's3://mathesar-e2e/admin/elsewhere/a.txt',
    mash: '0',
  };
  await storeAttachment(table, 3, JSON.stringify(unsigned));
  const tablePage = new TablePage(page);
  await tablePage.goto(table);

  const receipt = attachmentCell(tablePage.sheet, 2);
  await expect(receipt.root).toHaveText(jsonbText(unsigned));
  await expect(receipt.fileButton).toHaveCount(0);
});

test('a File column whose storage is no longer configured shows its values as JSON', async ({
  page,
  api,
  documents: { table, cover },
}) => {
  await api.setColumnMetadata(table, 'Attachment', {
    file_backend: 'removed',
  });
  const tablePage = new TablePage(page);
  await tablePage.goto(table);

  const { sheet } = tablePage;
  await expect(sheet.columnTypeIcon('Attachment')).toHaveAttribute(
    'aria-label',
    'JSON',
  );
  await expect(sheet.cell(0, 'Attachment')).toHaveText(jsonbText(cover));
});

test('a right click on a thumbnail opens the context menu, whose Set to NULL removes the file', async ({
  page,
  documents: { table, notes },
  tablePage: { sheet },
  lightbox,
}) => {
  const bookCover = attachmentCell(sheet, 0);
  await bookCover.thumbnail.click({ button: 'right' });
  await menuItem(page, 'Set to NULL').click();

  await expect(bookCover.thumbnail).toHaveCount(0);
  await expect(lightbox.root).toHaveCount(0);
  await expect
    .poll(() => storedAttachments(table))
    .toEqual([null, notes, null]);
});

test('the arrow keys and Tab move through file cells like through other cells', async ({
  page,
  tablePage: { sheet },
}) => {
  await sheet.cell(0, 'Title').click();
  await page.keyboard.press('ArrowRight');
  await expect(sheet.cell(0, 'Attachment')).toHaveAttribute('data-cell-active');
  await page.keyboard.press('ArrowDown');
  await expect(sheet.cell(1, 'Attachment')).toHaveAttribute('data-cell-active');
  await page.keyboard.press('Tab');
  await expect(sheet.cell(1, 'Notes')).toHaveAttribute('data-cell-active');
  await page.keyboard.press('Shift+Tab');
  await expect(sheet.cell(1, 'Attachment')).toHaveAttribute('data-cell-active');
  await page.keyboard.press('ArrowLeft');
  await expect(sheet.cell(1, 'Title')).toHaveAttribute('data-cell-active');
});

test('Delete, Backspace and typed text leave a file cell as it is', async ({
  page,
  documents: { table, cover, notes },
  tablePage: { sheet },
}) => {
  const rpcCalls = recordRpcCalls(page);
  await sheet.cell(1, 'Title').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Delete');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('x');

  await expect(attachmentCell(sheet, 1).fileButton).toHaveAccessibleName(
    notes.uri,
  );
  await sheet.expectFocusOnActiveCell();
  expect(rpcCalls).not.toContain('records.patch');
  expect(await storedAttachments(table)).toEqual([cover, notes, null]);
});

test.describe('the clipboard', () => {
  test('Control+C copies a file cell as the JSON text of its reference', async ({
    page,
    documents: { cover },
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Attachment').click({ position: { x: 120, y: 10 } });
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 1 cell');
    const quoted = `"${jsonbText(cover).replaceAll('"', '""')}"`;
    expect(await readClipboardText(page)).toBe(quoted);
  });

  test('a copied file pasted into another file cell shows there at once', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Attachment').click({ position: { x: 120, y: 10 } });
    await page.keyboard.press('Control+c');
    await new Toasts(page).expectMessage('Copied 1 cell');
    await attachmentCell(sheet, 2).root.click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(attachmentCell(sheet, 2).thumbnail).toHaveAccessibleName(
      cover.uri,
    );
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, cover]);
  });
});

test('the Cell tab of the inspector shows the file with its name, storage URI and MIME type', async ({
  documents: { notes },
  tablePage: { sheet, inspector },
}) => {
  await sheet.cell(1, 'Attachment').click({ position: { x: 120, y: 10 } });
  await inspector.tab('Cell').click();

  await expect(new FileField(inspector.panel).fileButton).toHaveAccessibleName(
    notes.uri,
  );
  const details = new FileDetails(inspector.panel);
  await expect(details.name).toHaveText('notes.txt');
  await expect(details.storageUri).toHaveText(notes.uri);
  await expect(details.mimeType).toHaveText('text/plain');
});

test('the record selector shows the thumbnail of a file, and its search input of the File column is disabled', async ({
  page,
  api,
  documents: { table, cover },
}) => {
  await runSqlInSchema(
    table.schema,
    `CREATE TABLE "Loans" (
       id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
       "Document" integer REFERENCES "Documents" (id)
     );
     INSERT INTO "Loans" ("Document") VALUES (NULL);`,
  );
  const loansPage = new TablePage(page);
  await loansPage.goto(await api.getTable(table.schema, 'Loans'));
  await loansPage.sheet.cell(0, 'Document').click();
  await page.keyboard.press('Enter');

  const recordSelector = new RecordSelector(page);
  await expect(
    new FileField(recordSelector.row('Book cover')).thumbnail,
  ).toHaveAccessibleName(cover.uri);
  await expect(recordSelector.searchInput('Attachment')).toBeDisabled();
});

test('the Data Explorer shows a file column as its JSON text', async ({
  page,
  api,
  documents: { table, cover },
}) => {
  const exploration = await api.defineExploration(table, {
    name: 'Attachments',
    columns: ['Title', 'Attachment'],
  });
  const dataExplorer = new DataExplorerPage(page);
  await dataExplorer.gotoSaved(table.schema, exploration.id);

  const { sheet } = dataExplorer.results;
  await expect(sheet.columnTypeIcon('Documents_Attachment')).toHaveAttribute(
    'aria-label',
    'JSON',
  );
  await expect(sheet.cell(0, 'Documents_Attachment')).toHaveText(
    jsonbText(cover),
  );
});
