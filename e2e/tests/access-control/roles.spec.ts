import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { runsAlone } from '../../support/fixtures';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { DatabaseSettingsPage } from '../../support/ui/pages/database-settings-page';
import { expect, test } from './fixtures';
import { canLogIn, childRolesOf, findServerRole } from './server-roles';

test.describe('roles of the PostgreSQL server', () => {
  let settings: DatabaseSettingsPage;

  test.beforeEach(({ page }) => {
    settings = new DatabaseSettingsPage(page);
  });

  test('lists each role with its LOGIN mark and its child roles', async ({
    database,
    createRole,
  }) => {
    const group = await createRole('NOLOGIN');
    const member = await createRole("LOGIN PASSWORD 'secret'");
    await runSql(
      'postgres',
      `GRANT ${quoteIdentifier(group)} TO ${quoteIdentifier(member)}`,
    );
    await settings.goto(database, 'Roles');

    await expect(settings.roles.row(group).name).toBeVisible();
    await expect(settings.roles.row(group).loginMark).toHaveCount(0);
    await expect(settings.roles.row(group).childRoles).toHaveText([member]);
    await expect(settings.roles.row(member).loginMark).toBeVisible();
    await expect(settings.roles.row(member).childRoles).toHaveCount(0);
  });

  test('names the button that edits child roles in a tooltip', async ({
    page,
    database,
    createRole,
  }) => {
    const role = await createRole('NOLOGIN');
    await settings.goto(database, 'Roles');
    await settings.roles.row(role).editChildRolesButton.hover();

    await expect(tooltip(page)).toHaveText(`Edit ${role} child roles`);
  });

  test.describe('creating a role', () => {
    test.beforeEach(async ({ database }) => {
      await settings.goto(database, 'Roles');
      await settings.roles.createRoleButton.click();
    });

    test('creates a role that logs in with the given password', async ({
      page,
      database,
      newRoleName,
    }) => {
      const role = newRoleName();
      const { createRoleModal } = settings.roles;
      await expect(createRoleModal.name).toBeFocused();
      await expect(createRoleModal.login).toBeChecked();
      await createRoleModal.name.fill(role);
      await createRoleModal.password.fill('correct horse');
      await createRoleModal.confirmPassword.fill('correct horse');
      await createRoleModal.button('Create Role').click();

      await createRoleModal.expectClosed();
      await new Toasts(page).expectMessage(
        'The Role has been created successfully',
      );
      await expect(settings.roles.row(role).loginMark).toBeVisible();
      expect(await findServerRole(role)).toEqual({ login: true });
      expect(await canLogIn(database, role, 'correct horse')).toBe(true);
    });

    test('creates a role without LOGIN, which needs no password', async ({
      newRoleName,
    }) => {
      const role = newRoleName();
      const { createRoleModal } = settings.roles;
      const noteOnStoringThePassword =
        'go to the "Stored Role Passwords" section to save this same password in Mathesar';
      await expect(createRoleModal.body).toContainText(
        noteOnStoringThePassword,
      );
      await createRoleModal.name.fill(role);
      await createRoleModal.login.uncheck();
      await expect(createRoleModal.password).toHaveCount(0);
      await expect(createRoleModal.confirmPassword).toHaveCount(0);
      await expect(createRoleModal.body).not.toContainText(
        noteOnStoringThePassword,
      );
      await createRoleModal.button('Create Role').click();

      await createRoleModal.expectClosed();
      await expect(settings.roles.row(role).name).toBeVisible();
      await expect(settings.roles.row(role).loginMark).toHaveCount(0);
      expect(await findServerRole(role)).toEqual({ login: false });
    });

    test('requires a name, a password and a matching confirmation', async ({
      newRoleName,
    }) => {
      const { createRoleModal } = settings.roles;
      const createButton = createRoleModal.button('Create Role');
      await expect(createButton).toBeDisabled();

      await createRoleModal.name.fill(newRoleName());
      await expect(createButton).toBeDisabled();

      await createRoleModal.password.fill('correct horse');
      await createRoleModal.confirmPassword.fill('correct house');
      await expect(createRoleModal.body).toContainText(
        'Passwords do not match',
      );
      await expect(createButton).toBeDisabled();

      await createRoleModal.confirmPassword.fill('correct horse');
      await expect(createRoleModal.body).not.toContainText(
        'Passwords do not match',
      );
      await expect(createButton).toBeEnabled();
    });

    test('clears the passwords when LOGIN is switched off and on', async () => {
      const { createRoleModal } = settings.roles;
      await createRoleModal.password.fill('correct horse');
      await createRoleModal.confirmPassword.fill('correct horse');
      await createRoleModal.login.uncheck();
      await createRoleModal.login.check();

      await expect(createRoleModal.password).toHaveValue('');
      await expect(createRoleModal.confirmPassword).toHaveValue('');
    });

    test('reports the database error when the name is taken', async ({
      createRole,
    }) => {
      const existing = await createRole('NOLOGIN');
      const { createRoleModal } = settings.roles;
      await createRoleModal.name.fill(existing);
      await createRoleModal.login.uncheck();
      await createRoleModal.button('Create Role').click();

      await expect(createRoleModal.root).toContainText(
        `role "${existing}" already exists`,
      );
      await createRoleModal.expectOpen();
      await expect(createRoleModal.name).toHaveValue(existing);
    });

    test('cancelling adds no role and empties the form', async ({
      newRoleName,
    }) => {
      const role = newRoleName();
      const { createRoleModal } = settings.roles;
      await createRoleModal.name.fill(role);
      await createRoleModal.login.uncheck();
      await createRoleModal.button('Cancel').click();

      await createRoleModal.expectClosed();
      await expect(settings.roles.row(role).name).toHaveCount(0);
      expect(await findServerRole(role)).toBeUndefined();

      await settings.roles.createRoleButton.click();
      await expect(createRoleModal.name).toHaveValue('');
    });

    test('lists a new login role under Stored Roles without a reload', async ({
      newRoleName,
    }) => {
      const role = newRoleName();
      const { createRoleModal } = settings.roles;
      await createRoleModal.name.fill(role);
      await createRoleModal.password.fill('correct horse');
      await createRoleModal.confirmPassword.fill('correct horse');
      await createRoleModal.button('Create Role').click();
      await createRoleModal.expectClosed();
      await settings.sectionLink('Stored Roles').click();

      await expect(settings.storedRoles.row(role).name).toBeVisible();
      await expect(settings.storedRoles.row(role).storedMark).toHaveCount(0);
    });
  });

  test.describe('dropping a role', runsAlone, () => {
    let role: string;

    test.beforeEach(async ({ database, createRole }) => {
      role = await createRole("LOGIN PASSWORD 'secret'");
      await settings.goto(database, 'Roles');
      await settings.roles.row(role).dropButton.click();
    });

    test('drops the role from the server after confirmation', async ({
      page,
    }) => {
      const { dropRoleModal } = settings.roles;
      await expect(dropRoleModal.title).toHaveText(`Drop role ${role}?`);
      await expect(dropRoleModal.body).toContainText(
        'will not be available for any databases configured on the same server',
      );
      await dropRoleModal.button('Drop Role').click();

      await dropRoleModal.expectClosed();
      await new Toasts(page).expectMessage(
        'The Role has been dropped successfully',
      );
      await expect(settings.roles.row(role).name).toHaveCount(0);
      expect(await findServerRole(role)).toBeUndefined();
    });

    test('takes the role off the other sections without a reload', async () => {
      await settings.roles.dropRoleModal.button('Drop Role').click();
      await settings.roles.dropRoleModal.expectClosed();
      await settings.sectionLink('Stored Roles').click();

      await expect(
        settings.storedRoles.row(env.postgres.user).name,
      ).toBeVisible();
      await expect(settings.storedRoles.row(role).name).toHaveCount(0);
    });

    test('keeps the role when the confirmation is cancelled', async () => {
      await settings.roles.dropRoleModal.button('Cancel').click();

      await settings.roles.dropRoleModal.expectClosed();
      await expect(settings.roles.row(role).name).toBeVisible();
      expect(await findServerRole(role)).toBeDefined();
    });

    test('reports the database error for a role that owns objects', async ({
      page,
      database,
    }) => {
      await runSql(
        database.name,
        `CREATE SCHEMA "Owned" AUTHORIZATION ${quoteIdentifier(role)}`,
      );
      await settings.roles.dropRoleModal.button('Drop Role').click();

      await new Toasts(page).expectMessage(
        `role "${role}" cannot be dropped because some objects depend on it`,
      );
      await expect(settings.roles.row(role).name).toBeVisible();
      expect(await findServerRole(role)).toBeDefined();
    });
  });

  test.describe('child roles', () => {
    let parent: string;
    let child: string;
    let other: string;

    test.beforeEach(async ({ database, createRole }) => {
      parent = await createRole('NOLOGIN');
      child = await createRole('NOLOGIN');
      other = await createRole('NOLOGIN');
      await runSql(
        'postgres',
        `GRANT ${quoteIdentifier(parent)} TO ${quoteIdentifier(child)}`,
      );
      await settings.goto(database, 'Roles');
      await settings.roles.row(parent).editChildRolesButton.click();
    });

    test('adds a child role, which grants it membership', async ({ page }) => {
      const modal = settings.roles.childRolesModal(parent);
      await expect(modal.members).toHaveText([child]);
      await expect(modal.button('Save')).toBeDisabled();

      await modal.add(other);
      await expect(modal.members).toHaveText([child, other]);
      await expect(modal.unsavedNote).toBeVisible();
      await modal.button('Save').click();

      await modal.expectClosed();
      await new Toasts(page).expectMessage(
        'The Child Roles have been successfully saved.',
      );
      await expect(settings.roles.row(parent).childRoles).toHaveText(
        [child, other].sort(),
      );
      expect(await childRolesOf(parent)).toEqual([child, other].sort());
    });

    test('removes a child role, which revokes its membership', async () => {
      const modal = settings.roles.childRolesModal(parent);
      await modal.removeButton(child).click();
      await expect(modal.members).toHaveCount(0);
      await expect(modal.emptyNote).toBeVisible();
      await modal.button('Save').click();

      await modal.expectClosed();
      await expect(settings.roles.row(parent).childRoles).toHaveCount(0);
      expect(await childRolesOf(parent)).toEqual([]);
    });

    test('offers every other role once', async () => {
      const modal = settings.roles.childRolesModal(parent);
      await modal.addButton.click();

      await expect(modal.candidate(other)).toBeEnabled();
      await expect(modal.candidate(child)).toBeDisabled();
      await expect(modal.candidate(parent)).toHaveCount(0);
    });

    test('cancelling keeps the membership and discards the changes', async () => {
      const modal = settings.roles.childRolesModal(parent);
      await modal.removeButton(child).click();
      await modal.add(other);
      await modal.button('Cancel').click();

      await modal.expectClosed();
      await expect(settings.roles.row(parent).childRoles).toHaveText([child]);
      expect(await childRolesOf(parent)).toEqual([child]);

      await settings.roles.row(parent).editChildRolesButton.click();
      await expect(modal.members).toHaveText([child]);
      await expect(modal.unsavedNote).toHaveCount(0);
    });
  });
});
