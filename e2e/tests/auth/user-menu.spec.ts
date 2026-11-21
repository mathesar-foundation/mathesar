import type { Page } from '@playwright/test';

import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { UserMenu } from '../../support/ui/components/user-menu';
import { ProfilePage } from '../../support/ui/pages/profile-page';
import { databaseUrl, schemaUrl } from '../../support/ui/urls';

test.describe('header menu of a signed-in user', () => {
  let user: User;
  let page: Page;
  let userMenu: UserMenu;

  test.beforeEach(async ({ createUser, signInAs }) => {
    user = await createUser();
    page = await signInAs(user);
    userMenu = new UserMenu(page);
  });

  test('names the signed-in user and opens the profile page', async () => {
    await userMenu.open();
    await expect(userMenu.menu).toContainText('Signed in as');
    await userMenu.link(user.username).click();

    await expect(page).toHaveURL('/profile/');
    await expect(new ProfilePage(page).heading).toHaveText('User Profile');
  });

  test('links to the user guide, the community and the donation page in new tabs', async () => {
    await userMenu.open();

    const resources = [
      ['User Guide', 'https://docs.mathesar.org/user-guide/'],
      ['Community', 'https://mathesar.org/community'],
      ['Donate to Mathesar', 'https://mathesar.org/donate'],
    ] as const;
    for (const [name, url] of resources) {
      await expect(userMenu.link(name)).toHaveAttribute('href', url);
      await expect(userMenu.link(name)).toHaveAttribute('target', '_blank');
    }
  });

  test('closes with Escape', async () => {
    await userMenu.open();
    await page.keyboard.press('Escape');

    await expect(userMenu.menu).toBeHidden();
  });

  test('logs out and ends the session', async () => {
    await userMenu.logOut();
    await expect(page).toHaveURL('/auth/login/?next=/');

    await page.goto('/profile/');
    await expect(page).toHaveURL('/auth/login/?next=/profile/');
  });

  test('applies the chosen theme at once and keeps it after a reload', async () => {
    await userMenu.expectTheme('light');
    await userMenu.open();
    await userMenu.chooseTheme('Dark');

    await userMenu.expectTheme('dark');
    await expect(userMenu.themeSelect).toHaveText('Dark');

    await page.reload();
    await userMenu.expectTheme('dark');
    await userMenu.open();
    await expect(userMenu.themeSelect).toHaveText('Dark');
  });

  test('follows the color scheme of the system unless a theme is chosen', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await userMenu.expectTheme('dark');

    await userMenu.open();
    await userMenu.chooseTheme('Light');
    await userMenu.expectTheme('light');

    await userMenu.chooseTheme('System');
    await userMenu.expectTheme('dark');
  });
});

test('links to the database that is open', async ({
  page,
  database,
  schema,
}) => {
  await page.goto(schemaUrl(schema));
  const userMenu = new UserMenu(page);
  await userMenu.open();
  await expect(userMenu.menu).toContainText('Database');
  await userMenu.link(database.name).click();

  await expect(page).toHaveURL(databaseUrl(database));
});
