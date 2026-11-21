import type {
  Database,
  MathesarApi,
  StoredRoleInfo,
} from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { DatabaseSettingsPage } from '../../support/ui/pages/database-settings-page';
import { expect, roleUsedBy, test } from './fixtures';
import { findServerRole } from './server-roles';

const server = `${env.postgresFromMathesar.host}:${env.postgresFromMathesar.port}`;

async function storedRoleNamed(
  api: MathesarApi,
  database: Database,
  name: string,
): Promise<StoredRoleInfo> {
  const storedRoles = await api.listStoredRoles(database);
  const role = storedRoles.find((candidate) => candidate.name === name);
  if (!role) throw new Error(`Mathesar stores no password for "${name}"`);
  return role;
}

test.describe('stored roles', () => {
  let settings: DatabaseSettingsPage;

  test.beforeEach(({ page }) => {
    settings = new DatabaseSettingsPage(page);
  });

  test('lists the login roles of the server and marks the stored ones', async ({
    api,
    database,
    createRole,
  }) => {
    const stored = await createRole("LOGIN PASSWORD 'secret'");
    await api.storeRole(database, stored, 'secret');
    const notStored = await createRole("LOGIN PASSWORD 'secret'");
    const group = await createRole('NOLOGIN');
    await settings.goto(database, 'Stored Roles');

    await expect(settings.storedRoles.row(stored).storedMark).toBeVisible();
    await expect(settings.storedRoles.row(stored).removeButton).toBeVisible();
    await expect(settings.storedRoles.row(notStored).name).toBeVisible();
    await expect(settings.storedRoles.row(notStored).storedMark).toHaveCount(0);
    await expect(settings.storedRoles.row(notStored).removeButton).toHaveCount(
      0,
    );
    await expect(settings.storedRoles.row(group).name).toHaveCount(0);
  });

  test('lists a stored role that does not exist on the server', async ({
    api,
    database,
    newRoleName,
  }) => {
    const role = newRoleName();
    await api.storeRole(database, role, 'secret');
    await settings.goto(database, 'Stored Roles');

    await expect(settings.storedRoles.row(role).storedMark).toBeVisible();
    await expect(settings.storedRoles.row(role).removeButton).toBeVisible();
  });

  test('names the password button in a tooltip', async ({
    page,
    api,
    database,
    createRole,
  }) => {
    const stored = await createRole("LOGIN PASSWORD 'secret'");
    await api.storeRole(database, stored, 'secret');
    const notStored = await createRole("LOGIN PASSWORD 'secret'");
    await settings.goto(database, 'Stored Roles');

    await settings.storedRoles.row(notStored).passwordButton.hover();
    await expect(tooltip(page).filter({ hasText: 'Store role' })).toBeVisible();
    await settings.storedRoles.row(stored).passwordButton.hover();
    await expect(
      tooltip(page).filter({ hasText: 'Update Stored Role' }),
    ).toBeVisible();
  });

  test.describe('storing a password', () => {
    let role: string;

    test.beforeEach(async ({ database, createRole }) => {
      role = await createRole("LOGIN PASSWORD 'secret'");
      await settings.goto(database, 'Stored Roles');
      await settings.storedRoles.row(role).passwordButton.click();
    });

    test('stores the password, which lets Mathesar log in as the role', async ({
      page,
      api,
      database,
      createUser,
    }) => {
      const modal = settings.storedRoles.passwordModal(role);
      await expect(modal.password).toBeFocused();
      await expect(modal.body).toContainText(
        `connecting to any databases on server '${server}'`,
      );
      await modal.password.fill('secret');
      await modal.button('Save Role').click();

      await modal.expectClosed();
      await new Toasts(page).expectMessage(
        /^\s*Role configured successfully\s*$/,
      );
      await expect(settings.storedRoles.row(role).storedMark).toBeVisible();
      const storedRole = await storedRoleNamed(api, database, role);

      const user = await createUser();
      await api.addCollaborator(database, user, {
        ...storedRole,
        password: 'secret',
      });
      expect(await roleUsedBy(user, database)).toBe(role);
    });

    test('stores a role without a password', async ({ api, database }) => {
      const modal = settings.storedRoles.passwordModal(role);
      await expect(modal.body).toContainText(
        "Can be left blank if your role doesn't use a password.",
      );
      await modal.button('Save Role').click();

      await modal.expectClosed();
      await expect(settings.storedRoles.row(role).storedMark).toBeVisible();
      expect(await api.listStoredRoles(database)).toContainEqual(
        expect.objectContaining({ name: role }),
      );
    });

    test('cancelling stores nothing', async ({ api, database }) => {
      const modal = settings.storedRoles.passwordModal(role);
      await modal.password.fill('secret');
      await modal.button('Cancel').click();

      await modal.expectClosed();
      await expect(settings.storedRoles.row(role).storedMark).toHaveCount(0);
      expect(await api.listStoredRoles(database)).not.toContainEqual(
        expect.objectContaining({ name: role }),
      );
    });
  });

  test('replaces the stored password after the role got a new one', async ({
    page,
    database,
    collaborator: { user, role },
  }) => {
    await runSql(
      'postgres',
      `ALTER ROLE ${quoteIdentifier(role.name)} PASSWORD 'rotated'`,
    );
    await expect(roleUsedBy(user, database)).rejects.toThrow(
      'OperationalError',
    );
    await settings.goto(database, 'Stored Roles');
    await settings.storedRoles.row(role.name).passwordButton.click();
    const modal = settings.storedRoles.passwordModal(role.name);
    await modal.password.fill('rotated');
    await modal.button('Save Role').click();

    await modal.expectClosed();
    await new Toasts(page).expectMessage(
      'Role configured successfully with new password',
    );
    expect(await roleUsedBy(user, database)).toBe(role.name);
  });

  test.describe('removing a stored role', () => {
    let role: string;

    test.beforeEach(async ({ api, database, createRole }) => {
      role = await createRole("LOGIN PASSWORD 'secret'");
      await api.storeRole(database, role, 'secret');
      await settings.goto(database, 'Stored Roles');
      await settings.storedRoles.row(role).removeButton.click();
    });

    test('removes the stored password but keeps the role on the server', async ({
      page,
      api,
      database,
    }) => {
      const { removeModal } = settings.storedRoles;
      await expect(removeModal.title).toHaveText(
        `Remove Stored Role for ${role}?`,
      );
      await expect(removeModal.body).toContainText(
        `from accessing databases on server '${server}'`,
      );
      await removeModal.button('Remove Stored Role').click();

      await removeModal.expectClosed();
      await new Toasts(page).expectMessage('The stored role has been removed.');
      await expect(settings.storedRoles.row(role).name).toBeVisible();
      await expect(settings.storedRoles.row(role).storedMark).toHaveCount(0);
      expect(await api.listStoredRoles(database)).not.toContainEqual(
        expect.objectContaining({ name: role }),
      );
      expect(await findServerRole(role)).toBeDefined();
    });

    test('keeps the stored role when the confirmation is cancelled', async ({
      api,
      database,
    }) => {
      await settings.storedRoles.removeModal.button('Cancel').click();

      await settings.storedRoles.removeModal.expectClosed();
      await expect(settings.storedRoles.row(role).storedMark).toBeVisible();
      expect(await api.listStoredRoles(database)).toContainEqual(
        expect.objectContaining({ name: role }),
      );
    });
  });

  test('removing a stored role removes its collaborators', async ({
    api,
    database,
    createRole,
    createUser,
  }) => {
    const role = await createRole("LOGIN PASSWORD 'secret'");
    const user = await createUser();
    await api.addCollaborator(
      database,
      user,
      await api.storeRole(database, role, 'secret'),
    );
    await settings.goto(database, 'Collaborators');
    await expect(settings.collaborators.row(user.username).user).toBeVisible();

    await settings.sectionLink('Stored Roles').click();
    await settings.storedRoles.row(role).removeButton.click();
    await settings.storedRoles.removeModal.button('Remove Stored Role').click();
    await settings.storedRoles.removeModal.expectClosed();
    await settings.sectionLink('Collaborators').click();

    await expect(
      settings.collaborators.row(env.admin.username).user,
    ).toBeVisible();
    await expect(settings.collaborators.row(user.username).user).toHaveCount(0);
    expect(await api.listCollaborators(database)).not.toContainEqual(
      expect.objectContaining({ userId: user.id }),
    );
  });
});
