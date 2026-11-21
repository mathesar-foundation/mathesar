import { expect, test as setup } from '@playwright/test';

import { ADMIN_STORAGE_STATE } from '../../support/auth';
import { env } from '../../support/env';
import { LoginPage } from '../../support/ui/pages/login-page';

setup('sign in as the admin user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.logIn(env.admin);
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
