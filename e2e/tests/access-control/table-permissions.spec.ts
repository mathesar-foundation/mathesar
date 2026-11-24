import { runSqlInSchema } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { failOnlyRpcMethod } from '../../support/rpc-failures';
import { PermissionsModal } from '../../support/ui/components/permissions-modal';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { TableTab } from '../../support/ui/pages/table-tab';
import { expect, test } from './fixtures';
import { grantOnTable, ownerOfTable, privilegesOnTable } from './privileges';

test.describe('permissions of a table', () => {
  let tablePage: TablePage;
  let tableTab: TableTab;
  let modal: PermissionsModal;
  let role: string;

  test.beforeEach(async ({ page, createRole }) => {
    tablePage = new TablePage(page);
    tableTab = new TableTab(page, tablePage.inspector);
    modal = new PermissionsModal(page, 'Permissions for Books table');
    role = await createRole('NOLOGIN');
  });

  test('grants Read, which is SELECT', async ({ page, books }) => {
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();
    await modal.addRole(role);
    await expect(modal.accessRow(role).accessLevel).toHaveText('Read');
    await modal.button('Save').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Access for roles have been saved successfully.',
    );
    expect(await privilegesOnTable(books, role)).toEqual(['SELECT']);
  });

  test('changes a role to Write, which adds INSERT, UPDATE and DELETE', async ({
    books,
  }) => {
    await grantOnTable(books, role, 'SELECT');
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();
    await modal.chooseAccessLevel(role, 'Write');
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnTable(books, role)).toEqual([
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
    ]);
  });

  test('grants the privileges that are checked under Custom', async ({
    books,
  }) => {
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();
    await modal.addRole(role);
    await modal.chooseAccessLevel(role, 'Custom');
    const access = modal.accessRow(role);
    await expect(access.privileges).toHaveCount(7);
    await expect(access.privilege('SELECT')).toBeChecked();

    for (const privilege of ['UPDATE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
      await access.privilege(privilege).check();
    }
    await access.privilege('SELECT').uncheck();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnTable(books, role)).toEqual([
      'UPDATE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER',
    ]);
  });

  test('revokes all privileges of a role that is removed', async ({
    books,
  }) => {
    await grantOnTable(books, role, 'SELECT, INSERT, UPDATE, DELETE');
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();
    await modal.accessRow(role).removeButton.click();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnTable(books, role)).toEqual([]);
  });

  test('transfers the ownership to another role', async ({ page, books }) => {
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();
    await modal.transferOwnershipTab.click();
    await chooseOption(modal.newOwner, role);
    await modal.button('Transfer Ownership').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Table ownership has been updated successfully.',
    );
    expect(await ownerOfTable(books)).toBe(role);

    await tableTab.permissionsButton.click();
    await expect(modal.owner).toHaveText(role);
  });

  test('grants Read on a view from its View Permissions', async ({
    page,
    api,
    books,
  }) => {
    await runSqlInSchema(
      books.schema,
      'CREATE VIEW "Long Books" AS SELECT * FROM "Books" WHERE "Pages" > 400',
    );
    const view = await api.getTable(books.schema, 'Long Books');
    const viewModal = new PermissionsModal(
      page,
      'Permissions for Long Books view',
    );
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(books.schema);
    await schemaPage.tables.chooseAction('Long Books', 'View Permissions');
    await viewModal.addRole(role);
    await viewModal.button('Save').click();

    await viewModal.expectClosed();
    expect(await privilegesOnTable(view, role)).toEqual(['SELECT']);
    expect(await privilegesOnTable(books, role)).toEqual([]);
  });

  test('shows the error instead of the privileges and loads them when it opens again', async ({
    page,
    books,
  }) => {
    await grantOnTable(books, role, 'SELECT');
    const restore = await failOnlyRpcMethod(
      page,
      'tables.privileges.list_direct',
      'The privileges are out of reach',
    );
    await tablePage.goto(books);
    await tableTab.permissionsButton.click();

    await expect(modal.body).toHaveText('The privileges are out of reach');
    await expect(modal.owner).toHaveCount(0);
    await modal.close();
    await modal.expectClosed();

    await restore();
    await tableTab.permissionsButton.click();
    await expect(modal.owner).toHaveText(env.postgres.user);
    await expect(modal.accessRow(role).accessLevel).toHaveText('Read');
  });
});
