import { z } from 'zod';
import { defineTest } from '../../framework/src';
import { LoginPage } from '../interactions/regions/login.page';
import { install } from './install';
import { expect } from '@playwright/test';

const loginParams = z.object({
  user: z.string(),
  password: z.string(),
});

const loginOutcome = z.object({
  username: z.string(),
  password: z.string(),
});

export const login = defineTest({
  code: 'login',
  params: loginParams,
  outcome: loginOutcome,

  restore: async ({ page, baseURL }, outcome) => {
    // GET login page to obtain CSRF cookie
    await page.request.get(`${baseURL}/auth/login/`);
    const cookies = await page.context().cookies();
    const csrfToken = cookies.find((c) => c.name === 'csrftoken')?.value;

    // POST with credentials to establish a fresh session
    const response = await page.request.post(`${baseURL}/auth/login/`, {
      form: {
        username: outcome.username,
        password: outcome.password,
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

  scenario: async (t, params) => {
    await t.step('Install Mathesar', install, {});

    return await t.action(
      'Fill credentials and log in',
      loginOutcome,
      async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(params.user, params.password);

        await expect(page).not.toHaveURL(/login/);

        return {
          username: params.user,
          password: params.password,
        };
      },
    );
  },

  standalone: {
    params: { user: 'admin', password: 'mathesar_password' },
  },
});
