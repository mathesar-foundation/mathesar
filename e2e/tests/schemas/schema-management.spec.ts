import { runSql } from '../../support/api/postgres';
import type { Database } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { Toasts } from '../../support/ui/components/toast';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { pinsKnownBug } from '../../support/known-bugs';

interface SchemaRow {
  name: string;
  description: string | null;
}

function userSchemas(database: Database): Promise<SchemaRow[]> {
  return runSql<SchemaRow>(
    database.name,
    `SELECT nspname AS name, obj_description(oid, 'pg_namespace') AS description
     FROM pg_namespace
     WHERE nspname NOT IN ('msar', '__msar', 'mathesar_types', 'information_schema')
       AND nspname NOT LIKE 'pg\\_%'
     ORDER BY nspname`,
  );
}

test.describe('schemas of a database', () => {
  let databasePage: DatabasePage;

  test.beforeEach(async ({ page, database }) => {
    databasePage = new DatabasePage(page);
    await runSql(
      database.name,
      `CREATE SCHEMA "Inventory"; COMMENT ON SCHEMA "Inventory" IS 'Stock on hand';
       CREATE SCHEMA "Sales";
       CREATE TABLE "Sales"."Orders" (id integer PRIMARY KEY);`,
    );
    await databasePage.goto(database);
  });

  test('lists every schema with its description and table count', async () => {
    await expect(databasePage.schemaRows).toHaveCount(3);
    await expect(databasePage.schemaRow('Inventory')).toContainText(
      'Stock on hand',
    );
    await expect(databasePage.schemaRow('Inventory')).toContainText('0 tables');
    await expect(databasePage.schemaRow('Sales')).toContainText('1 table');
    await expect(databasePage.schemaRow('public')).toBeVisible();
  });

  test('hides the schemas that hold Mathesar internals', async () => {
    await expect(databasePage.schemaRows).toHaveCount(3);
    await expect(databasePage.schemaRow('msar')).toHaveCount(0);
    await expect(databasePage.schemaRow('__msar')).toHaveCount(0);
    await expect(databasePage.schemaRow('mathesar_types')).toHaveCount(0);
  });

  test('creates a schema with a name and a description', async ({
    database,
  }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('Personnel');
    await createSchemaModal.description.fill('People and teams');
    await createSchemaModal.button('Create New Schema').click();

    await createSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Personnel')).toContainText(
      'People and teams',
    );
    expect(await userSchemas(database)).toContainEqual({
      name: 'Personnel',
      description: 'People and teams',
    });
  });

  test('requires a name to create a schema', async ({ page }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.createSchemaButton.click();
    await expect(createSchemaModal.button('Create New Schema')).toBeDisabled();

    await createSchemaModal.name.fill('x');
    await createSchemaModal.name.fill('');
    await expect(createSchemaModal.body).toContainText(
      'Schema name cannot be empty',
    );
    await expect(createSchemaModal.button('Create New Schema')).toBeDisabled();

    await createSchemaModal.name.click();
    await page.keyboard.type('Personnel');
    await expect(createSchemaModal.button('Create New Schema')).toBeEnabled();
  });

  test('cancelling the create modal adds no schema', async ({ database }) => {
    const { createSchemaModal } = databasePage;
    await databasePage.createSchemaButton.click();
    await createSchemaModal.name.fill('Abandoned');
    await createSchemaModal.button('Cancel').click();

    await createSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Abandoned')).toHaveCount(0);
    expect(await userSchemas(database)).not.toContainEqual(
      expect.objectContaining({ name: 'Abandoned' }),
    );
  });

  test(
    'reports the database error when the name is already taken, and closes the modal',
    pinsKnownBug('schema-duplicate-check-ignores-case'),
    async ({ page }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await createSchemaModal.name.fill('Sales');
      await createSchemaModal.button('Create New Schema').click();

      await new Toasts(page).expectMessage('schema "Sales" already exists');
      await createSchemaModal.expectClosed();
      await expect(databasePage.schemaRows).toHaveCount(3);
    },
  );

  test('renames a schema and changes its description', async ({ database }) => {
    await databasePage.chooseSchemaAction('Inventory', 'Rename Schema');
    const renameModal = databasePage.renameSchemaModal('Inventory');
    await expect(renameModal.name).toHaveValue('Inventory');
    await expect(renameModal.description).toHaveValue('Stock on hand');

    await renameModal.name.fill('Warehouse');
    await renameModal.description.fill('Stock by location');
    await renameModal.button('Save').click();

    await renameModal.expectClosed();
    await expect(databasePage.schemaRow('Inventory')).toHaveCount(0);
    await expect(databasePage.schemaRow('Warehouse')).toContainText(
      'Stock by location',
    );
    expect(await userSchemas(database)).toContainEqual({
      name: 'Warehouse',
      description: 'Stock by location',
    });
  });

  test('deletes a schema with its tables after confirmation', async ({
    database,
  }) => {
    await databasePage.chooseSchemaAction('Sales', 'Delete Schema');
    const { deleteSchemaModal } = databasePage;
    await expect(deleteSchemaModal.title).toHaveText('Delete Schema Sales?');
    await deleteSchemaModal.button('Delete Schema').click();

    await deleteSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Sales')).toHaveCount(0);
    expect(await userSchemas(database)).not.toContainEqual(
      expect.objectContaining({ name: 'Sales' }),
    );
  });

  test('keeps the schema when the deletion is cancelled', async ({
    database,
  }) => {
    await databasePage.chooseSchemaAction('Sales', 'Delete Schema');
    await databasePage.deleteSchemaModal.button('Cancel').click();

    await databasePage.deleteSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Sales')).toBeVisible();
    expect(await userSchemas(database)).toContainEqual(
      expect.objectContaining({ name: 'Sales' }),
    );
  });

  test('filters the list by name as the user types', async () => {
    await databasePage.schemaSearch.fill('inv');
    await expect(databasePage.schemaRows).toHaveCount(1);
    await expect(databasePage.schemaRow('Inventory')).toBeVisible();
    await expect(databasePage.searchSummary).toHaveText('1 schema matches inv');

    await databasePage.schemaSearch.fill('no such schema');
    await expect(databasePage.schemaRows).toHaveCount(0);
    await expect(databasePage.searchSummary).toHaveText(
      '0 schemas match no such schema',
    );

    await databasePage.clearSearchButton.click();
    await expect(databasePage.schemaSearch).toHaveValue('');
    await expect(databasePage.schemaRows).toHaveCount(3);
  });

  test('opens the schema page from the list', async ({ page, database }) => {
    await databasePage.schemaLink('Sales').click();
    await expect(page).toHaveURL(
      new RegExp(`/db/${database.id}/schemas/\\d+/$`),
    );
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });
});
