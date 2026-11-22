import type { Page } from '@playwright/test';

import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { pinsKnownBug } from '../../support/known-bugs';
import { AuthFrame } from '../../support/ui/components/auth-frame';
import { UserMenu } from '../../support/ui/components/user-menu';
import { LoginPage } from '../../support/ui/pages/login-page';
import { ProfilePage } from '../../support/ui/pages/profile-page';

test.describe('profile page of a standard user', () => {
  let user: User;
  let page: Page;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ createUser, signInAs }) => {
    user = await createUser({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
    });
    page = await signInAs(user);
    await expect(page).toHaveURL('/');
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('shows the details of the signed-in user and how to get the account deleted', async () => {
    const { details } = profilePage;
    await expect(profilePage.heading).toHaveText('User Profile');
    await expect(details.displayName).toHaveValue('Grace Hopper');
    await expect(details.email).toHaveValue('grace@example.com');
    await expect(details.username).toHaveValue(user.username);
    await expect(details.displayLanguage).toHaveText('English (en)');
    await expect(details.admin).not.toBeChecked();
    await expect(details.admin).toBeDisabled();
    await expect(profilePage.deleteAccountHeading).toBeVisible();
    await expect(profilePage.deleteAccountHint).toBeVisible();
  });

  test(
    'has a title that ends with "mathesar" in lower case',
    pinsKnownBug('profile-title-lower-case'),
    async () => {
      await expect(page).toHaveTitle(`${user.username} | mathesar`);
    },
  );

  test.fixme('has a title that ends with "Mathesar"', async () => {
    await expect(page).toHaveTitle(`${user.username} | Mathesar`);
  });

  test('changes the display name, email address and username of the signed-in user', async ({
    api,
  }) => {
    const { details } = profilePage;
    const newUsername = `${user.username}_renamed`;
    await details.displayName.fill('Grace B. Hopper');
    await details.email.fill('hopper@example.com');
    await details.username.fill(newUsername);
    await details.saveButton.click();

    await expect(details.saveButton).toBeHidden();
    await expect(details.username).toHaveValue(newUsername);
    const userMenu = new UserMenu(page);
    await userMenu.open();
    await expect(userMenu.link(newUsername)).toBeVisible();
    expect(await api.findUser(newUsername)).toMatchObject({
      id: user.id,
      fullName: 'Grace B. Hopper',
      email: 'hopper@example.com',
    });

    await page.reload();
    await expect(details.displayName).toHaveValue('Grace B. Hopper');
  });

  test('switches the app to the chosen language at once and keeps it after a reload', async ({
    api,
  }) => {
    await profilePage.details.chooseDisplayLanguage('French (fr)');
    await profilePage.details.saveButton.click();

    await expect(profilePage.heading).toHaveText('Profil utilisateur');
    expect(await api.findUser(user.username)).toMatchObject({
      displayLanguage: 'fr',
    });

    await page.reload();
    await expect(profilePage.heading).toHaveText('Profil utilisateur');
  });

  test('changes the password and asks to log in again', async () => {
    const { password } = profilePage;
    const newPassword = 'chosen-by-the-user';
    await password.changePasswordButton.click();
    await expect(password.warning).toHaveText(
      "You'll be redirected to the login page once you change your password.",
    );
    await password.oldPassword.fill(user.password);
    await password.newPassword.fill(newPassword);
    await password.confirmation.fill(newPassword);
    await password.saveButton.click();

    const loginPage = new LoginPage(page);
    await expect(page).toHaveURL('/auth/login/?next=/profile/');
    await loginPage.logIn(user);
    await expect(new AuthFrame(page).errorMessage).toBeVisible();

    await loginPage.logIn({ username: user.username, password: newPassword });
    await expect(page).toHaveURL('/profile/');
  });

  test('keeps the password when the old password is wrong', async () => {
    const { password } = profilePage;
    await password.changePasswordButton.click();
    await password.oldPassword.fill('not the old password');
    await password.newPassword.fill('chosen-by-the-user');
    await password.confirmation.fill('chosen-by-the-user');
    await password.saveButton.click();

    await expect(password.errors).toHaveText(
      'Exception: Old password is incorrect',
    );
    await expect(password.newPassword).toHaveValue('chosen-by-the-user');

    // A changed password would have ended the session.
    await page.reload();
    await expect(profilePage.details.username).toHaveValue(user.username);
  });

  test('needs the old password and the new password twice', async () => {
    const { password } = profilePage;
    await password.changePasswordButton.click();
    await expect(password.saveButton).toBeDisabled();

    await password.oldPassword.fill(user.password);
    await password.newPassword.fill('chosen-by-the-user');
    await expect(password.saveButton).toBeDisabled();

    await password.confirmation.fill('chosen-by-the-usr');
    await expect(password.errors).toHaveText([
      'Passwords do not match',
      'Passwords do not match',
    ]);
    await expect(password.saveButton).toBeDisabled();

    await password.confirmation.fill('chosen-by-the-user');
    await expect(password.errors).toHaveCount(0);
    await expect(password.saveButton).toBeEnabled();
  });
});

test('the profile page of an admin shows the role and no hint about deletion', async ({
  createUser,
  signInAs,
}) => {
  const page = await signInAs(await createUser({ isAdmin: true }));
  await expect(page).toHaveURL('/');
  const profilePage = new ProfilePage(page);
  await profilePage.goto();

  await expect(profilePage.details.admin).toBeChecked();
  await expect(profilePage.details.admin).toBeDisabled();
  await expect(profilePage.deleteAccountHeading).toBeHidden();
  await expect(profilePage.deleteAccountHint).toBeHidden();
});
