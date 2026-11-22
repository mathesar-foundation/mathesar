import { runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { PublicFormPage } from '../../support/ui/pages/public-form-page';
import {
  AUTHOR_NAMES,
  bookFields,
  expect,
  storedAuthors,
  storedBooks,
  test,
} from './fixtures';

test.describe('a foreign key field that picks an existing record', () => {
  let publicForm: PublicFormPage;

  test.beforeEach(async ({ api, schema, bookForm, visitor }) => {
    await api.publishForm(schema, bookForm);
    publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
  });

  test('lists the records of the linked table and picks one with the mouse', async () => {
    const { rowSeeker } = publicForm;
    const author = publicForm.field('Author');
    await author.click();
    await expect(rowSeeker.search).toBeFocused();
    await expect
      .poll(() => rowSeeker.offsetFrom(author))
      .toEqual({ x: expect.closeTo(0, -1), y: expect.closeTo(0, -1) });
    await expect(rowSeeker.search).toHaveAttribute('placeholder', 'search');
    await expect(rowSeeker.options).toHaveText(AUTHOR_NAMES);
    await expect(rowSeeker.addNewRecordButton).toBeHidden();

    await rowSeeker.option('Stanislaw Lem').click();
    await expect(rowSeeker.root).toBeHidden();
    await expect(author).toHaveText('Stanislaw Lem');
    await expect(author).toBeFocused();
  });

  test('picks a record with the arrow keys and Enter', async () => {
    const { rowSeeker } = publicForm;
    const author = publicForm.field('Author');
    await author.click();
    await expect(rowSeeker.options).toHaveCount(3);
    await rowSeeker.search.press('ArrowDown');
    await rowSeeker.search.press('ArrowDown');
    await rowSeeker.search.press('Enter');

    await expect(rowSeeker.root).toBeHidden();
    await expect(author).toHaveText('Stanislaw Lem');
  });

  test('searches the records with one request per keystroke', async ({
    visitor,
  }) => {
    const { rowSeeker } = publicForm;
    await publicForm.field('Author').click();
    await expect(rowSeeker.options).toHaveCount(3);
    const calls = recordRpcCalls(visitor);
    await rowSeeker.search.pressSequentially('lem');

    await expect(rowSeeker.options).toHaveText(['Stanislaw Lem']);
    expect(calls).toEqual(Array(3).fill('forms.list_related_records'));
  });

  test('says that no record matches the search', async () => {
    const { rowSeeker } = publicForm;
    await publicForm.field('Author').click();
    await rowSeeker.search.fill('Tolkien');

    await expect(rowSeeker.emptyMessage).toBeVisible();
    await expect(rowSeeker.options).toHaveCount(0);
  });

  test('lists 200 records per page and picks one from the next page, with the search still focused', async ({
    schema,
    library,
  }) => {
    await runSqlInSchema(
      schema,
      `INSERT INTO "Authors" ("Name")
         SELECT 'Author ' || lpad(n::text, 3, '0') FROM generate_series(1, 247) AS n;`,
    );
    const { rowSeeker } = publicForm;
    await publicForm.field('Title').fill('Solaris');
    await publicForm.field('Author').click();
    await expect(rowSeeker.options).toHaveCount(200);
    await expect(rowSeeker.options.last()).toHaveText('Author 200');
    await expect(rowSeeker.currentPage).toHaveText('Page 1');

    await rowSeeker.nextPageButton.click();
    await expect(rowSeeker.currentPage).toHaveText('Page 2');
    await expect(rowSeeker.options).toHaveCount(50);
    await expect(rowSeeker.options.first()).toHaveText('Author 201');
    await expect(rowSeeker.nextPageButton).toHaveCount(0);
    await expect(rowSeeker.search).toBeFocused();
    await rowSeeker.option('Stanislaw Lem').click();
    await publicForm.submitButton().click();

    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([
      { title: 'Solaris', author: 'Stanislaw Lem' },
    ]);
  });

  test('closes the list on Escape and keeps the picked record', async () => {
    const { rowSeeker } = publicForm;
    const author = publicForm.field('Author');
    await publicForm.pickRecord('Author', 'Stanislaw Lem');
    await author.click();
    await expect(rowSeeker.search).toBeFocused();
    await rowSeeker.search.press('Escape');

    await expect(rowSeeker.root).toBeHidden();
    await expect(author).toHaveText('Stanislaw Lem');
  });

  test('clears the picked record', async ({ library }) => {
    const author = publicForm.field('Author');
    await publicForm.pickRecord('Author', 'Stanislaw Lem');
    await publicForm.clearValueButton('Author').click();

    await expect(author).toHaveText('');
    await expect(publicForm.clearValueButton('Author')).toBeHidden();
    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton().click();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([
      { title: 'Dune', author: null },
    ]);
  });
});

test.describe('a required foreign key field that may create a record', () => {
  let publicForm: PublicFormPage;

  test.beforeEach(async ({ api, schema, library, visitor }) => {
    const form = await api.defineForm(library.books, {
      name: 'Book intake',
      fields: [
        { column: 'Title' },
        {
          column: 'Author',
          required: true,
          link: {
            table: library.authors,
            rule: 'can_pick_or_create',
            fields: [{ column: 'Name' }, { column: 'Country' }],
          },
        },
      ],
    });
    await api.publishForm(schema, form);
    publicForm = new PublicFormPage(visitor);
    await publicForm.goto(form.token);
    await publicForm.field('Title').fill('White Teeth');
  });

  test('creates the linked record from the fields that "Add New Record" shows', async ({
    library,
  }) => {
    const { rowSeeker } = publicForm;
    await expect(publicForm.field('Name')).toHaveCount(0);
    await expect(publicForm.submitButton()).toBeDisabled();
    await publicForm.field('Author').click();
    await rowSeeker.search.fill('Zadie');
    await expect(rowSeeker.emptyMessage).toBeVisible();
    await rowSeeker.addNewRecordButton.click();

    await expect(publicForm.field('Author')).toHaveText('Adding New Record');
    await expect(publicForm.field('Name')).toHaveValue('');
    await expect(publicForm.requiredMark('Name')).toBeVisible();
    await expect(publicForm.submitButton()).toBeDisabled();
    await publicForm.field('Name').fill('Zadie Smith');
    await publicForm.field('Country').fill('UK');
    await publicForm.submitButton().click();

    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedAuthors(library)).toContainEqual({
      name: 'Zadie Smith',
      country: 'UK',
    });
    expect(await storedBooks(library)).toMatchObject([
      { title: 'White Teeth', author: 'Zadie Smith' },
    ]);
  });

  test('goes back to picking when a record is chosen after "Add New Record"', async ({
    library,
  }) => {
    const { rowSeeker } = publicForm;
    const author = publicForm.field('Author');
    await author.click();
    await expect(rowSeeker.options).toHaveCount(AUTHOR_NAMES.length);
    await rowSeeker.addNewRecordButton.click();
    await publicForm.field('Name').fill('Zadie Smith');
    await publicForm.pickRecord('Author', 'Ursula Le Guin');

    await expect(author).toHaveText('Ursula Le Guin');
    await expect(publicForm.field('Name')).toHaveCount(0);
    await publicForm.submitButton().click();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedAuthors(library)).toHaveLength(AUTHOR_NAMES.length);
    expect(await storedBooks(library)).toMatchObject([
      { author: 'Ursula Le Guin' },
    ]);
  });

  test('keeps adding a new record after "Submit another response"', async () => {
    const { rowSeeker } = publicForm;
    await publicForm.field('Author').click();
    await expect(rowSeeker.options).toHaveCount(AUTHOR_NAMES.length);
    await rowSeeker.addNewRecordButton.click();
    await publicForm.field('Name').fill('Zadie Smith');
    await publicForm.submitButton().click();
    await publicForm.submitAnotherButton.click();

    await expect(publicForm.field('Author')).toHaveText('Adding New Record');
    await expect(publicForm.field('Name')).toHaveValue('');
  });
});

test.describe('"Add New Record" before the records have loaded', () => {
  let publicForm: PublicFormPage;
  let releaseRecords: () => void;

  test.beforeEach(async ({ api, schema, library, visitor }) => {
    const form = await api.defineForm(library.books, {
      name: 'Book intake',
      fields: bookFields(library, 'can_pick_or_create'),
    });
    await api.publishForm(schema, form);
    publicForm = new PublicFormPage(visitor);
    await publicForm.goto(form.token);
    releaseRecords = await holdRpcCalls(visitor, 'forms.list_related_records');
    await publicForm.field('Author').click();
    await publicForm.rowSeeker.addNewRecordButton.click();
  });

  test(
    'switches to a new record and leaves the list open',
    pinsKnownBug('form-add-new-record-before-load-keeps-list-open'),
    async () => {
      const { rowSeeker } = publicForm;
      await expect(publicForm.field('Author')).toHaveText('Adding New Record');
      releaseRecords();
      await expect(rowSeeker.options).toHaveCount(AUTHOR_NAMES.length);
      await expectStaysOpen(rowSeeker.root);
    },
  );

  test.fixme('switches to a new record and closes the list', async () => {
    releaseRecords();
    await expect(publicForm.field('Author')).toHaveText('Adding New Record');
    await expect(publicForm.rowSeeker.root).toBeHidden();
  });
});

test('creates the linked record of a field that must create one', async ({
  api,
  schema,
  library,
  visitor,
}) => {
  const publicForm = new PublicFormPage(visitor);
  const form = await api.defineForm(library.books, {
    name: 'Book intake',
    fields: bookFields(library, 'must_create'),
  });
  await api.publishForm(schema, form);
  await publicForm.goto(form.token);

  await expect(publicForm.label('Author')).toBeVisible();
  await expect(publicForm.field('Author')).toHaveCount(0);
  await publicForm.field('Title').fill('The Last Wish');
  await expect(publicForm.submitButton()).toBeDisabled();
  await publicForm.field('Name').fill('Andrzej Sapkowski');
  await publicForm.submitButton().click();

  await expect(publicForm.submitAnotherButton).toBeVisible();
  expect(await storedAuthors(library)).toContainEqual({
    name: 'Andrzej Sapkowski',
    country: null,
  });
  expect(await storedBooks(library)).toMatchObject([
    { title: 'The Last Wish', author: 'Andrzej Sapkowski' },
  ]);
});
