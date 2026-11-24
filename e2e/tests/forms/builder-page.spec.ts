import type { Locator } from '@playwright/test';

import { runSqlInSchema } from '../../support/api/mathesar';
import { failRpcMethod } from '../../support/rpc-failures';
import { recordRpcCalls } from '../../support/rpc-log';
import { openSelect } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { ErrorPage } from '../../support/ui/pages/error-page';
import {
  FormBuilderPage,
  formBuilderUrl,
} from '../../support/ui/pages/form-builder-page';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { schemaUrl } from '../../support/ui/urls';
import { BOOK_FIELD_LABELS, expect, storedBooks, test } from './fixtures';

async function openAndClose(select: Locator): Promise<void> {
  const options = await openSelect(select);
  await expect(options).toBeVisible();
  await select.click();
  await expect(options).toBeHidden();
}

test.describe('form builder page', () => {
  let builder: FormBuilderPage;

  test.beforeEach(({ page }) => {
    builder = new FormBuilderPage(page);
  });

  test('shows the form with its fields in order and nothing to save', async ({
    page,
    schema,
    bookForm,
  }) => {
    await builder.goto(schema, bookForm.id);

    await expect(page).toHaveTitle('Book intake | Mathesar');
    await expect(builder.heading).toHaveText('Book intake');
    await expect(builder.title).toHaveValue('Book intake');
    await expect(builder.description).toHaveValue('');
    await builder.expectFieldLabels(BOOK_FIELD_LABELS);
    await expect((await builder.field('Title')).requiredMark).toBeVisible();
    await expect((await builder.field('Pages')).requiredMark).toBeHidden();
    await expect(builder.submitButton('Submit')).toBeVisible();
    await expect(builder.clearButton).toBeVisible();
    await expect(builder.saveButton).toBeDisabled();
    await expect(builder.shareButton).toHaveText('Share');
    await expect(builder.selection).toHaveCount(0);
  });

  test('loads the form with one request per source', async ({
    page,
    schema,
    bookForm,
  }) => {
    const calls = recordRpcCalls(page);
    await builder.goto(schema, bookForm.id);
    await expect(builder.inspector.associatedRole).toBeVisible();
    await builder.expectFieldLabels(BOOK_FIELD_LABELS);

    expect([...calls].sort()).toEqual([
      'columns.list_with_metadata',
      'constraints.list',
      'forms.get_source_info',
      'forms.list',
      'roles.configured.list',
      'roles.get_current_role',
      'tables.get_with_metadata',
      'tables.list_joinable',
    ]);
  });

  test('changes nothing when fields are selected and selects are opened', async ({
    page,
    schema,
    bookForm,
  }) => {
    const calls = recordRpcCalls(page);
    await builder.goto(schema, bookForm.id);
    const author = await builder.field('Author');
    const notes = await builder.field('Notes');

    await author.select();
    await openAndClose(author.modeSelect);
    await openAndClose(builder.inspector.mode);
    await notes.select();
    await openAndClose(builder.inspector.size);
    await builder.clickEmptyCanvas();
    await openAndClose(builder.inspector.associatedRole);

    await expect(builder.saveButton).toBeDisabled();
    await expect(author.modeSelect).toBeHidden();
    await expect(builder.inspector.name).toHaveValue('Book intake');
    expect(calls.filter((method) => !/\.(list|get)\w*$/.test(method))).toEqual(
      [],
    );
  });

  test('shows the not-found page for a form that does not exist', async ({
    page,
    schema,
    bookForm,
  }) => {
    const errorPage = new ErrorPage(page);
    await page.goto(formBuilderUrl(schema, bookForm.id + 1_000_000));

    await expect(errorPage.heading).toBeVisible();
    await expect(errorPage.message).toBeVisible();
    await expect(errorPage.homeLink).toHaveAttribute('href', '/');
    await expect(builder.canvas).toHaveCount(0);
  });

  test('shows "Untitled" in the header of a form without a name', async ({
    page,
    api,
    schema,
    library,
  }) => {
    const form = await api.defineForm(library.books, {
      name: '',
      fields: [{ column: 'Title' }],
    });
    await builder.goto(schema, form.id);

    await expect(builder.heading).toHaveText('Untitled');
    await expect(builder.title).toHaveValue('');
    await expect(page).toHaveTitle('| Mathesar');
  });

  test('hides the inspector and remembers that after a reload', async ({
    page,
    schema,
    bookForm,
  }) => {
    await builder.goto(schema, bookForm.id);
    await expect(builder.inspector.root).toBeVisible();

    await builder.inspectorToggle.click();
    await expect(builder.inspector.root).toBeHidden();
    await expect(builder.title).toBeVisible();

    await page.reload();
    await expect(builder.title).toBeVisible();
    await expect(builder.inspector.root).toBeHidden();

    await builder.inspectorToggle.click();
    await expect(builder.inspector.name).toHaveValue('Book intake');
  });

  test('resizes the inspector up to its widest and keeps the width after a reload', async ({
    page,
    schema,
    bookForm,
  }) => {
    await builder.goto(schema, bookForm.id);
    await expect(builder.inspectorPanel).toHaveCSS('width', '350px');

    await builder.resizeInspector(-80);
    await expect(builder.inspectorPanel).toHaveCSS('width', '430px');
    await builder.resizeInspector(-400);
    await expect(builder.inspectorPanel).toHaveCSS('width', '600px');

    await page.reload();
    await expect(builder.inspector.name).toBeVisible();
    await expect(builder.inspectorPanel).toHaveCSS('width', '600px');
  });

  test('deletes the form after confirmation and keeps the submitted records', async ({
    page,
    api,
    schema,
    library,
    bookForm,
  }) => {
    const schemaPage = new SchemaPage(page);
    const deleteModal = builder.deleteModal('Book intake');
    await runSqlInSchema(
      schema,
      `INSERT INTO "Books" ("Title") VALUES ('Dune')`,
    );
    await builder.goto(schema, bookForm.id);

    await builder.inspector.deleteFormButton.click();
    await expect(deleteModal.body).toHaveText(
      'Are you sure you want to proceed?',
    );
    await deleteModal.button('Delete Form').click();

    await expect(page).toHaveURL(schemaUrl(schema));
    await expect(schemaPage.forms.section).toContainText('No Forms');
    await expect(schemaPage.forms.items).toHaveCount(0);
    expect(await api.listForms(schema)).toEqual([]);
    expect(await storedBooks(library)).toMatchObject([{ title: 'Dune' }]);
  });

  test('keeps the form when the deletion is cancelled', async ({
    page,
    api,
    schema,
    bookForm,
  }) => {
    const deleteModal = builder.deleteModal('Book intake');
    await builder.goto(schema, bookForm.id);
    await builder.inspector.deleteFormButton.click();
    await deleteModal.button('Cancel').click();

    await deleteModal.expectClosed();
    await expect(page).toHaveURL(formBuilderUrl(schema, bookForm.id));
    await expect(builder.title).toHaveValue('Book intake');
    expect(await api.listForms(schema)).toHaveLength(1);
  });

  test('reports a failed deletion and keeps the form', async ({
    page,
    api,
    schema,
    bookForm,
  }) => {
    const deleteModal = builder.deleteModal('Book intake');
    await failRpcMethod(page, 'forms.delete', 'The form is in use');
    await builder.goto(schema, bookForm.id);
    await builder.inspector.deleteFormButton.click();
    await deleteModal.button('Delete Form').click();

    await new Toasts(page).expectMessage(
      'Unable to delete Form. The form is in use',
    );
    await deleteModal.expectClosed();
    await expect(page).toHaveURL(formBuilderUrl(schema, bookForm.id));
    expect(await api.listForms(schema)).toHaveLength(1);
  });
});
