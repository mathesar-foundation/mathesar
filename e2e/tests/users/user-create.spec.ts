import { uniqueName } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { expect, test } from '../../support/fixtures';
import { pinsKnownBug } from '../../support/known-bugs';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import type { UserDetailsForm } from '../../support/ui/components/user-details-form';
import { EditUserPage } from '../../support/ui/pages/edit-user-page';
import { NewUserPage } from '../../support/ui/pages/new-user-page';
import { PasswordResetPage } from '../../support/ui/pages/password-reset-page';
import { UsersPage } from '../../support/ui/pages/users-page';

test.describe('new user form of the administration', () => {
  let form: UserDetailsForm;
  let username: string;
  const password = 'set-by-an-admin';

  test.beforeEach(async ({ page }) => {
    username = uniqueName('e2e_user');
    const newUserPage = new NewUserPage(page);
    form = newUserPage.form;
    await newUserPage.goto();
  });

  test.afterEach(async ({ api }) => {
    await api.deleteUserNamed(username);
  });

  test('creates a standard user with all details', async ({ page, api }) => {
    await form.displayName.fill('Newt Scamander');
    await form.email.fill('newt@example.com');
    await form.username.fill(username);
    await form.password.fill(password);
    await form.chooseDisplayLanguage('French (fr)');
    await form.saveButton.click();

    const editUserPage = new EditUserPage(page);
    await expect(page).toHaveURL(EditUserPage.urlPattern);
    await expect(editUserPage.heading).toHaveText(`Edit User: ${username}`);
    await expect(editUserPage.details.displayName).toHaveValue(
      'Newt Scamander',
    );
    await expect(editUserPage.details.email).toHaveValue('newt@example.com');
    await expect(editUserPage.details.displayLanguage).toHaveText(
      'French (fr)',
    );
    await expect(editUserPage.details.admin).not.toBeChecked();
    expect(await api.findUser(username)).toMatchObject({
      isAdmin: false,
      fullName: 'Newt Scamander',
      email: 'newt@example.com',
      displayLanguage: 'fr',
    });

    await new AdminNavigation(page).item('Users').click();
    await expect(new UsersPage(page).row(username)).toContainText(
      'Newt Scamander',
    );
  });

  test('creates an admin user', async ({ page, api }) => {
    await form.username.fill(username);
    await form.password.fill(password);
    await form.admin.check();
    await form.saveButton.click();

    const editUserPage = new EditUserPage(page);
    await expect(editUserPage.heading).toHaveText(`Edit User: ${username}`);
    await expect(editUserPage.details.admin).toBeChecked();
    expect(await api.findUser(username)).toMatchObject({
      isAdmin: true,
      displayLanguage: 'en',
    });
  });

  test('gives the user a password that must be replaced at the first login', async ({
    page,
    signInAs,
  }) => {
    await form.username.fill(username);
    await form.password.fill(password);
    await form.saveButton.click();
    await expect(page).toHaveURL(EditUserPage.urlPattern);

    const userPage = await signInAs({ username, password });
    await new PasswordResetPage(userPage).expectShown();
  });

  test('needs a username and a password', async () => {
    await expect(form.saveButton).toBeDisabled();

    await form.username.fill(username);
    await expect(form.saveButton).toBeDisabled();

    await form.password.fill(password);
    await expect(form.saveButton).toBeEnabled();

    await form.username.fill('');
    await expect(form.saveButton).toBeDisabled();
  });

  test('says what is wrong with an email address or a username', async () => {
    const invalidEmail = 'The email address is invalid.';
    await form.password.fill(password);
    await form.email.fill('not-an-email');
    await expect(form.errors).toHaveText([invalidEmail]);

    await form.username.fill('white space');
    await expect(form.errors).toHaveText([
      invalidEmail,
      'Username can only contain alphanumeric characters, , _, @, +, ., and -.',
    ]);

    await form.username.fill('x'.repeat(151));
    await expect(form.errors).toHaveText([
      invalidEmail,
      'Username cannot be longer than 150 characters.',
    ]);
    await expect(form.saveButton).toBeDisabled();

    await form.email.fill('newt@example.com');
    await form.username.fill(username);
    await expect(form.errors).toHaveCount(0);
    await expect(form.saveButton).toBeEnabled();
  });

  test('reports a username that is taken and stays on the form', async ({
    page,
  }) => {
    await form.username.fill(env.admin.username);
    await form.password.fill(password);
    await form.saveButton.click();

    await expect(form.errors).toContainText(
      `Key (username)=(${env.admin.username}) already exists.`,
    );
    await expect(page).toHaveURL('/administration/users/new/');
    await expect(form.username).toHaveValue(env.admin.username);
  });

  test(
    'answers a username of 64 characters with a database error',
    pinsKnownBug('username-longer-than-63-characters'),
    async ({ api }) => {
      username = username.padEnd(64, 'x');
      await form.username.fill(username);
      await form.password.fill(password);
      await form.saveButton.click();

      await expect(form.errors).toHaveText(
        'DataError: value too long for type character varying(63)',
      );
      expect(await api.findUser(username)).toBeUndefined();
    },
  );

  test.fixme('rejects a username that is longer than the server can store', async () => {
    await form.username.fill(username.padEnd(64, 'x'));
    await form.password.fill(password);

    await expect(form.errors).toHaveText(
      'Username cannot be longer than 63 characters.',
    );
    await expect(form.saveButton).toBeDisabled();
  });

  test('explains the Admin role in a tooltip', async () => {
    await form.adminHelp.hover();

    await expect(form.adminHelpTooltip).toContainText(
      'Admin users can perform some additional Mathesar-specific operations',
    );
  });
});
