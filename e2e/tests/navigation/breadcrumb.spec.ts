import { uniqueName } from '../../support/api/mathesar';
import { runSql } from '../../support/api/postgres';
import { ABORTED_RECORDS_REQUEST } from '../../support/page-errors';
import { isMarkedDocument, markDocument } from '../../support/ui/document-mark';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { AppShell } from '../../support/ui/pages/app-shell';
import { HomePage } from '../../support/ui/pages/home-page';
import { GatedTablePage } from '../../support/ui/pages/privilege-gated-pages';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import {
  databaseUrl,
  recordUrl,
  schemaUrl,
  tableUrl,
} from '../../support/ui/urls';
import { expect, test } from './fixtures';

test.describe('breadcrumb of the app header', () => {
  let breadcrumb: Breadcrumb;

  test.beforeEach(({ page }) => {
    breadcrumb = new Breadcrumb(page);
  });

  test('the logo leads to the home page, where the trail is empty', async ({
    page,
    library,
  }) => {
    await page.goto(tableUrl(library.books));
    await expect(breadcrumb.items).toHaveCount(3);
    await markDocument(page);
    await breadcrumb.homeLink.click();

    await expect(page).toHaveURL('/');
    await expect(new HomePage(page).welcome).toBeVisible();
    await expect(breadcrumb.items).toHaveCount(0);
    expect(await isMarkedDocument(page)).toBe(true);
  });

  test('each link of the trail opens its level', async ({
    page,
    database,
    library,
  }) => {
    const shell = new AppShell(page);
    await page.goto(recordUrl(library.books, 2));
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Books',
      'Emma',
    ]);

    await breadcrumb.item('Books').click();
    await expect(page).toHaveURL(tableUrl(library.books));
    await expect(shell.content).toContainText('Showing 1–3 of 3');
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Books',
    ]);

    await breadcrumb.item('Library').click();
    await expect(page).toHaveURL(schemaUrl(library.schema));
    await expect(shell.content).toContainText('New Table');
    await expect(breadcrumb.items).toHaveText([database.name, 'Library']);

    await breadcrumb.item(database.name).click();
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(shell.content).toContainText('Create Schema');
    await expect(breadcrumb.items).toHaveText([database.name]);
  });

  test('names a database by its nickname', async ({
    page,
    api,
    database,
    library,
  }) => {
    const nickname = uniqueName('Stock room');
    await api.setNickname(database, nickname);
    await page.goto(schemaUrl(library.schema));

    await expect(breadcrumb.items).toHaveText([nickname, 'Library']);
  });

  test.describe(() => {
    test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

    test('shows each level once after a move to another table and back', async ({
      page,
      database,
      library,
    }) => {
      await page.goto(tableUrl(library.books));
      await breadcrumb.tablesAndExplorations.choose('Authors');
      await expect(breadcrumb.items).toHaveText([
        database.name,
        'Library',
        'Authors',
      ]);

      await breadcrumb.tablesAndExplorations.choose('Books');
      await expect(breadcrumb.items).toHaveText([
        database.name,
        'Library',
        'Books',
      ]);
    });
  });

  test('replaces the last level when the user moves between a table, an exploration and a form', async ({
    page,
    database,
    library,
    titles,
    bookForm,
  }) => {
    // The selector lists the forms once the schema page has loaded them.
    await page.goto(schemaUrl(library.schema));
    await breadcrumb.tablesAndExplorations.choose('Books');
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Books',
    ]);

    await breadcrumb.tablesAndExplorations.choose(titles.name);
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      titles.name,
    ]);

    await breadcrumb.tablesAndExplorations.choose(bookForm.name);
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Book form',
    ]);

    await breadcrumb.tablesAndExplorations.choose('Authors');
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Authors',
    ]);
  });

  test('shows each level once after a move to another schema and back', async ({
    page,
    database,
    library,
    shop,
  }) => {
    await page.goto(tableUrl(library.books));
    await breadcrumb.schemas.choose('Shop');
    await expect(page).toHaveURL(schemaUrl(shop));
    await expect(breadcrumb.items).toHaveText([database.name, 'Shop']);

    await breadcrumb.schemas.choose('Library');
    await expect(page).toHaveURL(schemaUrl(library.schema));
    await expect(breadcrumb.items).toHaveText([database.name, 'Library']);
  });

  test('shows each level once after a move to another database and back', async ({
    page,
    database,
    library,
    otherDatabase,
  }) => {
    await page.goto(schemaUrl(library.schema));
    await breadcrumb.databases.choose(otherDatabase.name);
    await expect(page).toHaveURL(databaseUrl(otherDatabase));
    await expect(breadcrumb.items).toHaveText([otherDatabase.name]);

    await breadcrumb.databases.choose(database.name);
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(breadcrumb.items).toHaveText([database.name]);
  });

  test('follows a table that is renamed in the inspector', async ({
    page,
    database,
    library,
  }) => {
    const tablePage = new GatedTablePage(page);
    await tablePage.goto(library.authors);
    await tablePage.tableName.click();
    await tablePage.tableName.fill('Writers');
    await tablePage.inspector.button('Save').click();

    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Writers',
    ]);
    await expect(page).toHaveTitle('Writers | Mathesar');
    await breadcrumb.tablesAndExplorations.open();
    await expect(
      breadcrumb.tablesAndExplorations.sectionEntries('Tables & Views'),
    ).toHaveText(['Long Books', 'Books', 'Writers']);
    await expect(breadcrumb.tablesAndExplorations.currentEntries).toHaveText([
      'Writers',
    ]);
    expect(
      await runSql(
        database.name,
        `SELECT relname FROM pg_class WHERE oid = ${library.authors.oid}`,
      ),
    ).toEqual([{ relname: 'Writers' }]);
  });

  test('follows a schema that is renamed on its page', async ({
    page,
    database,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.schema);
    await schemaPage.renameButton.click();
    const renameModal = schemaPage.renameSchemaModal('Library');
    await renameModal.name.fill('Bookshop');
    await renameModal.button('Save').click();
    await renameModal.expectClosed();

    await expect(breadcrumb.items).toHaveText([database.name, 'Bookshop']);
    await expect(page).toHaveTitle('Bookshop | Mathesar');
    await breadcrumb.schemas.open();
    await expect(breadcrumb.schemas.entries).toHaveText(['Bookshop', 'public']);
    await expect(breadcrumb.schemas.currentEntries).toHaveText(['Bookshop']);
    expect(
      await runSql(
        database.name,
        `SELECT nspname FROM pg_namespace WHERE oid = ${library.schema.oid}`,
      ),
    ).toEqual([{ nspname: 'Bookshop' }]);
  });

  test('marks a table whose import is not confirmed and links it to the import preview', async ({
    page,
    api,
    database,
    library,
  }) => {
    await api.markImportUnconfirmed(library.authors);
    const previewUrl = `${schemaUrl(library.schema)}import/${library.authors.oid}/?inference=true`;
    await page.goto(tableUrl(library.authors));

    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Authors *',
    ]);
    await expect(breadcrumb.items.last()).toHaveAttribute('href', previewUrl);
    await breadcrumb.tablesAndExplorations.open();
    await expect(
      breadcrumb.tablesAndExplorations.entry('Authors *'),
    ).toHaveAttribute('href', previewUrl);
  });
});
