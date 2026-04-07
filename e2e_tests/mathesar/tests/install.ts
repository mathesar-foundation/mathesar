import { z } from 'zod';
import { defineTest } from '../../framework/src';
import { InstallationView } from '../interactions/views/installation.view';
import { expect } from '@playwright/test';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'mathesar_password';

const installOutcome = z.object({
  username: z.string(),
  password: z.string(),
});

export const install = defineTest({
  code: 'install',
  params: z.object({}),
  outcome: installOutcome,

  scenario: async (t) => {
    return await t.action(
      'Set up superuser and complete installation',
      installOutcome,
      async ({ page }) => {
        // Browser flow: complete the installation wizard
        await page.goto('/');
        await expect(page).toHaveURL(/complete_installation/);

        const installation = new InstallationView(page);
        await expect(installation.heading).toContainText(
          'Finish Setting Up Mathesar',
        );
        await installation.completeInstallation(DEFAULT_USERNAME, DEFAULT_PASSWORD);

        await expect(page).not.toHaveURL(/complete_installation/);

        return {
          username: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        };
      },
    );
  },

  standalone: { params: {} },
});
