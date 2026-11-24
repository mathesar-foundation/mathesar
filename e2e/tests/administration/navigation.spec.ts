import { expect, test } from '../../support/fixtures';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import { UserMenu } from '../../support/ui/components/user-menu';
import { AdminSettingsPage } from '../../support/ui/pages/admin-settings-page';
import { ProfilePage } from '../../support/ui/pages/profile-page';
import { SoftwareUpdatePage } from '../../support/ui/pages/software-update-page';
import { UsersPage } from '../../support/ui/pages/users-page';

test.describe('administration of an admin user', () => {
  test('opens on the Software Update page from the header menu', async ({
    page,
  }) => {
    await new ProfilePage(page).goto();
    const userMenu = new UserMenu(page);
    await userMenu.open();
    await userMenu.administrationLink.click();

    await expect(page).toHaveURL('/administration/update/');
    await expect(new SoftwareUpdatePage(page).heading).toBeVisible();
    await expect(page).toHaveTitle('Software Update | Mathesar');
  });

  test('switches between its pages with the side navigation', async ({
    page,
  }) => {
    await page.goto('/administration/');
    const navigation = new AdminNavigation(page);

    await navigation.item('Users').click();
    await expect(page).toHaveURL('/administration/users/');
    await expect(new UsersPage(page).heading).toContainText('Users');
    await expect(page).toHaveTitle('Users | Mathesar');

    await navigation.item('Settings').click();
    await expect(page).toHaveURL('/administration/settings/');
    await expect(new AdminSettingsPage(page).heading).toBeVisible();
    await expect(page).toHaveTitle('Settings | Mathesar');

    await navigation.item('Update').click();
    await expect(page).toHaveURL('/administration/update/');
    await expect(new SoftwareUpdatePage(page).heading).toBeVisible();
  });
});
