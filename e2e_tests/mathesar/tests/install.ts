import { defineTest } from '../../framework/src';
import { createSuperuser } from '../db/queries';
import { InstallationPage } from '../pages/installation.page';
import { expect } from '@playwright/test';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'mathesar_password';

export interface InstallOutcome {
  userId: number;
  username: string;
  password: string;
}

export const install = defineTest<InstallOutcome>({
  code: 'install',

  fixture: async () => {
    const { userId, username } = await createSuperuser(
      DEFAULT_USERNAME,
      DEFAULT_PASSWORD,
    );
    return { userId, username, password: DEFAULT_PASSWORD };
  },

  flow: async (page) => {
    await page.goto('/');
    await expect(page).toHaveURL(/complete_installation/);

    const installPage = new InstallationPage(page);
    await expect(installPage.heading).toContainText(
      'Finish Setting Up Mathesar',
    );
    await installPage.completeInstallation(DEFAULT_USERNAME, DEFAULT_PASSWORD);

    await expect(page).not.toHaveURL(/complete_installation/);
  },
});
