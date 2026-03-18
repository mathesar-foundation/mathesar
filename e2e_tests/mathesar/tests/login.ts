import { z } from 'zod';
import { defineTest, getBaseURL } from '../../framework/src';
import { loginViaHttp } from '../db/queries';
import { LoginPage } from '../pages/login.page';
import { install } from './install';
import { expect } from '@playwright/test';

const loginParams = z.object({
  user: z.string(),
  password: z.string(),
});

const loginOutcome = z.object({
  sessionId: z.string(),
  csrfToken: z.string(),
  username: z.string(),
  password: z.string(),
});

export const login = defineTest({
  code: 'login',
  params: loginParams,
  outcome: loginOutcome,

  restore: async (page, outcome) => {
    const baseURL = getBaseURL();
    await page.context().addCookies([
      { name: 'sessionid', value: outcome.sessionId, url: baseURL },
      { name: 'csrftoken', value: outcome.csrfToken, url: baseURL },
    ]);
  },

  scenario: async (t, params) => {
    await t.step('Install Mathesar', install, {});

    return await t.action(
      'Fill credentials and log in',
      loginOutcome,
      async (page) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(params.user, params.password);

        await expect(page).not.toHaveURL(/login/);

        // Also perform HTTP login for session data
        const { sessionId, csrfToken } = await loginViaHttp(
          getBaseURL(),
          params.user,
          params.password,
        );

        return {
          sessionId,
          csrfToken,
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
