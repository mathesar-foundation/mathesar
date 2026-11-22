import { runSqlInSchema } from '../../support/api/mathesar';
import { quoteIdentifier } from '../../support/api/postgres';
import { holdRequests } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { Modal } from '../../support/ui/components/modal';
import { TablePage } from '../../support/ui/pages/table-page';
import {
  NOTES,
  attachmentCell,
  expect,
  storedAttachments,
  test,
  uploadedFile,
  uploadedUri,
} from './fixtures';

const MEBIBYTE = 1024 * 1024;

test.describe('uploading into an empty cell', () => {
  test('uploads the file chosen in the window and shows it in the cell, which keeps the focus', async ({
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await expect(uploadModal.title).toHaveText('Upload File');
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectClosed();
    await expect(receipt.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, uploadedFile('notes.txt')]);
  });

  test('shows no NULL mark, and the upload button only while the cell is active', async ({
    tablePage: { sheet },
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await expect(receipt.root).toHaveText('');
    await expect(receipt.uploadButton).toHaveCount(0);

    await receipt.root.click();
    await expect(receipt.uploadButton).toBeVisible();

    await sheet.cell(2, 'Title').click();
    await expect(receipt.uploadButton).toHaveCount(0);
  });

  test('Enter opens the window with the focus on the drop zone, where Enter opens the file chooser', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    // Playwright needs a moment to intercept file choosers once a test waits for one.
    const fileChooser = page.waitForEvent('filechooser');
    await sheet.cell(2, 'Title').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(uploadModal.dropZone).toBeFocused();

    await page.keyboard.press('Enter');
    await (await fileChooser).setFiles(NOTES);

    await uploadModal.expectClosed();
    await expect(attachmentCell(sheet, 2).fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, uploadedFile('notes.txt')]);
  });

  test('a double click opens the window', async ({
    tablePage: { sheet },
    uploadModal,
  }) => {
    await attachmentCell(sheet, 2).root.dblclick();

    await uploadModal.expectOpen();
  });

  test('uploads a file dropped on the drop zone', async ({
    documents: { table },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await uploadModal.dropFile({
      name: 'dropped.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Dropped from the desktop'),
    });

    await uploadModal.expectClosed();
    await expect(receipt.fileButton).toHaveAccessibleName(
      uploadedUri('dropped.txt'),
    );
    await expect
      .poll(async () => (await storedAttachments(table))[2])
      .toEqual(uploadedFile('dropped.txt'));
  });

  test('shows the name, the size and the progress of the file while it uploads', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const releaseUpload = await holdRequests(page, '**/files/');
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await uploadModal.chooseFile(NOTES);

    await expect(uploadModal.body).toContainText('notes.txt');
    await expect(uploadModal.body).toContainText('28.00 B');
    await expect(uploadModal.progressBar).toBeVisible();
    await expect(uploadModal.progress).toHaveText('Uploaded 0%');
    await expect(uploadModal.dropZone).toHaveCount(0);

    releaseUpload();
    await uploadModal.expectClosed();
    await expect(receipt.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, uploadedFile('notes.txt')]);
  });

  test('closing the window during the upload cancels it and leaves the cell empty', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const releaseUpload = await holdRequests(page, '**/files/');
    const uploadAborted = page.waitForEvent('requestfailed', (request) =>
      request.url().endsWith('/files/'),
    );
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await uploadModal.chooseFile(NOTES);
    await expect(uploadModal.progressBar).toBeVisible();
    await uploadModal.close();

    await uploadModal.expectClosed();
    releaseUpload();
    await uploadAborted;
    await expect(receipt.uploadButton).toBeVisible();
    await expect(receipt.fileButton).toHaveCount(0);
    expect(await storedAttachments(table)).toEqual([cover, notes, null]);
  });

  test('Escape leaves the window open, ready for a file', async ({
    page,
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await page.keyboard.press('Enter');
    await expect(uploadModal.dropZone).toBeFocused();
    await page.keyboard.press('Escape');

    await uploadModal.expectOpen();
    await expect(uploadModal.dropZone).toBeFocused();
    await uploadModal.chooseFile(NOTES);
    await expect(receipt.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
  });

  test('the close button closes the window, leaves the cell empty and gives the focus back to it', async ({
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await expect(uploadModal.dropZone).toBeFocused();
    await uploadModal.close();

    await uploadModal.expectClosed();
    await sheet.expectFocusOnActiveCell();
    await expect(receipt.uploadButton).toBeVisible();
    await expect(receipt.fileButton).toHaveCount(0);
    expect(await storedAttachments(table)).toEqual([cover, notes, null]);
  });

  test('a signed-in user uploads a file larger than public forms allow', async ({
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await uploadModal.chooseFile({
      name: 'large.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(MEBIBYTE + 1, 'a'),
    });

    await uploadModal.expectClosed();
    await expect(receipt.fileButton).toHaveAccessibleName(
      uploadedUri('large.txt'),
    );
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, uploadedFile('large.txt')]);
  });

  test('uploading into the empty last row adds a record with the file', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    await sheet.placeholderCell('Attachment').click();
    await page.keyboard.press('Enter');
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectClosed();
    await expect(sheet.recordRows).toHaveCount(4);
    await expect(attachmentCell(sheet, 3).fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, null, uploadedFile('notes.txt')]);
  });
});

test.describe('a failed upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/files/', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: '<h1>Server Error (500)</h1>',
      }),
    );
  });

  test(
    'closes the window without a message, which shows when the window opens again',
    pinsKnownBug('upload-error-not-shown'),
    async ({
      documents: { table, cover, notes },
      tablePage: { sheet },
      uploadModal,
    }) => {
      const receipt = attachmentCell(sheet, 2);
      await receipt.root.click();
      await receipt.uploadButton.click();
      await uploadModal.chooseFile(NOTES);

      await uploadModal.expectClosed();
      await expect(receipt.uploadButton).toBeVisible();
      await receipt.uploadButton.click();
      await expect(uploadModal.error).toContainText('Error uploading file');
      await expect(uploadModal.error).toContainText(
        '<h1>Server Error (500)</h1>',
      );
      expect(await storedAttachments(table)).toEqual([cover, notes, null]);
    },
  );

  test.fixme('keeps the window open and says that the upload failed', async ({
    tablePage: { sheet },
    uploadModal,
  }) => {
    const receipt = attachmentCell(sheet, 2);
    await receipt.root.click();
    await receipt.uploadButton.click();
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectOpen();
    await expect(uploadModal.error).toContainText('Error uploading file');
    await expect(uploadModal.dropZone).toBeVisible();
  });
});

test.describe('the Upload File window for a user who reads French', () => {
  let uploadWindow: Modal;

  test.beforeEach(
    async ({ api, collaborator, documents: { table }, signInAs }) => {
      const role = quoteIdentifier(collaborator.role.name);
      await runSqlInSchema(
        table.schema,
        `GRANT USAGE ON SCHEMA ${quoteIdentifier(table.schema.name)} TO ${role};
         GRANT SELECT, UPDATE ON "Documents" TO ${role};`,
      );
      await api.setDisplayLanguage(collaborator.user, 'fr');
      const page = await signInAs(collaborator.user);
      const tablePage = new TablePage(page);
      await tablePage.goto(table);
      await tablePage.sheet.cell(2, 'Attachment').click();
      await page.keyboard.press('Enter');
      uploadWindow = new Modal(page, 'Télécharger fichier');
    },
  );

  test(
    'has a French title and an English drop zone',
    pinsKnownBug('file-upload-text-not-translated'),
    async () => {
      await uploadWindow.expectOpen();
      await expect(uploadWindow.body).toContainText('Drag a file here');
    },
  );

  test.fixme('shows its drop zone in French', async () => {
    await uploadWindow.expectOpen();
    await expect(uploadWindow.body).toContainText(/\S/);
    await expect(uploadWindow.body).not.toContainText('Drag a file here');
  });
});
