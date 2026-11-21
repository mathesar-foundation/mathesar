import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { pinsKnownBug } from '../../support/known-bugs';
import { AuthFrame } from '../../support/ui/components/auth-frame';
import { LoginPage } from '../../support/ui/pages/login-page';
import { PasswordResetPage } from '../../support/ui/pages/password-reset-page';

const loggedOut = { cookies: [], origins: [] };

test.describe('user whose password an administrator set', () => {
  test.use({ storageState: loggedOut });

  let user: User;
  let loginPage: LoginPage;
  let passwordResetPage: PasswordResetPage;
  let authFrame: AuthFrame;

  test.beforeEach(async ({ page, createUser }) => {
    user = await createUser({ mustChangePassword: true });
    loginPage = new LoginPage(page);
    passwordResetPage = new PasswordResetPage(page);
    authFrame = new AuthFrame(page);
    await loginPage.goto();
    await loginPage.logIn(user);
  });

  test('is asked for a new password at the first login', async () => {
    await passwordResetPage.expectShown();
    await expect(authFrame.heading).toHaveText('Update Your Password');
    await expect(passwordResetPage.explanation).toBeVisible();
    await expect(passwordResetPage.newPassword).toBeFocused();
  });

  test('cannot open another page before the password is changed', async ({
    page,
  }) => {
    for (const url of ['/', '/profile/', '/auth/login/']) {
      await page.goto(url);
      await passwordResetPage.expectShown();
    }
  });

  test('must type the new password twice', async () => {
    await passwordResetPage.setPassword('a-new-password-1', 'a-new-password-2');

    await expect(authFrame.fieldErrors).toHaveText(
      'The two password fields didn’t match.',
    );
    await passwordResetPage.expectShown();
  });

  test('cannot choose a weak password', async () => {
    const weakPasswords = [
      [
        'short1',
        'This password is too short. It must contain at least 8 characters.',
      ],
      ['password', 'This password is too common.'],
      ['82746519340', 'This password is entirely numeric.'],
      [user.username, 'The password is too similar to the username.'],
    ] as const;
    for (const [password, reason] of weakPasswords) {
      await passwordResetPage.setPassword(password);
      await expect(authFrame.fieldErrors).toContainText(reason);
    }
  });

  test('enters the app with the new password after logging in again', async ({
    page,
  }) => {
    const newPassword = 'a-new-password-1';
    await passwordResetPage.setPassword(newPassword);
    await expect(page).toHaveURL('/auth/login/');

    await loginPage.logIn(user);
    await expect(authFrame.errorMessage).toBeVisible();

    await loginPage.logIn({ username: user.username, password: newPassword });
    await expect(page).toHaveURL('/');
    await page.goto('/profile/');
    await expect(page).toHaveURL('/profile/');
  });
});

test('opens the password page for a user who does not have to change the password', async ({
  createUser,
  signInAs,
}) => {
  const page = await signInAs(await createUser());
  await expect(page).toHaveURL('/');

  const passwordResetPage = new PasswordResetPage(page);
  await passwordResetPage.goto();
  await passwordResetPage.expectShown();
});

test.describe('password page for a logged-out visitor', () => {
  test.use({ storageState: loggedOut });

  test(
    'shows the password form and answers it with a server error',
    pinsKnownBug('password-page-without-login'),
    async ({ page }) => {
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.goto();
      await passwordResetPage.expectShown();

      await passwordResetPage.setPassword('a-new-password-1');
      await expect(new AuthFrame(page).heading).toHaveText(
        'Server Error (500)',
      );
    },
  );

  test.fixme('sends the visitor to the login page', async ({ page }) => {
    await new PasswordResetPage(page).goto();

    await new LoginPage(page).expectShown();
  });
});
