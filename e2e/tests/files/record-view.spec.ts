import { fileInput } from '../../support/ui/components/file-attachments';
import { RecordModal, RecordPage } from '../../support/ui/pages/record-page';
import {
  NOTES,
  expect,
  storedAttachments,
  test,
  uploadedFile,
  uploadedUri,
} from './fixtures';

test.describe('the file field of the record page', () => {
  test('shows an image as a large thumbnail named by its storage URI', async ({
    page,
    documents: { table, cover },
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 1);

    const field = fileInput(recordPage.root, 'Attachment');
    await expect(field.thumbnail).toHaveAccessibleName(cover.uri);
    await expect
      .poll(async () => (await field.thumbnail.boundingBox())?.height)
      .toBeGreaterThan(100);
  });

  test('takes an upload into the empty field, which Save stores', async ({
    page,
    documents: { table, cover, notes },
    uploadModal,
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 3);
    const field = fileInput(recordPage.root, 'Attachment');
    await field.uploadButton.click();
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectClosed();
    await expect(field.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await expect(recordPage.status).toHaveText('Unsaved Changes');
    expect(await storedAttachments(table)).toEqual([cover, notes, null]);

    await recordPage.saveButton.click();
    await expect(recordPage.status).toHaveText('All Changes Saved');
    expect(await storedAttachments(table)).toEqual([
      cover,
      notes,
      uploadedFile('notes.txt'),
    ]);
  });

  test('Enter on the empty field opens the Upload File window, which gives the focus back to the field', async ({
    page,
    documents: { table },
    uploadModal,
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 3);
    const field = fileInput(recordPage.root, 'Attachment');
    await field.root.focus();
    await page.keyboard.press('Enter');
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectClosed();
    await expect(field.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await expect(field.root).toBeFocused();
  });

  test('Enter on a field with a file opens the details of the file', async ({
    page,
    documents: { table, notes },
    fileDropdown,
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 2);
    await fileInput(recordPage.root, 'Attachment').root.focus();
    await page.keyboard.press('Enter');

    await expect(fileDropdown.details.storageUri).toHaveText(notes.uri);
    await expect(fileDropdown.removeButton).toBeFocused();
  });

  test('Delete empties the focused field and marks it NULL, which Save stores', async ({
    page,
    documents: { table, cover },
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 2);
    const field = fileInput(recordPage.root, 'Attachment');
    await field.root.focus();
    await page.keyboard.press('Delete');

    await expect(field.fileButton).toHaveCount(0);
    await expect(field.uploadButton).toBeVisible();
    await expect(recordPage.nullMark('Attachment')).toBeVisible();
    await recordPage.saveButton.click();
    await expect(recordPage.status).toHaveText('All Changes Saved');
    expect(await storedAttachments(table)).toEqual([cover, null, null]);
  });

  test('once the file field lost the focus, Backspace in another field leaves the file alone', async ({
    page,
    documents: { table, notes },
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 2);
    const field = fileInput(recordPage.root, 'Attachment');
    await field.root.focus();
    await recordPage.field('Notes').click();
    await page.keyboard.type('ab');
    await page.keyboard.press('Backspace');

    await expect(recordPage.field('Notes')).toHaveValue('a');
    await expect(field.fileButton).toHaveAccessibleName(notes.uri);
  });

  test('Remove in the lightbox empties the field until Save, and Discard Changes brings the file back', async ({
    page,
    documents: { table, cover, notes },
    lightbox,
    removeConfirmation,
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(table, 1);
    const field = fileInput(recordPage.root, 'Attachment');
    await field.thumbnail.click();
    await lightbox.removeButton.click();
    await removeConfirmation.removeButton.click();

    await expect(lightbox.root).toHaveCount(0);
    await expect(field.thumbnail).toHaveCount(0);
    await expect(recordPage.status).toHaveText('Unsaved Changes');
    expect(await storedAttachments(table)).toEqual([cover, notes, null]);

    await recordPage.discardButton.click();
    await expect(field.thumbnail).toHaveAccessibleName(cover.uri);
  });
});

test.describe('the file field of the record modal', () => {
  test('takes an upload through a window over the modal, which Save stores', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    uploadModal,
  }) => {
    await sheet.recordLink(2).click();
    const modal = new RecordModal(page);
    const field = fileInput(modal.root, 'Attachment');
    await field.uploadButton.click();
    await uploadModal.chooseFile(NOTES);

    await uploadModal.expectClosed();
    await modal.expectOpen();
    await expect(field.fileButton).toHaveAccessibleName(
      uploadedUri('notes.txt'),
    );
    await modal.view.saveButton.click();
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, notes, uploadedFile('notes.txt')]);
  });

  test('Escape closes the details of a file and leaves the modal open, with the focus on the file', async ({
    page,
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await sheet.recordLink(1).click();
    const modal = new RecordModal(page);
    const field = fileInput(modal.root, 'Attachment');
    await field.fileButton.click();
    await expect(fileDropdown.removeButton).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(fileDropdown.root).toHaveCount(0);
    await expect(field.fileButton).toBeFocused();
    await modal.expectOpen();
  });

  test('the lightbox opens over the modal, and Escape closes the lightbox only, with the focus back on the field', async ({
    page,
    tablePage: { sheet },
    lightbox,
  }) => {
    await sheet.recordLink(0).click();
    const modal = new RecordModal(page);
    const field = fileInput(modal.root, 'Attachment');
    await field.thumbnail.click();
    await expect(lightbox.closeButton).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(lightbox.root).toHaveCount(0);
    await modal.expectOpen();
    await expect(field.root).toBeFocused();
  });
});
