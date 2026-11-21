import { PermissionsModal } from '../../support/ui/components/permissions-modal';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, test } from './fixtures';
import { grantOnSchema, ownerOfSchema, privilegesOnSchema } from './privileges';

test.describe('permissions of a schema', () => {
  let schemaPage: SchemaPage;
  let modal: PermissionsModal;
  let role: string;

  test.beforeEach(async ({ page, schema, createRole }) => {
    schemaPage = new SchemaPage(page);
    modal = new PermissionsModal(page, `Permissions for ${schema.name} schema`);
    role = await createRole('NOLOGIN');
  });

  test('grants Read, which is USAGE', async ({ page, schema }) => {
    await schemaPage.goto(schema);
    await schemaPage.permissionsButton.click();
    await modal.addRole(role);
    await expect(modal.accessRow(role).accessLevel).toHaveText('Read');
    await modal.button('Save').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Access for roles have been saved successfully.',
    );
    expect(await privilegesOnSchema(schema, role)).toEqual(['USAGE']);
  });

  test('changes a role to Read + Create, which adds CREATE', async ({
    schema,
  }) => {
    await grantOnSchema(schema, role, 'USAGE');
    await schemaPage.goto(schema);
    await schemaPage.permissionsButton.click();
    await modal.chooseAccessLevel(role, 'Read + Create');
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnSchema(schema, role)).toEqual(['USAGE', 'CREATE']);
  });

  test('grants the privileges that are checked under Custom', async ({
    schema,
  }) => {
    await schemaPage.goto(schema);
    await schemaPage.permissionsButton.click();
    await modal.addRole(role);
    await modal.chooseAccessLevel(role, 'Custom');
    const access = modal.accessRow(role);
    await expect(access.privileges).toHaveCount(2);
    await expect(access.privilege('USAGE')).toBeChecked();
    await expect(access.privilege('CREATE')).not.toBeChecked();

    await access.privilege('CREATE').check();
    await access.privilege('USAGE').uncheck();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnSchema(schema, role)).toEqual(['CREATE']);
  });

  test('revokes all privileges of a role that is removed', async ({
    schema,
  }) => {
    await grantOnSchema(schema, role, 'USAGE, CREATE');
    await schemaPage.goto(schema);
    await schemaPage.permissionsButton.click();
    await modal.accessRow(role).removeButton.click();
    await expect(modal.noAccessNote).toBeVisible();
    await modal.button('Save').click();

    await modal.expectClosed();
    expect(await privilegesOnSchema(schema, role)).toEqual([]);
  });

  test('transfers the ownership to another role', async ({ page, schema }) => {
    await schemaPage.goto(schema);
    await schemaPage.permissionsButton.click();
    await modal.transferOwnershipTab.click();
    await expect(modal.button('Transfer Ownership')).toBeDisabled();
    await chooseOption(modal.newOwner, role);
    await modal.button('Transfer Ownership').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Schema ownership has been updated successfully.',
    );
    expect(await ownerOfSchema(schema)).toBe(role);

    await schemaPage.permissionsButton.click();
    await expect(modal.owner).toHaveText(role);
  });
});
