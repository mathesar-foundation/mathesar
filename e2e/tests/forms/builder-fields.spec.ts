import {
  type FormDefinition,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { chooseOption } from '../../support/ui/components/select';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import { tableUrl } from '../../support/ui/urls';
import { BOOK_FIELD_LABELS, expect, labelsOf, test } from './fixtures';

test.describe('fields in the form builder', () => {
  let builder: FormBuilderPage;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
  });

  test('selects a field on click and shows where its values go', async ({
    page,
    library,
  }) => {
    const pages = await builder.field('Pages');
    await pages.select();

    await pages.expectSelected();
    await expect(builder.selection).toHaveCount(1);
    await expect(pages.source).toHaveText(/Books\s+Pages/);
    await expect(builder.inspector.path).toHaveText(['Form', 'Pages']);
    await expect(builder.inspector.label).toHaveValue('Pages');
    await expect(builder.inspector.name).toBeHidden();

    await builder.inspector.tableLink.click();
    await expect(page).toHaveURL(tableUrl(library.books));
  });

  test('goes back to the settings of the form on a click next to the form', async () => {
    const pages = await builder.field('Pages');
    await pages.select();
    await builder.clickEmptyCanvas();

    await pages.expectSelected(false);
    await expect(builder.selection).toHaveCount(0);
    await expect(builder.inspector.path).toHaveText(['Form']);
    await expect(builder.inspector.name).toHaveValue('Book intake');
  });

  test('selects the field that the keyboard focus moves into', async ({
    page,
  }) => {
    const title = await builder.field('Title');
    await builder.description.focus();
    await page.keyboard.press('Tab');

    await expect(title.label).toBeFocused();
    await title.expectSelected();
    await expect(builder.inspector.label).toHaveValue('Title');
  });

  test('renames a field on the canvas and in the inspector', async ({
    page,
  }) => {
    const pages = await builder.field('Pages');
    await pages.label.fill('Number of pages');
    await expect(builder.inspector.label).toHaveValue('Number of pages');
    await expect(pages.label).toBeFocused();

    await builder.inspector.label.fill('Page count');
    await expect(pages.label).toHaveValue('Page count');
    await expect(builder.inspector.label).toBeFocused();

    await builder.save();
    const renamed = ['Title', 'Page count', ...BOOK_FIELD_LABELS.slice(2)];
    expect(labelsOf((await savedForm())?.fields)).toEqual(renamed);
    await page.reload();
    await builder.expectFieldLabels(renamed);
  });

  test('keeps the caret where text is typed into a label', async ({ page }) => {
    const pages = await builder.field('Pages');
    await pages.label.click();
    await page.keyboard.press('Home');
    await page.keyboard.type('All ');

    await expect(pages.label).toHaveValue('All Pages');
    await expect(pages.label).toBeFocused();
    await expect(pages.label).toHaveJSProperty('selectionStart', 4);
  });

  test('puts the column name back when a label is left empty', async () => {
    const pages = await builder.field('Pages');
    await pages.label.fill('Page count');
    await pages.label.fill('');
    await expect(pages.label).toHaveValue('');
    await builder.title.click();

    await expect(pages.label).toHaveValue('Pages');
  });

  test('marks a field as required and as optional again', async () => {
    const pages = await builder.field('Pages');
    await pages.select();
    await expect(builder.inspector.required).not.toBeChecked();

    await builder.inspector.required.check();
    await expect(pages.requiredMark).toBeVisible();
    await builder.save();
    expect((await savedForm())?.fields[1]).toMatchObject({
      label: 'Pages',
      required: true,
    });

    await pages.select();
    await expect(builder.inspector.required).toBeChecked();
    await builder.inspector.required.uncheck();
    await expect(pages.requiredMark).toBeHidden();
    await builder.save();
    expect((await savedForm())?.fields[1]).toMatchObject({
      label: 'Pages',
      required: false,
    });
  });

  test('keeps a field required and in the form when its column does not allow NULL', async () => {
    const title = await builder.field('Title');
    await title.select();

    await expect(builder.inspector.required).toBeChecked();
    await expect(builder.inspector.required).toBeDisabled();
    await builder.inspector.requiredHelp.hover();
    await expect(builder.tooltip).toHaveText(
      'This setting cannot be modified since the underlying column does not allow NULL values',
    );

    await expect(title.removeButton).toBeDisabled();
    await title.removeButtonWrapper.hover();
    await expect(builder.tooltip).toHaveText(
      'This field cannot be removed since the underlying column is required and does not allow NULL values.',
    );

    await expect(builder.inspector.removeFieldButton).toBeDisabled();
    await builder.inspector.removeFieldButtonWrapper.hover();
    await expect(builder.tooltip).toHaveText(
      'This field cannot be removed since the underlying column is required and does not allow NULL values.',
    );
  });

  test('adds a help text to a field and removes it again', async () => {
    const pages = await builder.field('Pages');
    await pages.select();
    await expect(pages.helpText).toBeHidden();
    await expect(builder.inspector.helpText).toBeHidden();

    await builder.inspector.helpTextToggle.check();
    await expect(pages.helpText).toHaveValue('');
    await builder.inspector.helpText.fill('Count all');
    await expect(pages.helpText).toHaveValue('Count all');
    await pages.helpText.fill('Count all pages');
    await expect(builder.inspector.helpText).toHaveValue('Count all pages');
    await builder.save();
    expect((await savedForm())?.fields[1]?.help).toBe('Count all pages');

    await pages.select();
    await expect(builder.inspector.helpTextToggle).toBeChecked();
    await builder.inspector.helpTextToggle.uncheck();
    await expect(pages.helpText).toBeHidden();
    await builder.save();
    expect((await savedForm())?.fields[1]?.help).toBeNull();
  });

  test('shows a text field as a large text area', async () => {
    const notes = await builder.field('Notes');
    await notes.select();
    await expect(builder.inspector.size).toHaveText('Regular');
    await expect(notes.textArea).toBeHidden();

    await chooseOption(builder.inspector.size, 'Large');
    await expect(notes.textArea).toBeVisible();
    await builder.save();
    expect((await savedForm())?.fields[6]).toMatchObject({
      label: 'Notes',
      large: true,
    });
  });

  test('offers the size only for text fields', async () => {
    await (await builder.field('Pages')).select();
    await expect(builder.inspector.helpTextToggle).toBeVisible();
    await expect(builder.inspector.size).toBeHidden();
  });

  test('removes a field with the button next to its label', async () => {
    const pages = await builder.field('Pages');
    await pages.select();
    await pages.removeButton.click();

    const remaining = BOOK_FIELD_LABELS.filter((label) => label !== 'Pages');
    await builder.expectFieldLabels(remaining);
    await expect(builder.selection).toHaveCount(0);
    await expect(builder.inspector.name).toBeVisible();
    await builder.save();
    expect(labelsOf((await savedForm())?.fields)).toEqual(remaining);
  });

  test('removes the selected field from the inspector', async () => {
    await (await builder.field('Notes')).select();
    await builder.inspector.removeFieldButton.click();

    const remaining = BOOK_FIELD_LABELS.filter((label) => label !== 'Notes');
    await builder.expectFieldLabels(remaining);
    await expect(builder.inspector.path).toHaveText(['Form']);
    await builder.save();
    expect(labelsOf((await savedForm())?.fields)).toEqual(remaining);
  });

  test('adds a removed column back below the selected field', async () => {
    const pages = await builder.field('Pages');
    await pages.select();
    await pages.removeButton.click();
    const published = await builder.field('Published');
    await published.select();
    await published.addFieldButton.click();
    await expect(builder.addFieldMenu).toContainText('Books');
    await builder.columnItem('Pages').click();

    const reordered = [
      'Title',
      'Price',
      'In Stock',
      'Published',
      'Pages',
      'Author',
      'Notes',
    ];
    await expect(builder.addFieldMenu).toBeHidden();
    await builder.expectFieldLabels(reordered);
    await (await builder.field('Pages')).expectSelected();
    await expect(builder.inspector.label).toHaveValue('Pages');
    await builder.save();
    expect(labelsOf((await savedForm())?.fields)).toEqual(reordered);
  });

  test('explains in the menu why a column cannot be added', async () => {
    const title = await builder.field('Title');
    await title.select();
    await title.addFieldButton.click();

    await expect(builder.columnItems).toHaveText(['id', ...BOOK_FIELD_LABELS]);
    await expect(builder.columnItem('id')).toBeDisabled();
    await builder.columnItemHelp('id').hover();
    await expect(builder.tooltip).toHaveText(
      'This column cannot be added to the form because it has a primary key constraint and a dynamic default value.',
    );
    await expect(builder.columnItem('Title')).toBeDisabled();
    await builder.columnItemHelp('Title').hover();
    await expect(builder.tooltip).toHaveText(
      'This column has already been added to the form',
    );
  });

  test('moves a field up and down by its grip', async ({ page }) => {
    await builder.dragField(
      await builder.field('Published'),
      await builder.field('Pages'),
    );
    await builder.expectFieldLabels([
      'Title',
      'Published',
      'Pages',
      'Price',
      'In Stock',
      'Author',
      'Notes',
    ]);
    await (await builder.field('Published')).expectSelected();

    await builder.dragField(
      await builder.field('Title'),
      await builder.field('Price'),
    );
    const reordered = [
      'Published',
      'Pages',
      'Price',
      'Title',
      'In Stock',
      'Author',
      'Notes',
    ];
    await builder.expectFieldLabels(reordered);

    await builder.save();
    expect(labelsOf((await savedForm())?.fields)).toEqual(reordered);
    await page.reload();
    await builder.expectFieldLabels(reordered);
  });

  test('leaves a field that is dropped where it was in place', async () => {
    const price = await builder.field('Price');
    await builder.dragField(price, price);

    await price.expectSelected();
    await builder.expectFieldLabels(BOOK_FIELD_LABELS);
    await expect(builder.saveButton).toBeDisabled();
  });
});

test.describe('a form without fields in the builder', () => {
  test('adds the first field from the button in place of the fields', async ({
    page,
    api,
    schema,
    library,
  }) => {
    const builder = new FormBuilderPage(page);
    const form = await api.defineForm(library.books, {
      name: 'Empty',
      fields: [],
    });
    await builder.goto(schema, form.id);

    await builder.addFieldsButton.click();
    await expect(builder.columnItem('id')).toBeDisabled();
    await builder.columnItem('Title').click();

    await expect(builder.addFieldsButton).toBeHidden();
    await builder.expectFieldLabels(['Title']);
    await (await builder.field('Title')).expectSelected();
    await builder.save();
    expect((await api.findForm(schema, form.id))?.fields).toMatchObject([
      { label: 'Title', required: true },
    ]);
  });
});

test('explains in the menu why a user column cannot be added', async ({
  page,
  api,
  schema,
}) => {
  await runSqlInSchema(
    schema,
    `CREATE TABLE "Tickets" (
       id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
       "Subject" text,
       "Reporter" integer
     );`,
  );
  const tickets = await api.getTable(schema, 'Tickets');
  await api.makeUserColumn(tickets, 'Reporter');
  const form = await api.defineForm(tickets, {
    name: 'Support',
    fields: [{ column: 'Subject' }],
  });
  const builder = new FormBuilderPage(page);
  await builder.goto(schema, form.id);
  const subject = await builder.field('Subject');
  await subject.select();
  await subject.addFieldButton.click();

  await expect(builder.columnItem('Reporter')).toBeDisabled();
  await builder.columnItemHelp('Reporter').hover();
  await expect(builder.tooltip).toHaveText(
    'This column cannot be added to the form because user type fields require authentication and are not supported in forms.',
  );
});
