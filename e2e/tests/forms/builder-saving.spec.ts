import type { FormDefinition } from '../../support/api/mathesar';
import { runSqlInSchema } from '../../support/api/mathesar';
import { failRpcMethod } from '../../support/rpc-failures';
import { recordRpcCalls } from '../../support/rpc-log';
import { Toasts } from '../../support/ui/components/toast';
import {
  type CanvasField,
  FormBuilderPage,
} from '../../support/ui/pages/form-builder-page';
import { BOOK_FIELD_LABELS, expect, labelsOf, test } from './fixtures';

test.describe('saving a form in the builder', () => {
  let builder: FormBuilderPage;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
  });

  test('saves nothing until Save is clicked and a reload discards the changes', async ({
    page,
  }) => {
    await builder.title.fill('Unsaved name');
    const calls = recordRpcCalls(page);
    await (await builder.field('Pages')).label.fill('Page count');
    await expect(builder.saveButton).toBeEnabled();
    await builder.saveButton.hover();
    await expect(builder.tooltip).toHaveText('Click to save');

    await page.reload();
    await expect(builder.title).toHaveValue('Book intake');
    await builder.expectFieldLabels(BOOK_FIELD_LABELS);
    await expect(builder.saveButton).toBeDisabled();
    expect(calls).not.toContain('forms.patch');
    expect((await savedForm())?.name).toBe('Book intake');
  });

  test('saves all changes with one request and starts again from the saved form', async ({
    page,
  }) => {
    await builder.title.fill('Book donations');
    const calls = recordRpcCalls(page);
    await (await builder.field('Pages')).select();
    await builder.inspector.required.check();
    await (await builder.field('Notes')).label.fill('Remarks');
    await builder.save();

    expect(calls.filter((method) => method.startsWith('forms.'))).toEqual([
      'forms.patch',
      'forms.get_source_info',
    ]);
    await expect(builder.selection).toHaveCount(0);
    await expect(builder.inspector.name).toHaveValue('Book donations');
    await expect(builder.heading).toHaveText('Book donations');
    const saved = await savedForm();
    expect(saved?.name).toBe('Book donations');
    expect(saved?.fields[1]).toMatchObject({ label: 'Pages', required: true });
    expect(saved?.fields[6]?.label).toBe('Remarks');
  });

  test('reports a failed save and keeps the changes', async ({ page }) => {
    await failRpcMethod(page, 'forms.patch', 'The server is down');
    await builder.title.fill('Book donations');
    await builder.saveButton.click();

    await new Toasts(page).expectMessage('The server is down');
    await expect(builder.title).toHaveValue('Book donations');
    await expect(builder.saveButton).toBeEnabled();
    expect((await savedForm())?.name).toBe('Book intake');
  });
});

test.describe('a field whose column was dropped', () => {
  const LABELS_WITHOUT_NOTES = BOOK_FIELD_LABELS.slice(0, -1);
  let builder: FormBuilderPage;
  let notes: CanvasField;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    await runSqlInSchema(schema, 'ALTER TABLE "Books" DROP COLUMN "Notes"');
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
    notes = await builder.field('Notes');
  });

  test('says that the column is gone and removes the field on request', async () => {
    await expect(notes.root).toContainText(
      'The column associated with this field is no longer present.',
    );
    await expect(builder.saveButton).toBeDisabled();
    await notes.select();
    await expect(builder.inspector.label).toHaveValue('Notes');
    await expect(builder.inspector.label).toBeDisabled();

    await notes.removeBrokenFieldButton.click();
    await builder.expectFieldLabels(LABELS_WITHOUT_NOTES);
    await builder.save();
    expect(labelsOf((await savedForm())?.fields)).toEqual(LABELS_WITHOUT_NOTES);
  });

  test('removes the field when a save of other changes is confirmed', async () => {
    const { brokenFieldsModal } = builder;
    await builder.title.fill('Book donations');
    await builder.saveButton.click();
    await expect(brokenFieldsModal.body).toContainText(
      'The form contains field(s) with errors. Proceeding will auto-remove those fields from the form.',
    );
    await expect(brokenFieldsModal.body).toContainText(
      'Are you sure you want to proceed?',
    );
    await brokenFieldsModal.button('Save').click();

    await brokenFieldsModal.expectClosed();
    await builder.expectFieldLabels(LABELS_WITHOUT_NOTES);
    await expect(builder.saveButton).toBeDisabled();
    const saved = await savedForm();
    expect(saved?.name).toBe('Book donations');
    expect(labelsOf(saved?.fields)).toEqual(LABELS_WITHOUT_NOTES);
  });

  test('saves nothing when the removal of the field is cancelled', async () => {
    const { brokenFieldsModal } = builder;
    await builder.title.fill('Book donations');
    await builder.saveButton.click();
    await brokenFieldsModal.button('Cancel').click();

    await brokenFieldsModal.expectClosed();
    await expect(builder.title).toHaveValue('Book donations');
    await expect(builder.saveButton).toBeEnabled();
    await expect(notes.root).toContainText('no longer present');
    expect((await savedForm())?.name).toBe('Book intake');
  });
});
