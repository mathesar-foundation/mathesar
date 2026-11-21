import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import { EditUserPage } from '../../support/ui/pages/edit-user-page';
import { PasswordResetPage } from '../../support/ui/pages/password-reset-page';
import { UsersPage } from '../../support/ui/pages/users-page';

test.describe('page of a user in the administration', () => {
  let user: User;
  let editUserPage: EditUserPage;

  test.beforeEach(async ({ page, createUser }) => {
    user = await createUser({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    editUserPage = new EditUserPage(page);
    await editUserPage.goto(user);
    await expect(editUserPage.details.displayName).toHaveValue('Ada Lovelace');
  });

  test('changes the display name, the email address and the username', async ({
    page,
    api,
  }) => {
    const { details } = editUserPage;
    const newUsername = `${user.username}_renamed`;
    await details.displayName.fill('Ada King');
    await details.email.fill('ada.king@example.com');
    await details.username.fill(newUsername);
    await details.saveButton.click();

    await expect(details.saveButton).toBeHidden();
    await expect(editUserPage.heading).toHaveText(`Edit User: ${newUsername}`);
    await expect(editUserPage.breadcrumb(newUsername)).toBeVisible();
    expect(await api.findUser(newUsername)).toMatchObject({
      id: user.id,
      fullName: 'Ada King',
      email: 'ada.king@example.com',
    });

    await page.reload();
    await expect(details.displayName).toHaveValue('Ada King');
  });

  test('offers Save and Discard Changes only while there are changes', async ({
    api,
  }) => {
    const { details } = editUserPage;
    await expect(details.saveButton).toBeHidden();
    await expect(details.discardButton).toBeHidden();

    await details.displayName.fill('Ada King');
    await expect(details.saveButton).toBeEnabled();
    await details.discardButton.click();

    await expect(details.displayName).toHaveValue('Ada Lovelace');
    await expect(details.saveButton).toBeHidden();
    expect(await api.findUser(user.username)).toMatchObject({
      fullName: 'Ada Lovelace',
    });
  });

  test('makes a standard user an admin', async ({ page, api }) => {
    const { details } = editUserPage;
    await details.admin.check();
    await details.saveButton.click();

    await expect(details.saveButton).toBeHidden();
    expect(await api.findUser(user.username)).toMatchObject({ isAdmin: true });
    await new AdminNavigation(page).item('Users').click();
    await expect(new UsersPage(page).row(user.username)).toContainText('Admin');
  });

  test('changes the display language of the user, not of the administrator', async ({
    api,
  }) => {
    const { details } = editUserPage;
    await details.chooseDisplayLanguage('Japanese (ja)');
    await details.saveButton.click();

    await expect(details.saveButton).toBeHidden();
    expect(await api.findUser(user.username)).toMatchObject({
      displayLanguage: 'ja',
    });
    await expect(details.displayLanguage).toHaveText('Japanese (ja)');
    await expect(editUserPage.heading).toHaveText(
      `Edit User: ${user.username}`,
    );
  });

  test('sets a password that the user must replace at the next login', async ({
    signInAs,
  }) => {
    const { password } = editUserPage;
    await password.changePasswordButton.click();
    await expect(password.warning).toHaveText(
      'Resetting the password will prompt the user to change their password on their next login.',
    );
    await expect(password.oldPassword).toBeHidden();
    await password.newPassword.fill('reset-by-an-admin');
    await password.confirmation.fill('reset-by-an-admin');
    await password.saveButton.click();

    await expect(password.changePasswordButton).toBeVisible();
    await expect(password.newPassword).toBeHidden();
    const userPage = await signInAs({
      username: user.username,
      password: 'reset-by-an-admin',
    });
    await new PasswordResetPage(userPage).expectShown();
  });

  test('keeps the password when the password form is cancelled', async ({
    signInAs,
  }) => {
    const { password } = editUserPage;
    await password.changePasswordButton.click();
    await password.newPassword.fill('never-saved');
    await password.confirmation.fill('never-saved');
    await password.cancelButton.click();

    await expect(password.changePasswordButton).toBeVisible();
    await expect(password.newPassword).toBeHidden();
    const userPage = await signInAs(user);
    await expect(userPage).toHaveURL('/');
  });

  test('shows the typed passwords again when the cancelled form is reopened', async () => {
    const { password } = editUserPage;
    await password.changePasswordButton.click();
    await password.newPassword.fill('never-saved');
    await password.confirmation.fill('never-saved');
    await password.cancelButton.click();
    await password.changePasswordButton.click();

    await expect(password.newPassword).toHaveValue('never-saved');
    await expect(password.confirmation).toHaveValue('never-saved');
  });
});

test('says that a user was not found for an unknown id', async ({ page }) => {
  const editUserPage = new EditUserPage(page);
  await editUserPage.goto({ id: 2147483647 });

  await expect(editUserPage.notFoundMessage).toBeVisible();
});

test('an administrator can neither delete nor demote their own account', async ({
  createUser,
  signInAs,
}) => {
  const admin = await createUser({ isAdmin: true });
  const page = await signInAs(admin);
  await expect(page).toHaveURL('/');
  const editUserPage = new EditUserPage(page);
  await editUserPage.goto(admin);

  await expect(editUserPage.details.admin).toBeChecked();
  await expect(editUserPage.details.admin).toBeDisabled();
  await expect(editUserPage.password.changePasswordButton).toBeVisible();
  await expect(editUserPage.deleteButton).toBeHidden();
});
