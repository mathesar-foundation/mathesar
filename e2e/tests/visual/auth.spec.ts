import { LoginPage } from '../../support/ui/pages/login-page';
import { ProfilePage } from '../../support/ui/pages/profile-page';
import { ScreenshotAreas } from '../../support/ui/screenshot-areas';
import { expect, expectSettled, test } from './fixtures';

test.describe('a visitor without a session', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.username).toBeFocused();

    await expect(new ScreenshotAreas(page).loginCard).toHaveScreenshot(
      'login-form.png',
    );
  });
});

test('the profile page of a standard user', async ({
  createNamedUser,
  signInAs,
}) => {
  const user = await createNamedUser({
    username: 'visual_profile',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
  });
  const page = await signInAs(user);
  const profilePage = new ProfilePage(page);
  await profilePage.goto();
  await expect(profilePage.details.displayName).toHaveValue('Ada Lovelace');
  await expectSettled(page);

  await expect(page).toHaveScreenshot('profile-page.png');
});
