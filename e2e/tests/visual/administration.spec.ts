import { AdminSettingsPage } from '../../support/ui/pages/admin-settings-page';
import { SoftwareUpdatePage } from '../../support/ui/pages/software-update-page';
import { UsersPage } from '../../support/ui/pages/users-page';
import { ScreenshotAreas } from '../../support/ui/screenshot-areas';
import { expect, expectSettled, rewriteRpcResult, test } from './fixtures';

test('the list of users', async ({ page, createNamedUser }) => {
  const users = [
    {
      username: 'visual_users_ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      isAdmin: true,
    },
    { username: 'visual_users_alan', fullName: 'Alan Turing' },
    { username: 'visual_users_grace', email: 'grace@example.org' },
  ];
  for (const user of users) await createNamedUser(user);
  const usernames = users.map(({ username }) => username);
  // The list holds the users of all tests, in no fixed order.
  await rewriteRpcResult<{ username: string }[]>(page, 'users.list', (all) =>
    all
      .filter(({ username }) => usernames.includes(username))
      .sort((a, b) => a.username.localeCompare(b.username)),
  );
  const usersPage = new UsersPage(page);
  await usersPage.goto();
  await expect(usersPage.rows).toHaveCount(3);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('users-page.png');
});

test('the settings of the instance', async ({ page }) => {
  // Tests of the administration area switch the setting at the same time.
  await rewriteRpcResult(page, 'analytics.get_state', () => ({
    enabled: false,
  }));
  const settingsPage = new AdminSettingsPage(page);
  await settingsPage.goto();
  await expect(settingsPage.usageDataCollection).not.toBeChecked();
  await expectSettled(page);

  await expect(page).toHaveScreenshot('settings-page.png');
});

test('the software update page of the latest version', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-15T10:00:00Z'));
  const updatePage = new SoftwareUpdatePage(page);
  await updatePage.goto();
  await expect(
    updatePage.releaseBox('You are running the latest version').root,
  ).toBeVisible();
  await expect(updatePage.lastChecked).toBeVisible();
  await expectSettled(page);

  await expect(page).toHaveScreenshot('software-update-page.png', {
    mask: [new ScreenshotAreas(page).releaseVersions],
  });
});
