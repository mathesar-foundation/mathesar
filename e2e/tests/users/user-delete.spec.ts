import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { pinsKnownBug } from '../../support/known-bugs';
import { failRpcMethod } from '../../support/rpc-failures';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import { Toasts } from '../../support/ui/components/toast';
import { EditUserPage } from '../../support/ui/pages/edit-user-page';
import { UsersPage } from '../../support/ui/pages/users-page';

test.describe('deletion of a user in the administration', () => {
  let user: User;
  let editUserPage: EditUserPage;

  test.beforeEach(async ({ page, api }) => {
    // The createUser fixture would fail when it deletes a user that is gone.
    user = await api.createUser();
    editUserPage = new EditUserPage(page);
    await editUserPage.goto(user);
  });

  test.afterEach(async ({ api }) => {
    await api.deleteUserNamed(user.username);
  });

  test('deletes the user after confirmation and returns to the list', async ({
    page,
    api,
  }) => {
    const { deleteModal } = editUserPage;
    await editUserPage.deleteButton.click();
    await expect(deleteModal.title).toHaveText(`Delete User ${user.username}?`);
    await expect(deleteModal.body).toHaveText(
      'Are you sure you want to proceed?',
    );
    await deleteModal.button('Delete User').click();

    await deleteModal.expectClosed();
    await expect(page).toHaveURL('/administration/users/');
    const usersPage = new UsersPage(page);
    await expect(usersPage.rows).not.toHaveCount(0);
    await expect(usersPage.row(user.username)).toHaveCount(0);
    expect(await api.findUser(user.username)).toBeUndefined();
  });

  test('keeps the user when the confirmation is dismissed with Escape', async ({
    page,
    api,
  }) => {
    await editUserPage.deleteButton.click();
    await editUserPage.deleteModal.expectOpen();
    await page.keyboard.press('Escape');

    await editUserPage.deleteModal.expectClosed();
    await expect(editUserPage.heading).toBeVisible();
    expect(await api.findUser(user.username)).toBeDefined();
  });

  test.describe('that the server refuses', () => {
    test.beforeEach(async ({ page }) => {
      await failRpcMethod(page, 'users.delete', 'The user owns objects');
      await editUserPage.deleteButton.click();
      await editUserPage.deleteModal.button('Delete User').click();
      await new Toasts(page).expectMessage('The user owns objects');
      await editUserPage.deleteModal.expectClosed();
      await expect(editUserPage.heading).toBeVisible();
    });

    test(
      'is reported in a toast and leaves the list of users loading',
      pinsKnownBug('user-delete-failure-list-stuck'),
      async ({ page, api }) => {
        const usersPage = new UsersPage(page);
        await new AdminNavigation(page).item('Users').click();

        await expect(usersPage.heading).toHaveText(/^Users \(\d+\)$/);
        await expect(usersPage.loadingSkeleton).toBeVisible();
        await expect(usersPage.rows).toHaveCount(0);
        expect(await api.findUser(user.username)).toBeDefined();
      },
    );

    test.fixme('is reported in a toast and keeps the user in the list', async ({
      page,
      api,
    }) => {
      await new AdminNavigation(page).item('Users').click();

      await expect(new UsersPage(page).row(user.username)).toBeVisible();
      expect(await api.findUser(user.username)).toBeDefined();
    });
  });
});
