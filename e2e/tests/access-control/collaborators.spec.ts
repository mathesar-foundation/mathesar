import type { StoredRole, User } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabaseSettingsPage } from '../../support/ui/pages/database-settings-page';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { expect, roleUsedBy, test } from './fixtures';

test.describe('collaborators of a database', () => {
  let settings: DatabaseSettingsPage;

  test.beforeEach(({ page }) => {
    settings = new DatabaseSettingsPage(page);
  });

  test('lists each collaborator with the user and the role', async ({
    api,
    database,
    createUser,
    collaborator,
  }) => {
    const named = await createUser({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
    });
    await api.addCollaborator(database, named, collaborator.role);
    await settings.goto(database, 'Collaborators');
    const { collaborators } = settings;

    await expect(collaborators.row('Grace Hopper').user).toHaveText(
      'Grace Hopper grace@example.com',
    );
    await expect(collaborators.row('Grace Hopper').role).toHaveText(
      collaborator.role.name,
    );
    await expect(collaborators.row(collaborator.user.username).role).toHaveText(
      collaborator.role.name,
    );
    await expect(collaborators.row(env.admin.username).role).toHaveText(
      env.postgres.user,
    );
  });

  test('names the button that changes the role in a tooltip', async ({
    page,
    database,
  }) => {
    await settings.goto(database, 'Collaborators');
    await settings.collaborators
      .row(env.admin.username)
      .changeRoleButton.hover();

    await expect(tooltip(page)).toHaveText('Change Role');
  });

  test.describe('adding a collaborator', () => {
    let user: User;
    let role: StoredRole;

    test.beforeEach(async ({ api, database, createUser, createRole }) => {
      user = await createUser();
      role = await api.storeRole(
        database,
        await createRole("LOGIN PASSWORD 'secret'"),
        'secret',
      );
      await settings.goto(database, 'Collaborators');
      await settings.collaborators.addButton.click();
    });

    test('adds a user, who then finds the database on the home page', async ({
      page,
      api,
      database,
      signInAs,
    }) => {
      const home = new HomePage(await signInAs(user));
      await expect(home.emptyState).toBeVisible();

      const { addModal } = settings.collaborators;
      await chooseOption(addModal.user, user.username);
      await chooseOption(addModal.role, role.name);
      await addModal.button('Add Collaborator').click();

      await addModal.expectClosed();
      await new Toasts(page).expectMessage('Collaborator added successfully');
      await expect(settings.collaborators.row(user.username).role).toHaveText(
        role.name,
      );
      expect(await api.listCollaborators(database)).toContainEqual({
        userId: user.id,
        storedRoleId: role.id,
      });
      await home.goto();
      await expect(home.card(database.name)).toBeVisible();
    });

    test('requires a user and a role', async () => {
      const { addModal } = settings.collaborators;
      const addButton = addModal.button('Add Collaborator');
      await expect(addModal.user).toBeFocused();
      await expect(addModal.user).toHaveText('Select User');
      await expect(addModal.role).toHaveText('Select Role');
      await expect(addButton).toBeDisabled();

      await chooseOption(addModal.user, user.username);
      await expect(addButton).toBeDisabled();

      await chooseOption(addModal.role, role.name);
      await expect(addButton).toBeEnabled();
    });

    test('does not let a collaborator be added twice', async () => {
      const { addModal } = settings.collaborators;
      await addModal.user.click();
      await addModal.userOption(env.admin.username).click();

      await expect(addModal.user).toHaveText('Select User');
    });

    test('cancelling adds no collaborator and empties the form', async ({
      api,
      database,
    }) => {
      const { addModal } = settings.collaborators;
      await chooseOption(addModal.user, user.username);
      await chooseOption(addModal.role, role.name);
      await addModal.button('Cancel').click();

      await addModal.expectClosed();
      await expect(settings.collaborators.row(user.username).user).toHaveCount(
        0,
      );
      expect(await api.listCollaborators(database)).not.toContainEqual(
        expect.objectContaining({ userId: user.id }),
      );

      await settings.collaborators.addButton.click();
      await expect(addModal.user).toHaveText('Select User');
      await expect(addModal.role).toHaveText('Select Role');
    });
  });

  test.describe('changing the role of a collaborator', () => {
    let otherRole: StoredRole;

    test.beforeEach(async ({ api, database, createRole, collaborator }) => {
      otherRole = await api.storeRole(
        database,
        await createRole("LOGIN PASSWORD 'secret'"),
        'secret',
      );
      await settings.goto(database, 'Collaborators');
      await settings.collaborators
        .row(collaborator.user.username)
        .changeRoleButton.click();
    });

    test('changes the role that the user reaches the database as', async ({
      page,
      api,
      database,
      collaborator: { user, role },
    }) => {
      const modal = settings.collaborators.changeRoleModal(user.username);
      await expect(modal.role).toHaveText(role.name);
      await chooseOption(modal.role, otherRole.name);
      await modal.button('Save').click();

      await modal.expectClosed();
      await new Toasts(page).expectMessage(
        'Role updated successfully for collaborator.',
      );
      await expect(settings.collaborators.row(user.username).role).toHaveText(
        otherRole.name,
      );
      expect(await api.listCollaborators(database)).toContainEqual({
        userId: user.id,
        storedRoleId: otherRole.id,
      });
      expect(await roleUsedBy(user, database)).toBe(otherRole.name);
    });

    test('cancelling keeps the role', async ({
      api,
      database,
      collaborator: { user, role },
    }) => {
      const modal = settings.collaborators.changeRoleModal(user.username);
      await chooseOption(modal.role, otherRole.name);
      await modal.button('Cancel').click();

      await modal.expectClosed();
      await expect(settings.collaborators.row(user.username).role).toHaveText(
        role.name,
      );
      expect(await api.listCollaborators(database)).toContainEqual({
        userId: user.id,
        storedRoleId: role.id,
      });

      await settings.collaborators.row(user.username).changeRoleButton.click();
      await expect(modal.role).toHaveText(role.name);
    });
  });

  test.describe('removing a collaborator', () => {
    test.beforeEach(async ({ database, collaborator }) => {
      await settings.goto(database, 'Collaborators');
      await settings.collaborators
        .row(collaborator.user.username)
        .removeButton.click();
    });

    test('removes the user, who then no longer finds the database', async ({
      page,
      api,
      database,
      signInAs,
      collaborator: { user, role },
    }) => {
      const home = new HomePage(await signInAs(user));
      await expect(home.card(database.name)).toBeVisible();

      const { removeModal } = settings.collaborators;
      await expect(removeModal.title).toHaveText(
        `Remove ${user.username} as a collaborator on the ${database.name} database?`,
      );
      await expect(removeModal.body).toContainText(
        `The associated PostgreSQL role ${role.name} will be unaffected.`,
      );
      await removeModal.button('Remove Collaborator').click();

      await removeModal.expectClosed();
      await new Toasts(page).expectMessage('Collaborator removed successfully');
      await expect(settings.collaborators.row(user.username).user).toHaveCount(
        0,
      );
      expect(await api.listCollaborators(database)).not.toContainEqual(
        expect.objectContaining({ userId: user.id }),
      );
      await home.goto();
      await expect(home.emptyState).toBeVisible();
    });

    test('keeps the collaborator when the confirmation is cancelled', async ({
      api,
      database,
      collaborator: { user, role },
    }) => {
      await settings.collaborators.removeModal.button('Cancel').click();

      await settings.collaborators.removeModal.expectClosed();
      await expect(
        settings.collaborators.row(user.username).user,
      ).toBeVisible();
      expect(await api.listCollaborators(database)).toContainEqual({
        userId: user.id,
        storedRoleId: role.id,
      });
    });
  });

  test('an admin who removes themselves loses the data until added again', async ({
    page,
    database,
  }) => {
    const databasePage = new DatabasePage(page);
    const layout = new DatabaseLayout(page);
    const { collaborators } = settings;
    await settings.goto(database, 'Collaborators');
    await collaborators.row(env.admin.username).removeButton.click();
    await collaborators.removeModal.button('Remove Collaborator').click();

    await expect(collaborators.emptyNote).toBeVisible();
    await layout.schemasTab.click();
    await expect(layout.schemasPanel).toContainText(
      'You have to be a collaborator on this database in order to access its data.',
    );

    await layout.settingsTab.click();
    await settings.sectionLink('Collaborators').click();
    await collaborators.addButton.click();
    await chooseOption(collaborators.addModal.user, env.admin.username);
    await chooseOption(collaborators.addModal.role, env.postgres.user);
    await collaborators.addModal.button('Add Collaborator').click();
    await collaborators.addModal.expectClosed();
    await layout.schemasTab.click();

    await expect(databasePage.schemaRow('public')).toBeVisible();
  });
});
