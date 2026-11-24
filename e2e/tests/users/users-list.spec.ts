import { type User, uniqueName } from '../../support/api/mathesar';
import { expect, test } from '../../support/fixtures';
import { failRpcMethod } from '../../support/rpc-failures';
import { EditUserPage } from '../../support/ui/pages/edit-user-page';
import { NewUserPage } from '../../support/ui/pages/new-user-page';
import { UsersPage } from '../../support/ui/pages/users-page';

test.describe('list of users in the administration', () => {
  let usersPage: UsersPage;
  let standardUser: User;
  let adminUser: User;
  let fullName: string;
  let email: string;

  test.beforeEach(async ({ page, createUser }) => {
    fullName = uniqueName('Zelda');
    email = `${uniqueName('zelda')}@example.com`;
    standardUser = await createUser({ fullName, email });
    adminUser = await createUser({ isAdmin: true });
    usersPage = new UsersPage(page);
    await usersPage.goto();
  });

  test('shows each user with display name, email address and role', async () => {
    const standardRow = usersPage.row(standardUser.username);
    await expect(standardRow).toContainText(fullName);
    await expect(standardRow).toContainText(email);
    await expect(standardRow).toContainText('Standard');
    await expect(usersPage.row(adminUser.username)).toContainText('Admin');
    await expect(usersPage.heading).toHaveText(
      `Users (${await usersPage.rows.count()})`,
    );
  });

  test('filters by username, display name or email address as the user types', async () => {
    await usersPage.search.fill(` ${standardUser.username.toUpperCase()} `);
    await expect(usersPage.rows).toHaveCount(1);
    await expect(usersPage.row(standardUser.username)).toBeVisible();
    await expect(usersPage.heading).toHaveText('Users (1)');

    await usersPage.search.fill(fullName);
    await expect(usersPage.rows).toHaveCount(1);
    await expect(usersPage.row(standardUser.username)).toBeVisible();
    await expect(usersPage.searchSummary).toHaveText(
      `1 user matches ${fullName}`,
    );

    await usersPage.search.fill(email);
    await expect(usersPage.rows).toHaveCount(1);
    await expect(usersPage.row(standardUser.username)).toBeVisible();
  });

  test('says when no user matches and lists all users again after Clear', async () => {
    await usersPage.search.fill('no such user');
    await expect(usersPage.rows).toHaveCount(0);
    await expect(usersPage.emptyState).toBeVisible();
    await expect(usersPage.searchSummary).toHaveText(
      '0 users match no such user',
    );
    await expect(usersPage.heading).toHaveText('Users');

    await usersPage.clearSearchButton.click();
    await expect(usersPage.search).toHaveValue('');
    await expect(usersPage.row(standardUser.username)).toBeVisible();
    await expect(usersPage.row(adminUser.username)).toBeVisible();
  });

  test('opens the page of a user', async ({ page }) => {
    await usersPage.row(standardUser.username).click();

    await expect(page).toHaveURL(`/administration/users/${standardUser.id}/`);
    await expect(new EditUserPage(page).heading).toHaveText(
      `Edit User: ${standardUser.username}`,
    );
  });

  test('opens the form for a new user', async ({ page }) => {
    await usersPage.addUserLink.click();

    await expect(page).toHaveURL('/administration/users/new/');
    await expect(new NewUserPage(page).heading).toBeVisible();
  });
});

test.describe('list of users that cannot be loaded', () => {
  test('shows the error of the server instead of the list', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await failRpcMethod(page, 'users.list', 'The users are out of reach');
    await usersPage.goto();

    await expect(usersPage.error).toHaveText('The users are out of reach');
    await expect(usersPage.heading).toHaveText('Users');
    await expect(usersPage.rows).toHaveCount(0);
    await expect(usersPage.search).toHaveCount(0);
    await expect(usersPage.addUserLink).toHaveCount(0);
  });
});
