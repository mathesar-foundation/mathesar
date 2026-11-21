import { env } from '../../support/env';
import { expect, test } from '../../support/fixtures';
import { AuthFrame } from '../../support/ui/components/auth-frame';
import { UserMenu } from '../../support/ui/components/user-menu';
import { LoginPage } from '../../support/ui/pages/login-page';
import { ProfilePage } from '../../support/ui/pages/profile-page';

test.describe('login page for a logged-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let loginPage: LoginPage;
  let authFrame: AuthFrame;

  test.beforeEach(({ page }) => {
    loginPage = new LoginPage(page);
    authFrame = new AuthFrame(page);
  });

  test('shows the login form with the username focused', async ({ page }) => {
    await loginPage.goto();

    await expect(page).toHaveTitle('Mathesar - Login');
    await expect(authFrame.heading).toHaveText('Log in to Mathesar');
    await expect(loginPage.username).toBeFocused();
  });

  test('logs in with the username and password of a user', async ({
    page,
    createUser,
  }) => {
    const user = await createUser();
    await loginPage.goto();
    await loginPage.logIn(user);

    await expect(page).toHaveURL('/');
    const userMenu = new UserMenu(page);
    await userMenu.open();
    await expect(userMenu.link(user.username)).toBeVisible();
  });

  test('rejects a wrong password and keeps the username', async ({ page }) => {
    await loginPage.goto();
    await loginPage.logIn({
      username: env.admin.username,
      password: 'not the password',
    });

    await expect(authFrame.errorMessage).toContainText(
      'Please enter a correct username and password. Note that both fields may be case-sensitive.',
    );
    await expect(page).toHaveURL('/auth/login/');
    await expect(loginPage.username).toHaveValue(env.admin.username);
    await expect(loginPage.password).toHaveValue('');
  });

  test('asks for the missing password without sending the form', async () => {
    await loginPage.goto();
    await loginPage.username.fill(env.admin.username);
    await loginPage.submit.click();

    await expect(loginPage.password).toBeFocused();
    await expect(authFrame.errorMessage).toBeHidden();
  });

  for (const url of [
    '/',
    '/profile/',
    '/administration/users/',
    '/db/1/schemas/',
  ]) {
    test(`sends a visitor of ${url} to the login page`, async ({ page }) => {
      await page.goto(url);

      await expect(page).toHaveURL(`/auth/login/?next=${url}`);
      await expect(loginPage.submit).toBeVisible();
    });
  }

  test('returns to the requested page after login', async ({
    page,
    createUser,
  }) => {
    const user = await createUser();
    await page.goto('/profile/');
    await loginPage.username.fill(user.username);
    await loginPage.password.fill(user.password);
    await loginPage.password.press('Enter');

    await expect(page).toHaveURL('/profile/');
  });

  test('ignores a requested page on another site', async ({
    page,
    createUser,
  }) => {
    const user = await createUser();
    await page.goto('/auth/login/?next=https://example.com/');
    await loginPage.logIn(user);

    await expect(page).toHaveURL('/');
  });

  test('lists the languages by their own name', async () => {
    await loginPage.goto();

    await expect(authFrame.languageOptions).toHaveText([
      'English (en)',
      'español (es)',
      'français (fr)',
      '日本語 (ja)',
    ]);
    await expect(authFrame.languageSelect).toHaveValue('en');
  });

  test('shows the page in the chosen language and remembers the choice', async ({
    page,
  }) => {
    await page.goto('/auth/login/?next=/profile/');
    await authFrame.languageSelect.selectOption('fr');

    await expect(authFrame.heading).toHaveText('Se connecter à Mathesar');
    await expect(page).toHaveURL('/auth/login/?next=/profile/');

    await page.reload();
    await expect(authFrame.heading).toHaveText('Se connecter à Mathesar');
    await expect(authFrame.languageSelect).toHaveValue('fr');
  });

  test('shows the page in the language of the user who last used the app', async ({
    page,
    api,
    createUser,
  }) => {
    const user = await createUser();
    await api.setDisplayLanguage(user, 'fr');
    await page.goto('/profile/');
    await loginPage.logIn(user);
    await expect(new ProfilePage(page).heading).toHaveText(
      'Profil utilisateur',
    );

    await page.goto('/auth/logout/');
    await expect(authFrame.heading).toHaveText('Se connecter à Mathesar');
  });
});

test('sends a signed-in user from the login page to the home page', async ({
  page,
}) => {
  await new LoginPage(page).goto();

  await expect(page).toHaveURL('/');
});
