import { expect, test as setup } from '@playwright/test';

import { ADMIN_STORAGE_STATE } from '../../support/auth';
import { env } from '../../support/env';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { HomePage } from '../../support/ui/pages/home-page';
import { InstallationPage } from '../../support/ui/pages/installation-page';
import { LoginPage } from '../../support/ui/pages/login-page';

setup.describe.configure({ mode: 'serial' });

setup.describe('a new instance without users', () => {
  let installationPage: InstallationPage;

  setup.beforeEach(async ({ page, request }) => {
    const response = await request.get('/');
    const isNewInstance =
      new URL(response.url()).pathname === InstallationPage.path;
    setup.skip(!isNewInstance, 'This instance has a user already.');
    installationPage = new InstallationPage(page);
  });

  setup('sends every page to the installation page', async ({ page }) => {
    for (const path of ['/', '/auth/login/', '/administration/users/']) {
      await page.goto(path);
      await expect(page).toHaveURL(InstallationPage.path);
    }
    await expect(installationPage.heading).toHaveText(
      'Finish Setting Up Mathesar',
    );
    await expect(installationPage.installationReport).toBeChecked();
    await expect(installationPage.usageDataCollection).toBeChecked();
  });

  setup('shows the installation page in the chosen language', async () => {
    await installationPage.goto();
    await installationPage.language.selectOption('fr');
    await expect(installationPage.heading).toHaveText(
      'Fin du paramétrage de Mathesar',
    );

    await installationPage.language.selectOption('en');
    await expect(installationPage.heading).toHaveText(
      'Finish Setting Up Mathesar',
    );
  });

  setup('rejects a password that is too common', async ({ page }) => {
    await installationPage.goto();
    await installationPage.fillAccount(env.admin.username, 'password');
    await installationPage.submit.click();

    await expect(installationPage.form).toContainText(
      'This password is too common.',
    );
    await expect(page).toHaveURL(InstallationPage.path);
  });

  setup('rejects two passwords that differ', async ({ page }) => {
    await installationPage.goto();
    await installationPage.fillAccount(
      env.admin.username,
      env.admin.password,
      `${env.admin.password}-typo`,
    );
    await installationPage.submit.click();

    await expect(installationPage.form).toContainText(
      'The two password fields didn’t match.',
    );
    await expect(page).toHaveURL(InstallationPage.path);
  });

  setup(
    'creates the admin user, signs in and opens the home page, which offers to connect a first database',
    async ({ page }) => {
      await installationPage.goto();
      await installationPage.fillAccount(
        env.admin.username,
        env.admin.password,
      );
      await installationPage.installationReport.uncheck();
      await installationPage.usageDataCollection.uncheck();
      await installationPage.submit.click();

      await expect(page).toHaveURL('/');
      await expect(
        page.getByText(`Welcome to Mathesar, ${env.admin.username}!`),
      ).toBeVisible();
      const homePage = new HomePage(page);
      await expect(homePage.emptyState).toContainText('No Databases Connected');
      await expect(homePage.connectDatabaseButton).toBeVisible();
      const { databases } = new Breadcrumb(page);
      await databases.open();
      await expect(databases.section('Databases')).toContainText(
        'No Databases Connected',
      );

      await installationPage.goto();
      await expect(page).toHaveURL('/');
    },
  );
});

setup('sign in as the admin user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.logIn(env.admin);
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
