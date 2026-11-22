import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { quoteIdentifier } from '../../support/api/postgres';
import { pinsKnownBug } from '../../support/known-bugs';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import {
  newItemHighlight,
  skipHighlightDelay,
} from '../../support/ui/components/new-item-highlight';
import { chooseOption } from '../../support/ui/components/select';
import {
  DataExplorerPage,
  dataExplorerUrl,
} from '../../support/ui/pages/data-explorer-page';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { schemaUrl, tableUrl } from '../../support/ui/urls';
import { expect, test } from './shop';

interface TableRow {
  name: string;
  description: string | null;
}

interface ColumnRow {
  name: string;
  type: string;
  identity: string;
  default: string | null;
  primaryKey: boolean;
}

function storedTables(schema: Schema): Promise<TableRow[]> {
  return runSqlInSchema<TableRow>(
    schema,
    `SELECT relname AS name, obj_description(oid, 'pg_class') AS description
     FROM pg_class
     WHERE relnamespace = ${schema.oid} AND relkind = 'r'
     ORDER BY relname`,
  );
}

function storedColumns(schema: Schema, table: string): Promise<ColumnRow[]> {
  return runSqlInSchema<ColumnRow>(
    schema,
    `SELECT
       attname AS name,
       format_type(atttypid, atttypmod) AS type,
       attidentity::text AS identity,
       pg_get_expr(adbin, adrelid) AS default,
       EXISTS (
         SELECT FROM pg_index
         WHERE indrelid = attrelid AND indisprimary AND attnum = ANY (indkey)
       ) AS "primaryKey"
     FROM pg_attribute
     LEFT JOIN pg_attrdef ON adrelid = attrelid AND adnum = attnum
     WHERE attrelid = '${quoteIdentifier(table)}'::regclass
       AND attnum > 0 AND NOT attisdropped
     ORDER BY attnum`,
  );
}

test.describe('tables of a schema', () => {
  test.describe('list', () => {
    test.beforeEach(async ({ shop, schemaPage }) => {
      await schemaPage.goto(shop.products.schema);
    });

    test('lists tables and views by name, with their descriptions', async ({
      schemaPage,
    }) => {
      await expect(schemaPage.tablesHeading).toHaveText('Tables & Views');
      await expect(schemaPage.tables.items).toContainText([
        'Cheap Products',
        'Orders',
        'Products What is on the shelf',
      ]);
    });

    test('opens a table from its card', async ({ page, shop, schemaPage }) => {
      await schemaPage.tables.link('Products').click();
      await expect(page).toHaveURL(tableUrl(shop.products));
      await expect(new TablePage(page).heading).toHaveText('Products');
    });

    test('opens the record selector of a table and closes it on Escape', async ({
      page,
      schemaPage,
    }) => {
      await expect(schemaPage.findRecordButton('Cheap Products')).toHaveCount(
        0,
      );
      await schemaPage.findRecordButton('Products').click();
      await expect(schemaPage.recordSelector).toContainText(
        'Open a Record from Products',
      );
      await page.keyboard.press('Escape');
      await expect(schemaPage.recordSelector).toHaveCount(0);
    });

    test('offers to explore, rename, share and delete a table', async ({
      page,
      schemaPage,
    }) => {
      await schemaPage.tables.menuButton('Products').click();
      await expect(openMenu(page)).toHaveText(
        /^\s*Explore Table\s*Rename Table\s*Table Permissions\s*Delete Table\s*$/,
      );
    });

    test('offers only to explore and to share a view', async ({
      page,
      schemaPage,
    }) => {
      await schemaPage.tables.menuButton('Cheap Products').click();
      await expect(openMenu(page)).toHaveText(
        /^\s*Explore View\s*View Permissions\s*$/,
      );
    });

    test('opens the Data Explorer for a table from its menu', async ({
      page,
      schema,
      schemaPage,
    }) => {
      await schemaPage.tables.menuButton('Products').click();
      await schemaPage.exploreMenuLink.click();
      await expect(page).toHaveURL(dataExplorerUrl(schema));
      await expect(new DataExplorerPage(page).baseTableName).toContainText(
        'Products',
      );
    });

    test('opens the permissions of a table from its menu', async ({
      schemaPage,
    }) => {
      const modal = schemaPage.permissionsModal('Products', 'table');
      await schemaPage.tables.chooseAction('Products', 'Table Permissions');
      await modal.expectOpen();
      await modal.close();
      await modal.expectClosed();
    });

    test('replaces the label of "Find a Record" with a tooltip in a narrow window', async ({
      page,
      schemaPage,
    }) => {
      await expect(schemaPage.findRecordButton('Products')).toHaveText(
        'Find a Record',
      );
      await page.setViewportSize({ width: 390, height: 800 });
      await expect(schemaPage.findRecordButton('Products')).toHaveText('');

      await schemaPage.findRecordButton('Products').hover();
      await expect(schemaPage.tooltip).toHaveText('Find a Record');
    });
  });

  test('calls the list "Tables" when the schema has no view', async ({
    shop,
    schemaPage,
  }) => {
    await runSqlInSchema(shop.products.schema, 'DROP VIEW "Cheap Products"');
    await schemaPage.goto(shop.products.schema);
    await expect(schemaPage.tablesHeading).toHaveText('Tables');
  });

  test('marks a table whose import is not confirmed and links it to the import', async ({
    page,
    api,
    shop,
    schemaPage,
  }) => {
    await api.markImportUnconfirmed(shop.orders);
    await schemaPage.goto(shop.orders.schema);
    await expect(schemaPage.tables.item('Orders')).toContainText(
      'Needs Import Confirmation',
    );
    await expect(schemaPage.tables.link('Orders')).toHaveAttribute(
      'href',
      `${schemaUrl(shop.orders.schema)}import/${shop.orders.oid}/?inference=true`,
    );
    await expect(schemaPage.findRecordButton('Orders')).toHaveCount(0);
    await schemaPage.tables.menuButton('Orders').click();
    await expect(openMenu(page)).toHaveText(/^\s*Delete Table\s*$/);
  });

  test.describe('new table', () => {
    test.beforeEach(async ({ page, shop, schemaPage }) => {
      await schemaPage.goto(shop.products.schema);
      await schemaPage.newTableButton.click();
      await menuItem(page, 'From Scratch').click();
    });

    test('creates a table with an identity column as primary key and stays on the page', async ({
      page,
      schema,
      schemaPage,
    }) => {
      const { createTableModal } = schemaPage;
      await expect(createTableModal.name).toHaveValue('Table 1');
      await createTableModal.name.fill('Customers');
      await createTableModal.description.fill('People who buy');
      await createTableModal.button('Proceed').click();

      await createTableModal.expectClosed();
      await expect(page).toHaveURL(schemaUrl(schema));
      await expect(schemaPage.tables.items).toContainText([
        'Cheap Products',
        'Customers People who buy',
        'Orders',
        'Products',
      ]);
      expect(await storedTables(schema)).toContainEqual({
        name: 'Customers',
        description: 'People who buy',
      });
      expect(await storedColumns(schema, 'Customers')).toEqual([
        {
          name: 'id',
          type: 'integer',
          identity: 'd',
          default: null,
          primaryKey: true,
        },
      ]);
    });

    test('creates a table with a UUID column of another name as primary key', async ({
      schema,
      schemaPage,
    }) => {
      const { createTableModal } = schemaPage;
      await expect(createTableModal.primaryKeyName).toHaveCount(0);
      await createTableModal.primaryKeyToggle.click();
      await expect(createTableModal.primaryKeyName).toHaveValue('id');
      await expect(createTableModal.primaryKeyType).toContainText('Integer');
      await createTableModal.primaryKeyName.fill('code');
      await chooseOption(createTableModal.primaryKeyType, /^UUID/);
      await createTableModal.button('Proceed').click();

      await createTableModal.expectClosed();
      await expect(schemaPage.tables.item('Table 1')).toBeVisible();
      expect(await storedColumns(schema, 'Table 1')).toEqual([
        {
          name: 'code',
          type: 'uuid',
          identity: '',
          default: 'gen_random_uuid()',
          primaryKey: true,
        },
      ]);
    });

    test('requires a name that no other table has', async ({ schemaPage }) => {
      const { createTableModal } = schemaPage;
      await createTableModal.name.fill('Products');
      await expect(createTableModal.body).toContainText(
        'A table with that name already exists.',
      );
      await expect(createTableModal.button('Proceed')).toBeDisabled();

      await createTableModal.name.fill('');
      await expect(createTableModal.body).toContainText(
        'Value cannot be empty.',
      );
      await expect(createTableModal.button('Proceed')).toBeDisabled();
    });

    test('creates nothing when the form is cancelled', async ({
      schema,
      schemaPage,
    }) => {
      const { createTableModal } = schemaPage;
      await createTableModal.name.fill('Customers');
      await createTableModal.button('Cancel').click();

      await createTableModal.expectClosed();
      await expect(schemaPage.tables.item('Customers')).toHaveCount(0);
      expect(await storedTables(schema)).toEqual([
        { name: 'Orders', description: null },
        { name: 'Products', description: 'What is on the shelf' },
      ]);
    });
  });

  test('suggests the first free name "Table N" for a new table', async ({
    page,
    shop,
    schemaPage,
  }) => {
    await runSqlInSchema(shop.products.schema, 'CREATE TABLE "Table 1" ()');
    await schemaPage.goto(shop.products.schema);
    await schemaPage.newTableButton.click();
    await menuItem(page, 'From Scratch').click();
    await expect(schemaPage.createTableModal.name).toHaveValue('Table 2');
  });

  test('leads to the import page from the "New Table" menu', async ({
    page,
    shop,
    schemaPage,
  }) => {
    await schemaPage.goto(shop.products.schema);
    await schemaPage.newTableButton.click();
    await schemaPage.importMenuLink.click();
    await expect(page).toHaveURL(`${schemaUrl(shop.products.schema)}import/`);
    await expect(page).toHaveTitle('Import | Mathesar');
  });

  test('highlights a table that was just created', async ({
    page,
    shop,
    schemaPage,
  }) => {
    await page.clock.install();
    await schemaPage.goto(shop.products.schema);
    await expect(schemaPage.tables.item('Products')).toBeVisible();
    await skipHighlightDelay(page);

    await schemaPage.newTableButton.click();
    await menuItem(page, 'From Scratch').click();
    await schemaPage.createTableModal.button('Proceed').click();
    await expect(newItemHighlight(page)).toBeVisible();
  });

  test.describe('rename', () => {
    test.beforeEach(async ({ shop, schemaPage }) => {
      await schemaPage.goto(shop.products.schema);
      await schemaPage.tables.chooseAction('Orders', 'Rename Table');
    });

    test('renames a table and gives it a description', async ({
      schema,
      schemaPage,
    }) => {
      const renameModal = schemaPage.renameModal('Table', 'Orders');
      await expect(renameModal.name).toHaveValue('Orders');
      await expect(renameModal.description).toHaveValue('');
      await renameModal.name.fill('Sales');
      await renameModal.description.fill('What was sold');
      await renameModal.button('Save').click();

      await renameModal.expectClosed();
      await expect(schemaPage.tables.items).toContainText([
        'Cheap Products',
        'Products',
        'Sales What was sold',
      ]);
      expect(await storedTables(schema)).toEqual([
        { name: 'Products', description: 'What is on the shelf' },
        { name: 'Sales', description: 'What was sold' },
      ]);
    });

    test('requires a name that no other table has', async ({ schemaPage }) => {
      const renameModal = schemaPage.renameModal('Table', 'Orders');
      await renameModal.name.fill('Products');
      await expect(renameModal.body).toContainText(
        'A table with that name already exists.',
      );
      await expect(renameModal.button('Save')).toBeDisabled();

      await renameModal.name.fill('');
      await expect(renameModal.body).toContainText(
        'The table name cannot be empty.',
      );
      await expect(renameModal.button('Save')).toBeDisabled();
    });
  });

  test.describe('delete', () => {
    test.beforeEach(async ({ shop, schemaPage }) => {
      await schemaPage.goto(shop.products.schema);
      await schemaPage.tables.chooseAction('Orders', 'Delete Table');
    });

    test('deletes a table once the user has typed its name', async ({
      page,
      schema,
      schemaPage,
    }) => {
      const { deleteTableModal } = schemaPage;
      await expect(deleteTableModal.body).toContainText(
        'To confirm the deletion of the Orders table, please enter the table name into the input field below.',
      );
      await expect(deleteTableModal.body).toContainText(
        'Warning: This action is permanent and once deleted, the table/view cannot be recovered.',
      );
      await expect(deleteTableModal.tableName).toBeFocused();
      await expect(deleteTableModal.button('Delete Table')).toBeDisabled();

      await deleteTableModal.tableName.fill('Order');
      await expect(deleteTableModal.button('Delete Table')).toBeDisabled();
      await deleteTableModal.tableName.fill(' orders ');
      await deleteTableModal.button('Delete Table').click();

      await deleteTableModal.expectClosed();
      await expect(schemaPage.tables.item('Orders')).toHaveCount(0);
      await expect(page).toHaveURL(schemaUrl(schema));
      expect(await storedTables(schema)).toEqual([
        { name: 'Products', description: 'What is on the shelf' },
      ]);
    });

    test('does not delete on Enter in the name field', async ({
      page,
      schema,
      schemaPage,
    }) => {
      const { deleteTableModal } = schemaPage;
      await deleteTableModal.tableName.fill('Orders');
      await page.keyboard.press('Enter');

      await deleteTableModal.expectOpen();
      await expect(deleteTableModal.tableName).toBeFocused();
      await deleteTableModal.button('Cancel').click();
      await deleteTableModal.expectClosed();
      await expect(schemaPage.tables.item('Orders')).toBeVisible();
      expect(await storedTables(schema)).toContainEqual({
        name: 'Orders',
        description: null,
      });
    });
  });

  test.describe('table count of the schema on the database page', () => {
    test.beforeEach(async ({ shop, schemaPage }) => {
      await schemaPage.goto(shop.products.schema);
    });

    test(
      'counts the views as well once a table is created',
      pinsKnownBug('schema-table-count-includes-views'),
      async ({ page, schema, schemaPage }) => {
        await schemaPage.newTableButton.click();
        await menuItem(page, 'From Scratch').click();
        await schemaPage.createTableModal.button('Proceed').click();
        await schemaPage.createTableModal.expectClosed();

        await schemaPage.databaseLink(schema.database.name).click();
        await expect(
          new DatabasePage(page).schemaRow(schema.name),
        ).toContainText('4 tables');
      },
    );

    test.fixme('grows by one when a table is created', async ({
      page,
      schema,
      schemaPage,
    }) => {
      await schemaPage.newTableButton.click();
      await menuItem(page, 'From Scratch').click();
      await schemaPage.createTableModal.button('Proceed').click();
      await schemaPage.createTableModal.expectClosed();

      await schemaPage.databaseLink(schema.database.name).click();
      await expect(new DatabasePage(page).schemaRow(schema.name)).toContainText(
        '3 tables',
      );
    });

    test('shrinks by one when a table is deleted', async ({
      page,
      schema,
      schemaPage,
    }) => {
      await schemaPage.tables.chooseAction('Orders', 'Delete Table');
      await schemaPage.deleteTableModal.tableName.fill('Orders');
      await schemaPage.deleteTableModal.button('Delete Table').click();
      await schemaPage.deleteTableModal.expectClosed();

      await schemaPage.databaseLink(schema.database.name).click();
      await expect(new DatabasePage(page).schemaRow(schema.name)).toContainText(
        '1 table',
      );
    });
  });
});
