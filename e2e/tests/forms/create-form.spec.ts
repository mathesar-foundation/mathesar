import {
  type FormDefinition,
  type MathesarApi,
  type Schema,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { chooseOption } from '../../support/ui/components/select';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { schemaUrl } from '../../support/ui/urls';
import {
  BOOK_FIELD_LABELS,
  expect,
  grantReading,
  labelsOf,
  test,
} from './fixtures';

async function storedFormNamed(
  api: MathesarApi,
  schema: Schema,
  name: string,
): Promise<FormDefinition | undefined> {
  const forms = await api.listForms(schema);
  const form = forms.find((candidate) => candidate.name === name);
  return form && api.findForm(schema, form.id);
}

test.describe('new form on the schema page', () => {
  let schemaPage: SchemaPage;

  test.beforeEach(async ({ page, library }) => {
    schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.books.schema);
    await schemaPage.newFormButton.click();
  });

  test('creates a form for a table and lists it without leaving the page', async ({
    page,
    api,
    schema,
    library,
  }) => {
    const { newFormModal, forms } = schemaPage;
    await expect(forms.section).toContainText('No Forms');
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.name.fill('Book intake');
    await newFormModal.description.fill('Tell us about a book');
    await newFormModal.button('Save').click();

    await newFormModal.expectClosed();
    await expect(forms.item('Book intake')).toContainText('For Books');
    await expect(forms.section).not.toContainText('No Forms');
    await expect(page).toHaveURL(schemaUrl(schema));
    expect(await storedFormNamed(api, schema, 'Book intake')).toMatchObject({
      description: 'Tell us about a book',
      baseTableOid: library.books.oid,
      isPublic: false,
    });
  });

  test('gives the form a field for every column that a visitor can fill', async ({
    api,
    schema,
    library,
  }) => {
    const { newFormModal } = schemaPage;
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.name.fill('Book intake');
    await newFormModal.button('Save').click();
    await newFormModal.expectClosed();

    const form = await storedFormNamed(api, schema, 'Book intake');
    expect(labelsOf(form?.fields)).toEqual(BOOK_FIELD_LABELS);
    expect(form?.fields).toContainEqual({
      label: 'Author',
      help: null,
      required: false,
      columnAttnum: library.books.columns.Author,
      large: false,
      rule: 'must_pick',
      fields: [],
    });
  });

  test('names the form after its table when the name is left empty', async ({
    api,
    schema,
    library,
  }) => {
    const { newFormModal, forms } = schemaPage;
    await expect(newFormModal.name).toHaveAttribute('placeholder', '');
    await chooseOption(newFormModal.baseTable, 'Authors');
    await expect(newFormModal.name).toHaveAttribute(
      'placeholder',
      'Authors Form',
    );
    await newFormModal.button('Save').click();

    await expect(forms.item('Authors Form')).toContainText('For Authors');
    expect(await storedFormNamed(api, schema, 'Authors Form')).toMatchObject({
      baseTableOid: library.authors.oid,
    });
  });

  test('requires a base table', async () => {
    const { newFormModal } = schemaPage;
    await expect(newFormModal.baseTable).toBeFocused();
    await expect(newFormModal.baseTable).toHaveText('Select Table');
    await newFormModal.name.fill('No table');
    await expect(newFormModal.button('Save')).toBeDisabled();

    await chooseOption(newFormModal.baseTable, 'Books');
    await expect(newFormModal.button('Save')).toBeEnabled();
  });

  test('cancelling adds no form and empties the modal', async ({
    api,
    schema,
  }) => {
    const { newFormModal, forms } = schemaPage;
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.name.fill('Abandoned');
    await newFormModal.button('Cancel').click();

    await newFormModal.expectClosed();
    await expect(forms.section).toContainText('No Forms');
    expect(await api.listForms(schema)).toEqual([]);

    await schemaPage.newFormButton.click();
    await expect(newFormModal.name).toHaveValue('');
    await expect(newFormModal.baseTable).toHaveText('Select Table');
  });

  test('creates no form on Enter in the name', async ({ api, schema }) => {
    const { newFormModal } = schemaPage;
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.name.fill('Book intake');
    await newFormModal.name.press('Enter');
    await newFormModal.expectOpen();
    await newFormModal.button('Save').click();

    await newFormModal.expectClosed();
    expect(await api.listForms(schema)).toMatchObject([
      { name: 'Book intake' },
    ]);
  });

  test('stays open on Escape', async ({ page, api, schema }) => {
    const { newFormModal } = schemaPage;
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.name.fill('Book intake');
    await page.keyboard.press('Escape');
    await newFormModal.expectOpen();
    await newFormModal.button('Save').click();

    await newFormModal.expectClosed();
    expect(await api.listForms(schema)).toMatchObject([
      { name: 'Book intake' },
    ]);
  });

  test('opens the builder of the new form from the list', async ({ page }) => {
    const { newFormModal, forms } = schemaPage;
    const builder = new FormBuilderPage(page);
    await chooseOption(newFormModal.baseTable, 'Books');
    await newFormModal.button('Save').click();
    await forms.link('Books Form').click();

    await expect(page).toHaveURL(/\/forms\/\d+\/$/);
    await expect(builder.heading).toHaveText('Books Form');
    await expect(builder.title).toHaveValue('Books Form');
    await builder.expectFieldLabels(BOOK_FIELD_LABELS);
  });
});

test('gives a form that a standard user creates the role of that user', async ({
  api,
  schema,
  library,
  collaborator,
  signInAs,
}) => {
  await grantReading(library, collaborator.role.name);
  const schemaPage = new SchemaPage(await signInAs(collaborator.user));
  await schemaPage.goto(schema);
  await schemaPage.newFormButton.click();
  await chooseOption(schemaPage.newFormModal.baseTable, 'Books');
  await schemaPage.newFormModal.button('Save').click();

  await expect(schemaPage.forms.item('Books Form')).toBeVisible();
  expect(await storedFormNamed(api, schema, 'Books Form')).toMatchObject({
    associatedRoleId: collaborator.role.id,
  });
});

test.describe('columns that a new form leaves out', () => {
  let schemaPage: SchemaPage;

  test.beforeEach(async ({ page, api, schema }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Tickets" (
         id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
         "Subject" text,
         "Opened" date DEFAULT now(),
         "Priority" integer DEFAULT 3,
         "Reporter" integer,
         "Editor" integer
       );`,
    );
    const tickets = await api.getTable(schema, 'Tickets');
    await api.makeUserColumn(tickets, 'Editor');
    await api.trackEditingUserIn(tickets, 'Editor');
    schemaPage = new SchemaPage(page);
  });

  async function createTicketsForm(schema: Schema): Promise<void> {
    await schemaPage.goto(schema);
    await schemaPage.newFormButton.click();
    await chooseOption(schemaPage.newFormModal.baseTable, 'Tickets');
    await schemaPage.newFormModal.button('Save').click();
    await schemaPage.newFormModal.expectClosed();
  }

  test('leaves out the primary key, dynamic defaults and the column that tracks the editing user', async ({
    api,
    schema,
  }) => {
    await createTicketsForm(schema);
    const form = await storedFormNamed(api, schema, 'Tickets Form');
    expect(labelsOf(form?.fields)).toEqual(['Subject', 'Priority', 'Reporter']);
  });

  test(
    'adds a field for a user column, which the builder then rejects',
    pinsKnownBug('form-create-includes-user-column'),
    async ({ page, api, schema }) => {
      const builder = new FormBuilderPage(page);
      await api.makeUserColumn(
        await api.getTable(schema, 'Tickets'),
        'Reporter',
      );
      await createTicketsForm(schema);

      const form = await storedFormNamed(api, schema, 'Tickets Form');
      expect(labelsOf(form?.fields)).toEqual([
        'Subject',
        'Priority',
        'Reporter',
      ]);
      await schemaPage.forms.link('Tickets Form').click();
      const reporter = await builder.field('Reporter');
      await expect(reporter.root).toContainText(
        'This column cannot be included in the form because user type fields require authentication and are not supported in forms. Please remove this field from the form.',
      );
    },
  );

  test.fixme('leaves out every user column', async ({ api, schema }) => {
    await api.makeUserColumn(await api.getTable(schema, 'Tickets'), 'Reporter');
    await createTicketsForm(schema);
    const form = await storedFormNamed(api, schema, 'Tickets Form');
    expect(labelsOf(form?.fields)).toEqual(['Subject', 'Priority']);
  });
});
