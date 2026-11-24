import { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, expectSettled, seedLibrary, test } from './fixtures';

test('the schema page with tables, an exploration and a form', async ({
  page,
  api,
  createNamedDatabase,
}) => {
  // Exploration names are unique in the instance. A database of a fixed
  // name takes the exploration of an interrupted run with it.
  const database = await createNamedDatabase('visual_schema_page');
  const library = await seedLibrary(api, database);
  await api.defineExploration(library.books, {
    name: 'Long books',
    description: 'Books with more than 400 pages',
    columns: ['Title', 'Pages'],
  });
  await api.defineForm(library.books, {
    name: 'Suggest a book',
    description: 'Tell us what to read next',
    fields: [{ column: 'Title' }],
  });
  const schemaPage = new SchemaPage(page);
  await schemaPage.goto(library.schema);
  await expect(schemaPage.tables.items).toHaveCount(2);
  await expect(schemaPage.explorations.items).toHaveCount(1);
  await expect(schemaPage.forms.items).toHaveCount(1);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('schema-page.png');
});
