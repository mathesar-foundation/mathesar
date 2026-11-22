import { PermissionsModal } from '../../support/ui/components/permissions-modal';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { expect, test } from './fixtures';
import {
  grantOnDatabase,
  ownerOfDatabase,
  privilegesOnDatabase,
  revokeDatabaseFromPublic,
} from './privileges';

test.describe('permissions of a database', () => {
  let databasePage: DatabasePage;
  let layout: DatabaseLayout;
  let modal: PermissionsModal;
  let role: string;

  test.beforeEach(async ({ page, database, createRole }) => {
    databasePage = new DatabasePage(page);
    layout = new DatabaseLayout(page);
    modal = new PermissionsModal(
      page,
      `Permissions for ${database.name} database`,
    );
    role = await createRole('NOLOGIN');
    await revokeDatabaseFromPublic(database);
  });

  test('grants Connect, which is CONNECT', async ({ page, database }) => {
    await databasePage.goto(database);
    await layout.permissionsButton.click();
    await modal.addRole(role);
    await expect(modal.accessRow(role).accessLevel).toHaveText('Connect');
    await modal.button('Save').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Access for roles have been saved successfully.',
    );
    expect(await privilegesOnDatabase(database, role)).toEqual(['CONNECT']);
  });

  test('changes a role to Connect + Create, which adds CREATE', async ({
    database,
  }) => {
    await grantOnDatabase(database, role, 'CONNECT');
    await databasePage.goto(database);
    await layout.permissionsButton.click();
    await modal.chooseAccessLevel(role, 'Connect + Create');
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnDatabase(database, role)).toEqual([
      'CONNECT',
      'CREATE',
    ]);
  });

  test('grants the privileges that are checked under Custom', async ({
    database,
  }) => {
    await databasePage.goto(database);
    await layout.permissionsButton.click();
    await modal.addRole(role);
    await modal.chooseAccessLevel(role, 'Custom');
    const access = modal.accessRow(role);
    await expect(access.privileges).toHaveCount(3);
    await expect(access.privilege('CONNECT')).toBeChecked();

    await access.privilege('TEMPORARY').check();
    await access.privilege('CONNECT').uncheck();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnDatabase(database, role)).toEqual(['TEMPORARY']);
  });

  test('revokes all privileges of a role that is removed', async ({
    database,
  }) => {
    await grantOnDatabase(database, role, 'CONNECT, CREATE');
    await databasePage.goto(database);
    await layout.permissionsButton.click();
    await modal.accessRow(role).removeButton.click();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnDatabase(database, role)).toEqual([]);
  });

  test('transfers the ownership to another role', async ({
    page,
    database,
  }) => {
    await databasePage.goto(database);
    await layout.permissionsButton.click();
    await modal.transferOwnershipTab.click();
    await chooseOption(modal.newOwner, role);
    await modal.button('Transfer Ownership').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Database ownership has been updated successfully.',
    );
    expect(await ownerOfDatabase(database)).toBe(role);

    await layout.permissionsButton.click();
    await expect(modal.owner).toHaveText(role);
  });
});
