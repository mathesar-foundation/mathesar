import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { ErrorPage } from '../../support/ui/pages/error-page';
import { schemaUrl } from '../../support/ui/urls';
import { expect, test } from './shop';

test.describe('schema page', () => {
  test('shows the name and the description of the schema', async ({
    page,
    schema,
    schemaPage,
  }) => {
    await runSql(
      schema.database.name,
      `COMMENT ON SCHEMA ${quoteIdentifier(schema.name)} IS 'Everything we sell'`,
    );
    await schemaPage.goto(schema);
    await expect(page).toHaveTitle(`${schema.name} | Mathesar`);
    await expect(schemaPage.header).toContainText(
      `Schema ${schema.name} Rename Schema Schema Permissions Everything we sell`,
    );
  });

  test('renames the schema and changes its description', async ({
    page,
    schema,
    schemaPage,
  }) => {
    const renameModal = schemaPage.renameSchemaModal(schema.name);
    await schemaPage.goto(schema);
    await schemaPage.renameButton.click();
    await expect(renameModal.name).toHaveValue(schema.name);
    await renameModal.name.fill('Storefront');
    await renameModal.description.fill('Open on weekdays');
    await renameModal.button('Save').click();

    await renameModal.expectClosed();
    await expect(schemaPage.header).toContainText('Schema Storefront');
    await expect(schemaPage.header).toContainText('Open on weekdays');
    await expect(page).toHaveTitle('Storefront | Mathesar');
    await expect(page).toHaveURL(schemaUrl(schema));
    expect(
      await runSql(
        schema.database.name,
        `SELECT nspname AS name, obj_description(oid, 'pg_namespace') AS description
         FROM pg_namespace WHERE oid = $1`,
        [schema.oid],
      ),
    ).toEqual([{ name: 'Storefront', description: 'Open on weekdays' }]);
  });

  test('says that a schema is unknown and leads back to the home page', async ({
    page,
    database,
    schemaPage,
  }) => {
    await page.goto(`/db/${database.id}/schemas/2147483647/`);
    await expect(schemaPage.notFoundMessage).toBeVisible();
    await new ErrorPage(page).homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test.describe('without tables', () => {
    test.beforeEach(async ({ schema, schemaPage }) => {
      await schemaPage.goto(schema);
    });

    test('explains tables and hides the explorations and the forms', async ({
      schemaPage,
    }) => {
      await expect(schemaPage.tablesHeading).toHaveText('Tables');
      await expect(schemaPage.tables.section).toContainText(
        "You've created a new schema, now add tables to it.",
      );
      await expect(schemaPage.tables.section).toContainText(
        'How do you want to create your table?',
      );
      await expect(schemaPage.tables.items).toHaveCount(0);
      await expect(schemaPage.explorations.section).toBeHidden();
      await expect(schemaPage.forms.section).toBeHidden();
    });

    test('opens the form for a new table', async ({ schemaPage }) => {
      await schemaPage.fromScratchButton.click();
      await schemaPage.createTableModal.expectOpen();
    });

    test('leads to the import of a file', async ({
      page,
      schema,
      schemaPage,
    }) => {
      await schemaPage.importFromFileLink.click();
      await expect(page).toHaveURL(`${schemaUrl(schema)}import/`);
      await expect(page).toHaveTitle('Import | Mathesar');
    });
  });
});
