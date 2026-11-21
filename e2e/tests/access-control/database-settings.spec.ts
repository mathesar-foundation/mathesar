import { quoteIdentifier, runSql } from '../../support/api/postgres';
import {
  DatabaseSettingsPage,
  sectionUrl,
} from '../../support/ui/pages/database-settings-page';
import { tooltip } from '../../support/ui/components/tooltip';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { expect, test } from './fixtures';
import { revokeDatabaseFromPublic } from './privileges';
import { childRolesOf, findServerRole } from './server-roles';

test.describe('database settings', () => {
  test('opens on Roles and switches between the sections', async ({
    page,
    database,
  }) => {
    const settings = new DatabaseSettingsPage(page);
    await new DatabasePage(page).goto(database);
    await new DatabaseLayout(page).settingsTab.click();
    await expect(page).toHaveURL(sectionUrl(database, 'Roles'));
    await expect(settings.heading).toHaveText('Roles');

    await settings.sectionLink('Stored Roles').click();
    await expect(page).toHaveURL(sectionUrl(database, 'Stored Roles'));
    await expect(settings.heading).toHaveText('Stored Roles');

    await settings.sectionLink('Collaborators').click();
    await expect(page).toHaveURL(sectionUrl(database, 'Collaborators'));
    await expect(settings.heading).toHaveText('Collaborators');
  });

  test('explains each section in the help next to its heading', async ({
    page,
    database,
  }) => {
    const settings = new DatabaseSettingsPage(page);
    await settings.goto(database, 'Roles');
    await settings.help.hover();
    await expect(tooltip(page)).toContainText(
      'All the roles within your PostgreSQL server are shown below.',
    );

    await settings.sectionLink('Stored Roles').click();
    await settings.help.hover();
    await expect(
      tooltip(page).filter({ hasText: 'Mathesar stores roles' }),
    ).toBeVisible();

    await settings.sectionLink('Collaborators').click();
    await settings.help.hover();
    await expect(
      tooltip(page).filter({
        hasText:
          'gives one Mathesar user access to one database through a specific PostgreSQL role',
      }),
    ).toBeVisible();
  });

  test.describe('for a standard user', () => {
    test('shows the stored roles without the buttons to change them', async ({
      database,
      createRole,
      signInAs,
      collaborator: { user, role },
    }) => {
      const notStored = await createRole("LOGIN PASSWORD 'secret'");
      const settings = new DatabaseSettingsPage(await signInAs(user));
      await settings.goto(database, 'Stored Roles');
      const { storedRoles } = settings;

      await expect(storedRoles.row(role.name).storedMark).toBeVisible();
      await expect(storedRoles.row(role.name).passwordButton).toBeDisabled();
      await expect(storedRoles.row(role.name).removeButton).toBeDisabled();
      await expect(storedRoles.row(notStored).passwordButton).toBeDisabled();
    });

    test('reaches the collaborators through the tab, without the buttons to change them', async ({
      database,
      signInAs,
      collaborator: { user, role },
    }) => {
      const page = await signInAs(user);
      const settings = new DatabaseSettingsPage(page);
      await new DatabasePage(page).goto(database);
      await new DatabaseLayout(page).settingsTab.click();
      await settings.sectionLink('Collaborators').click();
      const row = settings.collaborators.row(user.username);

      await expect(row.role).toHaveText(role.name);
      await expect(row.changeRoleButton).toBeDisabled();
      await expect(row.removeButton).toBeDisabled();
      await expect(settings.collaborators.addButton).toBeDisabled();
    });

    test('reports the database error when the role may not create roles', async ({
      database,
      newRoleName,
      signInAs,
      collaborator: { user },
    }) => {
      const newRole = newRoleName();
      const settings = new DatabaseSettingsPage(await signInAs(user));
      await settings.goto(database, 'Roles');
      await settings.roles.createRoleButton.click();
      const { createRoleModal } = settings.roles;
      await createRoleModal.name.fill(newRole);
      await createRoleModal.login.uncheck();
      await createRoleModal.button('Create Role').click();

      await expect(createRoleModal.root).toContainText(
        'permission denied to create role',
      );
      await createRoleModal.expectOpen();
      expect(await findServerRole(newRole)).toBeUndefined();
    });

    test('creates a role when the role of the user has CREATEROLE', async ({
      database,
      newRoleName,
      signInAs,
      collaborator: { user, role },
    }) => {
      await runSql(
        'postgres',
        `ALTER ROLE ${quoteIdentifier(role.name)} CREATEROLE`,
      );
      const newRole = newRoleName();
      const settings = new DatabaseSettingsPage(await signInAs(user));
      await settings.goto(database, 'Roles');
      await settings.roles.createRoleButton.click();
      const { createRoleModal } = settings.roles;
      await createRoleModal.name.fill(newRole);
      await createRoleModal.login.uncheck();
      await createRoleModal.button('Create Role').click();

      await createRoleModal.expectClosed();
      await expect(settings.roles.row(newRole).name).toBeVisible();
      expect(await findServerRole(newRole)).toEqual({ login: false });
    });

    test('reports the database error when the role may not grant membership', async ({
      database,
      createRole,
      signInAs,
      collaborator: { user },
    }) => {
      const parent = await createRole('NOLOGIN');
      const child = await createRole('NOLOGIN');
      const settings = new DatabaseSettingsPage(await signInAs(user));
      await settings.goto(database, 'Roles');
      await settings.roles.row(parent).editChildRolesButton.click();
      const modal = settings.roles.childRolesModal(parent);
      await modal.add(child);
      await modal.button('Save').click();

      await expect(modal.root).toContainText(
        `permission denied to grant role "${parent}"`,
      );
      await modal.expectOpen();
      expect(await childRolesOf(parent)).toEqual([]);
    });

    test('shows a connection error when the role may not connect', async ({
      database,
      signInAs,
      collaborator: { user },
    }) => {
      await revokeDatabaseFromPublic(database);
      const settings = new DatabaseSettingsPage(await signInAs(user));
      await settings.goto(database, 'Roles');

      await expect(settings.loadError).toContainText(
        'Unable to connect to the database',
      );
    });
  });
});
