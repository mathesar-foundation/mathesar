import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { login } from './login';
import { expect } from '@playwright/test';
import { AdminUsersPage, AddUserPage } from '../interactions/regions/admin-users.page';
import { AppUser } from '../resources/user';

const addUserParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  newUser: z.object({
    username: z.string(),
  }),
});

export const addUser = defineTask({
  code: 'add-user',
  params: addUserParams,
  outcome: z.object({
    user: AppUser.schema,
  }),

  task: async (t, params) => {
    await t.ensure(login, params.login);

    const created = await t.action(
      'Create a new user via the administration page',
      {
        schema: z.object({ user: AppUser.schema }),
        resource: AppUser.creates('user'),
        fn: async ({ page }) => {
          const adminUsers = new AdminUsersPage(page);
          await adminUsers.goto();
          await expect(adminUsers.heading).toBeVisible();

          await adminUsers.addUserLink.click();

          const addUserPage = new AddUserPage(page);
          await expect(addUserPage.heading).toBeVisible();

          const newTempPassword = 'test_password';
          await addUserPage.fillAndSubmit(
            params.newUser.username,
            newTempPassword,
          );

          await expect(page).not.toHaveURL(/\/new\//);

          return {
            user: {
              username: params.newUser.username,
              password: newTempPassword,
            },
          };
        },
      },
    );

    await t.check('New user appears in the users list', async ({ page }) => {
      const adminUsers = new AdminUsersPage(page);
      await adminUsers.goto();
      await expect(adminUsers.userLink(created.user.username)).toBeVisible();
    });

    await t.action(
      'Log out current admin session',
      {
        schema: z.object({}),
        fn: async ({ page }) => {
          await page.goto('/auth/logout/');
          return {};
        },
      },
    );

    await t.ensure(login, {
      user: created.user.username,
      password: created.user.password,
    });

    const updated = await t.action(
      'Complete forced password change for new user',
      {
        schema: z.object({ user: AppUser.schema }),
        resource: AppUser.updates('user'),
        fn: async ({ page }) => {
          await page.goto('/');
          await expect(
            page.getByRole('heading', { name: 'Update Your Password' }),
          ).toBeVisible();

          // Must use a different password so the next login step is a cache
          // MISS (different params) and actually executes instead of just
          // restoring cookies from the first login's cached outcome.
          const newPassword = `${created.user.password}_updated`;
          await page
            .getByRole('textbox', { name: 'New Password' })
            .fill(newPassword);
          await page.getByRole('textbox', { name: 'Confirm' }).fill(newPassword);
          await page.getByRole('button', { name: 'Update Password' }).click();

          await expect(page).toHaveURL(/login/);
          return {
            user: {
              username: created.user.username,
              password: newPassword,
            },
          };
        },
      },
    );

    await t.ensure(login, {
      user: updated.user.username,
      password: updated.user.password,
    });

    await t.check(
      'New user sees the databases page after login',
      async ({ page }) => {
        await expect(page).not.toHaveURL(/login/);
      },
    );

    return { user: updated.user };
  },

  standalone: {
    params: {
      login: { user: 'admin', password: 'mathesar_password' },
      newUser: {
        username: 'testuser',
      },
    },
  },
});
