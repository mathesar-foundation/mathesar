import {
  type Form,
  type FormDefinition,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { recordRpcCalls } from '../../support/rpc-log';
import { chooseColumn } from '../../support/ui/components/column-options';
import { menuItem } from '../../support/ui/components/menu';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import {
  type CanvasField,
  FormBuilderPage,
} from '../../support/ui/pages/form-builder-page';
import { PublicFormPage } from '../../support/ui/pages/public-form-page';
import {
  AUTHOR_NAMES,
  bookFields,
  expect,
  storedBooks,
  test,
} from './fixtures';

const NEW_AUTHOR_FIELDS = [
  { label: 'Name', required: true, rule: null, fields: [] },
  { label: 'Country', required: false, rule: null, fields: [] },
];

test.describe('foreign key field that can only choose a record', () => {
  let builder: FormBuilderPage;
  let author: CanvasField;
  let savedAuthorField: () => Promise<
    FormDefinition['fields'][number] | undefined
  >;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    savedAuthorField = async () =>
      (await api.findForm(schema, bookForm.id))?.fields[5];
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
    author = await builder.field('Author');
    await author.select();
  });

  test('offers three ways to fill the field and starts with existing records only', async () => {
    await expect(author.modeSelect).toHaveText('Can only choose');
    await expect(builder.inspector.mode).toHaveText('Can only choose');
    await expect(author.nestedFields).toHaveCount(0);
    await expect(author.recordInput).toBeVisible();

    const options = await openSelect(author.modeSelect);
    await expect(options.getByRole('option')).toHaveText([
      'Can only choose Users can only select an existing record from the related table.',
      "Can choose or create new Users can select records and are allowed to create a new record if the record they're searching for is not present in the related table.",
      'Must create new Users must always create a new record in the related table.',
    ]);
  });

  test('previews the list of records without changing the form', async ({
    page,
  }) => {
    const calls = recordRpcCalls(page);
    await author.recordInput.click();
    await expect(builder.rowSeeker.search).toBeFocused();
    await expect(builder.rowSeeker.options).toHaveText(AUTHOR_NAMES);
    await expect(builder.rowSeeker.addNewRecordButton).toBeHidden();

    await builder.rowSeeker.option('Stanislaw Lem').click();
    await expect(author.recordInput).toHaveText('Stanislaw Lem');
    await expect(builder.saveButton).toBeDisabled();
    expect(calls).toContain('records.list_summaries');
    expect(calls.filter((method) => method.startsWith('forms.'))).toEqual([]);
  });

  test('adds the fields of the linked table when a new record may be created', async ({
    page,
  }) => {
    await chooseOption(author.modeSelect, /^Can choose or create new/);

    await expect(builder.inspector.mode).toHaveText('Can choose or create new');
    await author.expectNestedFieldLabels(['Name', 'Country']);
    await expect((await author.nestedField('Name')).requiredMark).toBeVisible();
    await expect(author.nestedFieldsHelp).toHaveText(
      "The following fields from Authors appear only when the user can't find a matching record and chooses to add a new one.",
    );
    await expect(author.recordInput).toBeVisible();
    await author.expectSelected();

    await builder.save();
    expect(await savedAuthorField()).toMatchObject({
      rule: 'can_pick_or_create',
      fields: NEW_AUTHOR_FIELDS,
    });
    await page.reload();
    await (
      await builder.field('Author')
    ).expectNestedFieldLabels(['Name', 'Country']);
  });

  test('replaces the record input with the fields of the linked table when a new record must be created', async () => {
    await chooseOption(builder.inspector.mode, /^Must create new/);

    await expect(author.modeSelect).toHaveText('Must create new');
    await author.expectNestedFieldLabels(['Name', 'Country']);
    await expect(author.recordInput).toBeHidden();
    await expect(author.nestedFieldsHelp).toBeHidden();
    await expect(builder.inspector.recordSummaryToggle).toBeHidden();

    await builder.save();
    expect(await savedAuthorField()).toMatchObject({
      rule: 'must_create',
      fields: NEW_AUTHOR_FIELDS,
    });
  });

  test('opens the record summary settings of the linked table', async () => {
    await builder.inspector.recordSummaryToggle.click();
    await expect(builder.inspector.root).toContainText(
      'Configure Authors record summaries here.',
    );
    await expect(builder.saveButton).toBeDisabled();
  });

  test('saves the record summary of the linked table without changing the form', async ({
    page,
    api,
    library,
  }) => {
    const { recordSummary } = builder.inspector;
    const calls = recordRpcCalls(page);
    await builder.inspector.recordSummaryToggle.click();
    await recordSummary.customizeFields.check();
    await recordSummary.addFieldButton.click();
    await menuItem(page, 'Column').click();
    await chooseColumn(recordSummary.part(1).columnSelects.first(), 'Country');
    await recordSummary.saveButton.click();

    await expect(recordSummary.saveButton).toHaveCount(0);
    const { Name, Country } = library.authors.columns;
    expect(await api.recordSummaryTemplate(library.authors)).toEqual([
      [Name],
      [Country],
    ]);
    await author.recordInput.click();
    await expect(builder.rowSeeker.options).toHaveText([
      'Octavia ButlerUSA',
      'Stanislaw LemPoland',
      'Ursula Le GuinUSA',
    ]);
    await expect(builder.saveButton).toBeDisabled();
    expect(calls.filter((method) => method.startsWith('forms.'))).toEqual([]);
  });
});

test.describe('foreign key field that can create a record', () => {
  let builder: FormBuilderPage;
  let form: Form;
  let author: CanvasField;
  let savedAuthorField: () => Promise<
    FormDefinition['fields'][number] | undefined
  >;

  test.beforeEach(async ({ page, api, schema, library }) => {
    form = await api.defineForm(library.books, {
      name: 'Book intake',
      fields: bookFields(library, 'can_pick_or_create'),
    });
    savedAuthorField = async () =>
      (await api.findForm(schema, form.id))?.fields[5];
    builder = new FormBuilderPage(page);
    await builder.goto(schema, form.id);
    author = await builder.field('Author');
  });

  test('drops the nested fields when only existing records can be chosen', async () => {
    await author.expectNestedFieldLabels(['Name', 'Country']);
    await author.select();
    await chooseOption(author.modeSelect, /^Can only choose/);

    await expect(author.nestedFields).toHaveCount(0);
    await expect(author.nestedFieldsHelp).toBeHidden();
    await builder.save();
    expect(await savedAuthorField()).toMatchObject({
      rule: 'must_pick',
      fields: [],
    });
  });

  test('brings the edited nested fields back when new records are allowed again', async () => {
    await (await author.nestedField('Country')).label.fill('Home country');
    await author.select();
    await chooseOption(author.modeSelect, /^Can only choose/);
    await expect(author.nestedFields).toHaveCount(0);

    await chooseOption(author.modeSelect, /^Must create new/);
    await author.expectNestedFieldLabels(['Name', 'Home country']);
  });

  test('shows the way from the form to a selected nested field and follows it', async () => {
    const country = await author.nestedField('Country');
    await country.select();

    await country.expectSelected();
    await author.expectChildSelected();
    await expect(country.source).toHaveText(/Authors\s+Country/);
    await expect(builder.inspector.path).toHaveText([
      'Form',
      'Author',
      'Country',
    ]);
    await expect(builder.inspector.tableLink).toHaveText('Authors');

    await builder.inspector.pathButton('Author').click();
    await author.expectSelected();
    await expect(builder.inspector.mode).toBeVisible();

    await builder.inspector.pathButton('Form').click();
    await expect(builder.selection).toHaveCount(0);
    await expect(builder.inspector.name).toBeVisible();
  });

  test('selects the parent field when a nested field is removed', async () => {
    await (await author.nestedField('Country')).select();
    await builder.inspector.removeFieldButton.click();

    await author.expectNestedFieldLabels(['Name']);
    await author.expectSelected();
    await builder.save();
    expect(await savedAuthorField()).toMatchObject({
      fields: [{ label: 'Name' }],
    });
  });

  test('adds a column of the linked table as a nested field', async () => {
    const country = await author.nestedField('Country');
    await country.select();
    await country.removeButton.click();
    const name = await author.nestedField('Name');
    await name.select();
    await name.addFieldButton.click();

    await expect(builder.addFieldMenu).toContainText('Authors');
    await expect(builder.columnItems).toHaveText(['id', 'Name', 'Country']);
    await expect(builder.columnItem('Name')).toBeDisabled();
    await builder.columnItem('Country').click();

    await author.expectNestedFieldLabels(['Name', 'Country']);
    await (await author.nestedField('Country')).expectSelected();
  });

  test('reorders nested fields by their grip', async () => {
    await builder.dragField(
      await author.nestedField('Country'),
      await author.nestedField('Name'),
    );

    await author.expectNestedFieldLabels(['Country', 'Name']);
    await builder.save();
    expect(await savedAuthorField()).toMatchObject({
      fields: [{ label: 'Country' }, { label: 'Name' }],
    });
  });
});

test('adds a foreign key column from the menu as a field that picks a record, which a visitor fills', async ({
  page,
  api,
  schema,
  library,
  visitor,
}) => {
  const form = await api.defineForm(library.books, {
    name: 'Book intake',
    fields: [{ column: 'Title' }],
  });
  const builder = new FormBuilderPage(page);
  await builder.goto(schema, form.id);
  const title = await builder.field('Title');
  await title.select();
  await title.addFieldButton.click();
  await builder.columnItem('Author').click();

  const author = await builder.field('Author');
  await author.expectSelected();
  await expect(author.modeSelect).toHaveText('Can only choose');
  await expect(author.recordInput).toBeVisible();
  await expect(author.nestedFields).toHaveCount(0);
  await builder.save();
  expect((await api.findForm(schema, form.id))?.fields).toMatchObject([
    { label: 'Title' },
    { label: 'Author', required: false, rule: 'must_pick', fields: [] },
  ]);

  await api.publishForm(schema, form);
  const publicForm = new PublicFormPage(visitor);
  await publicForm.goto(form.token);
  await publicForm.field('Title').fill('Solaris');
  await publicForm.pickRecord('Author', 'Stanislaw Lem');
  await publicForm.submitButton().click();
  await expect(publicForm.submitAnotherButton).toBeVisible();
  expect(await storedBooks(library)).toMatchObject([
    { title: 'Solaris', author: 'Stanislaw Lem' },
  ]);
});

test('shows "..." in the inspector path for the field above the parent of a nested field, and selects that field on click', async ({
  page,
  api,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    `CREATE TABLE "Loans" (
       id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
       "Borrower" text,
       "Book" integer REFERENCES "Books" (id)
     );`,
  );
  const form = await api.defineForm(await api.getTable(schema, 'Loans'), {
    name: 'Loan intake',
    fields: [
      { column: 'Borrower' },
      {
        column: 'Book',
        link: {
          table: library.books,
          rule: 'can_pick_or_create',
          fields: [
            { column: 'Title' },
            {
              column: 'Author',
              link: {
                table: library.authors,
                rule: 'must_create',
                fields: [{ column: 'Name' }, { column: 'Country' }],
              },
            },
          ],
        },
      },
    ],
  });
  const builder = new FormBuilderPage(page);
  await builder.goto(schema, form.id);
  const book = await builder.field('Book');
  const author = await book.nestedField('Author');
  await (await author.nestedField('Country')).select();

  await expect(builder.inspector.path).toHaveText([
    'Form',
    '',
    'Author',
    'Country',
  ]);
  await builder.inspector.hiddenFieldsButton.click();

  await book.expectSelected();
  await expect(builder.inspector.path).toHaveText(['Form', 'Book']);
  await expect(builder.inspector.mode).toHaveText('Can choose or create new');
});
