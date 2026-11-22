import { runSql } from '../../support/api/postgres';
import { pinsKnownBug } from '../../support/known-bugs';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { menuItem } from '../../support/ui/components/menu';
import { moreActionsButton } from '../../support/ui/components/more-actions';
import {
  keepHighlights,
  newItemHighlight,
  skipHighlightDelay,
  waitForViewCheck,
} from '../../support/ui/components/new-item-highlight';
import { Toasts } from '../../support/ui/components/toast';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { databaseUrl } from '../../support/ui/urls';
import { expect, test } from './fixtures';

function schemaNames(database: string): Promise<{ name: string }[]> {
  return runSql(
    database,
    `SELECT nspname AS name FROM pg_namespace
     WHERE nspname IN ('public', 'Sales', 'sales', 'Revenue') ORDER BY nspname`,
  );
}

// tests/schemas/schema-management.spec.ts covers creating, renaming, deleting
// and searching schemas. These tests add what it leaves out.
test.describe('schema list of a database', () => {
  let databasePage: DatabasePage;

  test.beforeEach(async ({ page, database }) => {
    databasePage = new DatabasePage(page);
    await runSql(database.name, 'CREATE SCHEMA "Sales"');
  });

  test('lets the owner delete the public schema, and offers to rename it', async ({
    page,
    database,
  }) => {
    await databasePage.goto(database);
    await moreActionsButton(databasePage.schemaRow('public')).click();
    await expect(menuItem(page, 'Rename Schema')).toBeEnabled();
    await menuItem(page, 'Delete Schema').click();
    await databasePage.deleteSchemaModal.button('Delete Schema').click();

    await expect(databasePage.schemaRow('public')).toHaveCount(0);
    expect(await schemaNames(database.name)).toEqual([{ name: 'Sales' }]);
  });

  test(
    'takes a name for a duplicate that differs from a schema by its lower case',
    pinsKnownBug('schema-duplicate-check-ignores-case'),
    async ({ database }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.goto(database);
      await databasePage.createSchemaButton.click();
      await createSchemaModal.name.fill('sales');

      await expect(createSchemaModal.body).toContainText(
        'A schema with that name already exists.',
      );
      await expect(
        createSchemaModal.button('Create New Schema'),
      ).toBeDisabled();
    },
  );

  test.fixme('tells a duplicate name from one that differs by case', async ({
    database,
  }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.goto(database);
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('Sales');
    await expect(createSchemaModal.body).toContainText(
      'A schema with that name already exists.',
    );
    await expect(createSchemaModal.button('Create New Schema')).toBeDisabled();

    await createSchemaModal.name.fill('sales');
    await createSchemaModal.button('Create New Schema').click();
    await expect(databasePage.schemaRow('sales')).toBeVisible();
    expect(await schemaNames(database.name)).toContainEqual({ name: 'sales' });
  });

  test('rejects a name that consists of spaces', async ({ database }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.goto(database);
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('   ');

    await expect(createSchemaModal.body).toContainText(
      'Schema name cannot be empty',
    );
    await expect(createSchemaModal.button('Create New Schema')).toBeDisabled();
  });

  test('selects the current name when the rename form opens', async ({
    page,
    database,
  }) => {
    const renameModal = databasePage.renameSchemaModal('Sales');
    await databasePage.goto(database);
    await databasePage.chooseSchemaAction('Sales', 'Rename Schema');
    await expect(renameModal.name).toBeFocused();

    await page.keyboard.type('Revenue');
    await expect(renameModal.name).toHaveValue('Revenue');
  });

  test('does not submit the form when the user presses Enter in the name', async ({
    page,
    database,
  }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.goto(database);
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('Revenue');
    await page.keyboard.press('Enter');

    await createSchemaModal.expectOpen();
    await expect(createSchemaModal.name).toBeFocused();
    await createSchemaModal.button('Cancel').click();
    await createSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Revenue')).toHaveCount(0);
    expect(await schemaNames(database.name)).not.toContainEqual({
      name: 'Revenue',
    });
  });

  test('closes the rename form and reports the error when the schema is gone', async ({
    page,
    database,
  }) => {
    const renameModal = databasePage.renameSchemaModal('Sales');
    await databasePage.goto(database);
    await runSql(database.name, 'DROP SCHEMA "Sales"');
    await databasePage.chooseSchemaAction('Sales', 'Rename Schema');
    await renameModal.name.fill('Revenue');
    await renameModal.button('Save').click();

    await new Toasts(page).expectMessage(/No schema with OID \d+ exists/);
    await renameModal.expectClosed();
    await expect(databasePage.schemaRow('Sales')).toBeVisible();
  });

  test.describe('highlight of new schemas', () => {
    // The list highlights additions only two seconds after it loaded.
    test.beforeEach(async ({ page, database }) => {
      await page.clock.install();
      await databasePage.goto(database);
      await expect(databasePage.schemaRow('Sales')).toBeVisible();
      await skipHighlightDelay(page);
    });

    test('highlights a schema that was just created', async ({ page }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await createSchemaModal.name.fill('Revenue');
      await createSchemaModal.button('Create New Schema').click();
      await expect(newItemHighlight(page)).toBeVisible();
    });

    test('highlights nothing when the search brings schemas back', async ({
      page,
    }) => {
      await keepHighlights(page);
      await databasePage.schemaSearch.fill('Sales');
      await expect(databasePage.schemaRows).toHaveCount(1);
      await databasePage.schemaSearch.fill('');
      await expect(databasePage.schemaRows).toHaveCount(2);
      await waitForViewCheck(databasePage.schemaRow('Sales'));
      await expect(newItemHighlight(page)).toHaveCount(0);
    });
  });

  test('does not highlight a new schema again after a switch to another database and back', async ({
    page,
    api,
    database,
    newDatabaseName,
  }) => {
    const other = await api.createDatabase(newDatabaseName());
    const { databases } = new Breadcrumb(page);
    const { createSchemaModal } = databasePage;
    await page.clock.install();
    await databasePage.goto(database);
    await expect(databasePage.schemaRow('Sales')).toBeVisible();
    await skipHighlightDelay(page);
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('Revenue');
    await createSchemaModal.button('Create New Schema').click();
    await expect(newItemHighlight(page)).toBeVisible();

    await databases.choose(other.name);
    await expect(page).toHaveURL(databaseUrl(other));
    await expect(databasePage.schemaRow('Sales')).toHaveCount(0);
    await expect(databasePage.schemaRow('public')).toBeVisible();
    await databases.open();
    // With the clock stopped, a highlight stays until the assertion, and the
    // list that the switch renders does not start to look for additions.
    await keepHighlights(page);
    await databases.entry(database.name).click();
    await expect(databasePage.schemaRow('Revenue')).toBeVisible();
    await waitForViewCheck(databasePage.schemaRow('Revenue'));
    await expect(newItemHighlight(page)).toHaveCount(0);
  });
});
