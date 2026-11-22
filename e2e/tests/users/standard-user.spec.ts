import type { Page } from '@playwright/test';

import type { User } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { UserMenu } from '../../support/ui/components/user-menu';
import { ErrorPage } from '../../support/ui/pages/error-page';

test.describe('standard user', () => {
  let user: User;
  let page: Page;

  test.beforeEach(async ({ createUser, signInAs }) => {
    user = await createUser();
    page = await signInAs(user);
    await expect(page).toHaveURL('/');
  });

  test('has no Administration entry in the header menu', async () => {
    const userMenu = new UserMenu(page);
    await userMenu.open();

    await expect(userMenu.link(user.username)).toBeVisible();
    await expect(userMenu.administrationLink).toBeHidden();
  });

  test('finds no page at the URLs of the administration', async () => {
    const errorPage = new ErrorPage(page);
    const administrationUrls = [
      '/administration/',
      '/administration/update/',
      '/administration/users/',
      '/administration/users/new/',
      `/administration/users/${user.id}/`,
      '/administration/settings/',
    ];
    for (const url of administrationUrls) {
      await page.goto(url);
      await expect(errorPage.heading).toBeVisible();
      await expect(errorPage.message).toBeVisible();
    }

    await errorPage.homeLink.click();
    await expect(page).toHaveURL('/');
  });
});
