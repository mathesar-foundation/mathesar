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
