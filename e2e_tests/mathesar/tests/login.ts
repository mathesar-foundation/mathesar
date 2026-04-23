import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { LoginPage } from '../interactions/regions/login.page';
import { install } from './install';
import { expect } from '@playwright/test';
import { AuthSession } from '../resources/auth';

const loginParams = z.object({
  user: z.string(),
  password: z.string(),
});

export const login = defineTask({
  code: 'login',
  params: loginParams,
  outcome: z.object({
    session: AuthSession.schema,
  }),

  restore: async ({ page, baseURL }, outcome) => {
    await page.request.get(`${baseURL}/auth/login/`);
    const cookies = await page.context().cookies();
    const csrfToken = cookies.find((c) => c.name === 'csrftoken')?.value;

    const response = await page.request.post(`${baseURL}/auth/login/`, {
      form: {
        username: outcome.session.username,
        password: outcome.session.password,
        csrfmiddlewaretoken: csrfToken ?? '',
      },
      headers: {
        Referer: `${baseURL}/auth/login/`,
      },
    });
    if (!response.ok()) {
      throw new Error(`Login restore failed: ${response.status()}`);
    }
  },

  task: async (t, params) => {
    await t.ensure(install, {});

    return await t.action(
      'Fill credentials and log in',
      {
        schema: z.object({ session: AuthSession.schema }),
        resource: AuthSession.creates('session'),
        fn: async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
          await loginPage.login(params.user, params.password);

          await expect(page).not.toHaveURL(/login/);

          return {
            session: {
              username: params.user,
              password: params.password,
            },
          };
        },
      },
    );
  },

  standalone: {
    params: { user: 'admin', password: 'mathesar_password' },
  },
});
