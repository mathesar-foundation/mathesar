import type { Form } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import {
  FileDetailDropdown,
  FileField,
  FileUploadModal,
  downloadFrom,
} from '../../support/ui/components/file-attachments';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import { PublicFormPage } from '../../support/ui/pages/public-form-page';
import {
  COVER,
  NOTES,
  NOTES_TEXT,
  expect,
  storedAttachments,
  test,
  uploadedFile,
  uploadedUri,
} from './fixtures';

const MEBIBYTE = 1024 * 1024;

test('the form builder adds a File column as an upload field, which Save stores', async ({
  page,
  api,
  documents: { table },
}) => {
  const form = await api.defineForm(table, {
    name: 'Document intake',
    fields: [{ column: 'Title' }],
  });
  const builder = new FormBuilderPage(page);
  await builder.goto(table.schema, form.id);
  const title = await builder.field('Title');
  await title.select();
  await title.addFieldButton.click();
  await builder.columnItem('Attachment').click();

  await builder.expectFieldLabels(['Title', 'Attachment']);
  const attachment = await builder.field('Attachment');
  await expect(new FileField(attachment.input).uploadButton).toBeVisible();
  await builder.save();
  const saved = await api.findForm(table.schema, form.id);
  expect(saved?.fields.map(({ columnAttnum }) => columnAttnum)).toEqual([
    table.columns.Title,
    table.columns.Attachment,
  ]);
});

test.describe('the file field of a published form, for a visitor', () => {
  let publicForm: PublicFormPage;
  let field: FileField;
  let uploadModal: FileUploadModal;

  test.beforeEach(async ({ api, documents: { table }, visitor }) => {
    const form: Form = await api.defineForm(table, {
      name: 'Document intake',
      fields: [{ column: 'Title' }, { column: 'Attachment' }],
    });
    await api.publishForm(table.schema, form);
    publicForm = new PublicFormPage(visitor);
    field = new FileField(publicForm.field('Attachment'));
    uploadModal = new FileUploadModal(visitor);
    await publicForm.goto(form.token);
  });

  test('takes an upload, which the submission stores', async ({
    documents: { table, cover, notes },
  }) => {
    await field.uploadButton.click();
    await uploadModal.chooseFile(COVER);

    await uploadModal.expectClosed();
    await expect(field.thumbnail).toHaveAccessibleName(
      uploadedUri('cover.png', 'AnonymousUser'),
    );
    await publicForm.field('Title').fill('Signed contract');
    await publicForm.submitButton().click();
    await expect(publicForm.form).toContainText(
      'Thank you for submitting the form!',
    );
    expect(await storedAttachments(table)).toEqual([
      cover,
      notes,
      null,
      uploadedFile('cover.png', 'AnonymousUser'),
    ]);
  });

  test('shows the name and the MIME type of the uploaded file, but not its storage URI', async ({
    visitor,
  }) => {
    await field.uploadButton.click();
    await uploadModal.chooseFile(NOTES);
    await field.fileButton.click();

    const { details } = new FileDetailDropdown(visitor);
    await expect(details.labels).toHaveText(['Name', 'MIME type']);
    await expect(details.name).toHaveText('notes.txt');
    await expect(details.mimeType).toHaveText('text/plain');
  });

  test('downloads the uploaded file', async ({ visitor }) => {
    await field.uploadButton.click();
    await uploadModal.chooseFile(NOTES);
    await field.fileButton.click();
    const file = await downloadFrom(
      new FileDetailDropdown(visitor).downloadLink,
    );

    expect(file.name).toBe('notes.txt');
    expect(file.content.toString()).toBe(NOTES_TEXT);
  });

  test('Clear form empties the field', async () => {
    await field.uploadButton.click();
    await uploadModal.chooseFile(NOTES);
    await expect(field.fileButton).toBeVisible();
    await publicForm.clearButton.click();

    await expect(field.fileButton).toHaveCount(0);
    await expect(field.uploadButton).toBeVisible();
  });

  test(
    'refuses a file over 1 MiB without a message, which shows as the raw response when the window opens again',
    pinsKnownBug('upload-error-not-shown'),
    async () => {
      await field.uploadButton.click();
      await uploadModal.chooseFile({
        name: 'large.txt',
        mimeType: 'text/plain',
        buffer: Buffer.alloc(MEBIBYTE + 1, 'a'),
      });

      await uploadModal.expectClosed();
      await expect(field.fileButton).toHaveCount(0);
      await field.uploadButton.click();
      await expect(uploadModal.error).toContainText('Error uploading file');
      await expect(uploadModal.error).toContainText(
        '{"detail": "Max allowed file size is 1.0 MB"}',
      );
    },
  );

  test.fixme('refuses a file over 1 MiB and says why in the window', async () => {
    await field.uploadButton.click();
    await uploadModal.chooseFile({
      name: 'large.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(MEBIBYTE + 1, 'a'),
    });

    await uploadModal.expectOpen();
    await expect(uploadModal.error).toHaveText(
      /^Error uploading file\s*Max allowed file size is 1\.0 MB$/,
    );
  });
});
