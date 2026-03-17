import { defineTest, getBaseURL } from '../../framework/src';
import { loginViaHttp } from '../db/queries';
import { LoginPage } from '../pages/login.page';
import { install } from './install';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export interface LoginOutcome {
  sessionId: string;
  csrfToken: string;
  username: string;
  password: string;
}

export const login = defineTest({
  code: 'login',
  params: { user: 'admin' },
  primaryParams: ['user'],
  requires: () => [install],

  fixture: async (context, params): Promise<LoginOutcome> => {
    const installData = context.get(install);
    const username = params.user;
    const password =
      username === installData.username
        ? installData.password
        : 'mathesar_password';
    const { sessionId, csrfToken } = await loginViaHttp(
      getBaseURL(),
      username,
      password,
    );
    return { sessionId, csrfToken, username, password };
  },

  flow: async (page, context, params) => {
    const installData = context.get(install);
    const username = params.user;
    const password =
      username === installData.username
        ? installData.password
        : 'mathesar_password';

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);

    await expect(page).not.toHaveURL(/login/);
  },
});

/**
 * Set up authentication cookies on a Playwright page using login outcome data.
 * Call this in any flow that requires a logged-in session.
 */
export async function setupAuth(page: Page, loginOutcome: LoginOutcome) {
  const baseURL = getBaseURL();
  await page.context().addCookies([
    { name: 'sessionid', value: loginOutcome.sessionId, url: baseURL },
    { name: 'csrftoken', value: loginOutcome.csrfToken, url: baseURL },
  ]);
}
