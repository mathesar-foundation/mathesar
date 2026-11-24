import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { runsAlone } from '../../support/fixtures';
import { PermissionsModal } from '../../support/ui/components/permissions-modal';
import { tooltip } from '../../support/ui/components/tooltip';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, test } from './fixtures';
import {
  grantOnSchema,
  makeOwnerOfSchema,
  ownerOfSchema,
  privilegesOnSchema,
} from './privileges';

// What the modals of a database, a schema and a table have in common, shown on a schema.
test.describe('permissions modal', () => {
  test.describe('for an admin whose role is a superuser', () => {
    let schemaPage: SchemaPage;
    let modal: PermissionsModal;

    test.beforeEach(({ page, schema }) => {
      schemaPage = new SchemaPage(page);
      modal = new PermissionsModal(
        page,
        `Permissions for ${schema.name} schema`,
      );
    });

    test('shows the owner and that no role has been granted access', async ({
      schema,
    }) => {
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();

      await expect(modal.shareTab).toHaveAttribute('aria-selected', 'true');
      await expect(modal.owner).toHaveText(env.postgres.user);
      await expect(modal.noAccessNote).toBeVisible();
      await expect(modal.accessRows).toHaveCount(0);
      await expect(modal.button('Save')).toBeDisabled();
    });

    test('shows each role with the access level that matches its privileges', async ({
      schema,
      createRole,
    }) => {
      const reader = await createRole('NOLOGIN');
      const creator = await createRole('NOLOGIN');
      const other = await createRole('NOLOGIN');
      await grantOnSchema(schema, reader, 'USAGE');
      await grantOnSchema(schema, creator, 'USAGE, CREATE');
      await grantOnSchema(schema, other, 'CREATE');
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();

      await expect(modal.accessRows).toHaveCount(3);
      await expect(modal.accessRow(reader).accessLevel).toHaveText('Read');
      await expect(modal.accessRow(creator).accessLevel).toHaveText(
        'Read + Create',
      );
      await expect(modal.accessRow(other).accessLevel).toHaveText('Custom');
      await expect(modal.button('Save')).toBeDisabled();
    });

    test('unfolds the privileges of a custom access level on request', async ({
      schema,
      createRole,
    }) => {
      const role = await createRole('NOLOGIN');
      await grantOnSchema(schema, role, 'CREATE');
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();
      const access = modal.accessRow(role);
      await expect(access.privilegesToggle).toBeVisible();
      await expect(access.privileges).toHaveCount(0);

      await access.privilegesToggle.click();
      await expect(access.privilege('CREATE')).toBeChecked();
      await expect(access.privilege('USAGE')).not.toBeChecked();
    });

    test('shows the child roles that inherit from a role', async ({
      schema,
      createRole,
    }) => {
      const group = await createRole('NOLOGIN');
      const member = await createRole('NOLOGIN');
      const memberWithoutInherit = await createRole('NOLOGIN NOINHERIT');
      await runSql(
        'postgres',
        `GRANT ${quoteIdentifier(group)}
         TO ${quoteIdentifier(member)}, ${quoteIdentifier(memberWithoutInherit)}`,
      );
      await grantOnSchema(schema, group, 'USAGE');
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();

      await expect(modal.accessRow(group).root).toContainText(
        `${group} + 1 child role ${member}`,
      );
      await expect(modal.accessRow(group).root).not.toContainText(
        memberWithoutInherit,
      );
    });

    test('offers each role once and never the owner', async ({
      schema,
      createRole,
    }) => {
      const listed = await createRole('NOLOGIN');
      const added = await createRole('NOLOGIN');
      const free = await createRole('NOLOGIN');
      await grantOnSchema(schema, listed, 'USAGE');
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();
      await modal.addRole(added);
      await modal.addRolesButton.click();

      await expect(modal.candidate(free)).toBeEnabled();
      await expect(modal.candidate(listed)).toBeDisabled();
      await expect(modal.candidate(added)).toBeDisabled();
      await expect(modal.candidate(env.postgres.user)).toBeDisabled();
    });

    test('cancelling discards the changes', async ({ schema, createRole }) => {
      const kept = await createRole('NOLOGIN');
      const abandoned = await createRole('NOLOGIN');
      await grantOnSchema(schema, kept, 'USAGE');
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();
      await modal.accessRow(kept).removeButton.click();
      await modal.addRole(abandoned);
      await expect(modal.button('Save')).toBeEnabled();
      await modal.button('Cancel').click();

      await modal.expectClosed();
      expect(await privilegesOnSchema(schema, kept)).toEqual(['USAGE']);
      expect(await privilegesOnSchema(schema, abandoned)).toEqual([]);

      await schemaPage.permissionsButton.click();
      await expect(modal.accessRow(kept).accessLevel).toHaveText('Read');
      await expect(modal.accessRow(abandoned).root).toHaveCount(0);
      await expect(modal.button('Save')).toBeDisabled();
    });

    test(
      'reports the database error when saving fails',
      runsAlone,
      async ({ schema, createRole }) => {
        const role = await createRole('NOLOGIN');
        await schemaPage.goto(schema);
        await schemaPage.permissionsButton.click();
        await modal.addRole(role);
        await runSql('postgres', `DROP ROLE ${quoteIdentifier(role)}`);
        await modal.button('Save').click();

        await expect(modal.root).toContainText(
          /Role with OID \d+ does not exist/,
        );
        await modal.expectOpen();
        await expect(modal.accessRow(role).root).toBeVisible();
      },
    );

    test('does not offer the owner as the new owner', async ({ schema }) => {
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();
      await modal.transferOwnershipTab.click();
      await modal.newOwner.click();
      await modal.newOwnerOption(env.postgres.user).click();

      await expect(modal.newOwner).toHaveText('Select Role');
      await expect(modal.button('Transfer Ownership')).toBeDisabled();
    });

    test('explains the permissions in the help of the title', async ({
      page,
      database,
    }) => {
      const databaseModal = new PermissionsModal(
        page,
        `Permissions for ${database.name} database`,
      );
      await new DatabasePage(page).goto(database);
      await new DatabaseLayout(page).permissionsButton.click();
      await databaseModal.help.hover();

      await expect(tooltip(page)).toContainText(
        'These permissions only apply to the top-level database object',
      );
      await expect(tooltip(page)).toContainText(
        'close this window and click on "Database Settings."',
      );
    });
  });

  test.describe('for a standard user', () => {
    test('shows the privileges read-only to a role that does not own the schema', async ({
      schema,
      createRole,
      signInAs,
      collaborator: { user, role },
    }) => {
      const other = await createRole('NOLOGIN');
      await grantOnSchema(schema, role.name, 'USAGE');
      await grantOnSchema(schema, other, 'CREATE');
      const page = await signInAs(user);
      const schemaPage = new SchemaPage(page);
      const modal = new PermissionsModal(
        page,
        `Permissions for ${schema.name} schema`,
      );
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();

      await expect(modal.owner).toHaveText(env.postgres.user);
      await expect(modal.accessRow(role.name).staticAccessLevel).toHaveText(
        'Read',
      );
      await expect(modal.accessRow(other).staticAccessLevel).toHaveText(
        'Custom',
      );
      await expect(modal.tabs).toHaveCount(0);
      await expect(modal.addRolesButton).toHaveCount(0);
      await expect(modal.accessRow(role.name).removeButton).toHaveCount(0);
      await expect(modal.button('Save')).toHaveCount(0);

      await modal.accessRow(other).privilegesToggle.click();
      await expect(modal.accessRow(other).privilege('CREATE')).toBeChecked();
      await expect(modal.accessRow(other).privilege('CREATE')).toBeDisabled();
      await expect(modal.accessRow(other).privilege('USAGE')).toBeDisabled();
    });

    test('lets an owner transfer the ownership only to roles it is a member of', async ({
      schema,
      createRole,
      signInAs,
      collaborator: { user, role },
    }) => {
      const group = await createRole('NOLOGIN');
      const stranger = await createRole('NOLOGIN');
      await runSql(
        'postgres',
        `GRANT ${quoteIdentifier(group)} TO ${quoteIdentifier(role.name)}`,
      );
      // PostgreSQL wants the new owner to hold CREATE on the database.
      await runSql(
        schema.database.name,
        `GRANT CREATE ON DATABASE ${quoteIdentifier(schema.database.name)}
         TO ${quoteIdentifier(group)}`,
      );
      await makeOwnerOfSchema(schema, role.name);
      const page = await signInAs(user);
      const schemaPage = new SchemaPage(page);
      const modal = new PermissionsModal(
        page,
        `Permissions for ${schema.name} schema`,
      );
      await schemaPage.goto(schema);
      await schemaPage.permissionsButton.click();
      await modal.transferOwnershipTab.click();

      await modal.newOwner.click();
      await modal.newOwnerOption(stranger).click();
      await expect(modal.newOwner).toHaveText('Select Role');
      await modal.newOwnerOption(group).click();
      await expect(modal.newOwner).toHaveText(group);
      await modal.button('Transfer Ownership').click();

      await modal.expectClosed();
      expect(await ownerOfSchema(schema)).toBe(group);
    });
  });
});
