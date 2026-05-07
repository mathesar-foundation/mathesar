import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { InstallationPage } from '../interactions/regions/installation.page';
import { expect } from '@playwright/test';
import { AuthSession } from '../resources/auth';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'mathesar_password';

export const install = defineTask({
  code: 'install',
  params: z.object({}),
  outcome: z.object({
    session: AuthSession.schema,
  }),

  // install's lasting effect is server-side (the superuser row) and is
  // persistent — future test runs don't need the wizard to be re-executed.
  // The browser-side session Django sets during the wizard is transient and
  // intentionally NOT restored here: install's only caller is `login`, and
  // login.task navigates to /auth/login/ to sign in from scratch. If we
  // re-established the session here, Django would redirect away from the
  // login page and login.task would hang waiting for the username field.
  //
  // Any task needing an authenticated session must compose `login`, which
  // has its own restoreFn. This no-op exists solely so the framework knows
  // install's state-change (cookies set by the wizard) is intentional and
  // does not need replaying.
  restore: async () => {},

  task: async (t) => {
    return await t.action(
      'Set up superuser and complete installation',
      {
        schema: z.object({ session: AuthSession.schema }),
        resource: AuthSession.creates('session'),
        fn: async ({ page }) => {
          await page.goto('/');
          await expect(page).toHaveURL(/complete_installation/);

          const installation = new InstallationPage(page);
          await expect(installation.heading).toContainText(
            'Finish Setting Up Mathesar',
          );
          await installation.completeInstallation(DEFAULT_USERNAME, DEFAULT_PASSWORD);

          await expect(page).not.toHaveURL(/complete_installation/);

          return {
            session: {
              username: DEFAULT_USERNAME,
              password: DEFAULT_PASSWORD,
            },
          };
        },
      },
    );
  },

  standalone: { params: {} },
});
