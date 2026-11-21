import { runSqlInSchema } from '../../support/api/mathesar';
import { runSql } from '../../support/api/postgres';
import { menuItem } from '../../support/ui/components/menu';
import { GatedTablePage } from '../../support/ui/pages/privilege-gated-pages';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, test } from './fixtures';
import { grantOnSchema, grantOnTable } from './privileges';

test.describe('what a standard user may do with a schema', () => {
  test('lists the tables of a schema without USAGE but shows none of their records', async ({
    books,
    signInAs,
    collaborator: { user },
  }) => {
    const page = await signInAs(user);
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(books.schema);
    await expect(schemaPage.findRecordButton('Books')).toBeDisabled();
    await expect(schemaPage.newTableButton).toBeDisabled();
    await expect(schemaPage.renameButton).toBeDisabled();

    await schemaPage.tables.link('Books').click();
    await expect(new GatedTablePage(page).noSelectWarning).toBeVisible();
  });

  test('offers Find a Record and Explore Table only for tables the role may read', async ({
    books,
    signInAs,
    collaborator: { user, role },
  }) => {
    await runSqlInSchema(
      books.schema,
      'CREATE TABLE "Authors" (id integer PRIMARY KEY, "Name" text)',
    );
    await grantOnSchema(books.schema, role.name, 'USAGE');
    await grantOnTable(books, role.name, 'SELECT');
    const page = await signInAs(user);
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(books.schema);

    await expect(schemaPage.findRecordButton('Books')).toBeEnabled();
    await expect(schemaPage.findRecordButton('Authors')).toBeDisabled();

    await schemaPage.tables.menuButton('Books').click();
    await expect(schemaPage.exploreMenuLink).toBeVisible();
    await page.keyboard.press('Escape');
    await schemaPage.tables.menuButton('Authors').click();
    await expect(menuItem(page, 'Table Permissions')).toBeVisible();
    await expect(schemaPage.exploreMenuLink).toHaveCount(0);
  });

  test('disables Rename Table and Delete Table for a table of another role', async ({
    books,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnSchema(books.schema, role.name, 'USAGE, CREATE');
    await grantOnTable(books, role.name, 'SELECT, INSERT, UPDATE, DELETE');
    const page = await signInAs(user);
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(books.schema);
    await schemaPage.tables.menuButton('Books').click();

    await expect(menuItem(page, 'Rename Table')).toBeDisabled();
    await expect(menuItem(page, 'Delete Table')).toBeDisabled();
  });

  test('disables New Table without CREATE on the schema', async ({
    schema,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnSchema(schema, role.name, 'USAGE');
    const schemaPage = new SchemaPage(await signInAs(user));
    await schemaPage.goto(schema);

    await expect(schemaPage.newTableButton).toBeDisabled();
    await expect(schemaPage.tables.section).toContainText('No Tables');
    await expect(schemaPage.fromScratchButton).toHaveCount(0);
  });

  test('creates a table with CREATE on the schema, owned by the role', async ({
    schema,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnSchema(schema, role.name, 'USAGE, CREATE');
    const page = await signInAs(user);
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(schema);
    await schemaPage.newTableButton.click();
    await menuItem(page, 'From Scratch').click();
    await schemaPage.createTableModal.name.fill('Mine');
    await schemaPage.createTableModal.button('Proceed').click();

    await schemaPage.createTableModal.expectClosed();
    await expect(schemaPage.tables.link('Mine')).toBeVisible();
    expect(
      await runSql(
        schema.database.name,
        'SELECT tableowner AS owner FROM pg_tables WHERE schemaname = $1',
        [schema.name],
      ),
    ).toEqual([{ owner: role.name }]);
  });
});
