import { expect, test } from '../../support/fixtures';
import { Toasts } from '../../support/ui/components/toast';
import {
  AdminSettingsPage,
  SampleUsageReportPage,
} from '../../support/ui/pages/admin-settings-page';

test.describe('usage data collection setting', () => {
  // The setting belongs to the whole instance, so these tests take turns.
  test.describe.configure({ mode: 'default' });

  let settingsPage: AdminSettingsPage;
  let wasEnabled: boolean;

  test.beforeEach(async ({ page, api }) => {
    settingsPage = new AdminSettingsPage(page);
    wasEnabled = await api.isUsageDataCollectionEnabled();
  });

  test.afterEach(async ({ api }) => {
    await api.setUsageDataCollection(wasEnabled);
  });

  test('turns usage data collection on', async ({ page, api }) => {
    await api.setUsageDataCollection(false);
    await settingsPage.goto();
    await expect(settingsPage.usageDataCollection).not.toBeChecked();

    await settingsPage.usageDataCollection.check();
    await new Toasts(page).expectMessage(
      'Anonymous usage data collection enabled successfully',
    );
    await expect(settingsPage.usageDataCollection).toBeChecked();
    expect(await api.isUsageDataCollectionEnabled()).toBe(true);

    await page.reload();
    await expect(settingsPage.usageDataCollection).toBeChecked();
  });

  test('turns usage data collection off', async ({ page, api }) => {
    await api.setUsageDataCollection(true);
    await settingsPage.goto();
    await expect(settingsPage.usageDataCollection).toBeChecked();

    await settingsPage.usageDataCollection.uncheck();
    await new Toasts(page).expectMessage(
      'Usage data collection disabled successfully',
    );
    await expect(settingsPage.usageDataCollection).not.toBeChecked();
    expect(await api.isUsageDataCollectionEnabled()).toBe(false);

    await page.reload();
    await expect(settingsPage.usageDataCollection).not.toBeChecked();
  });
});

test('links to the collected data and to the privacy policy', async ({
  page,
}) => {
  const settingsPage = new AdminSettingsPage(page);
  await settingsPage.goto();

  await expect(settingsPage.collectedDataLink).toHaveAttribute(
    'href',
    'https://docs.mathesar.org/user-guide/usage-data-collection/',
  );
  await expect(settingsPage.privacyPolicyLink).toHaveAttribute(
    'href',
    'https://mathesar.org/privacy',
  );
});

test.describe('sample usage report', () => {
  test('shows an administrator what a report contains', async ({
    page,
    api,
  }) => {
    const reportPage = new SampleUsageReportPage(page);
    await reportPage.goto();

    await expect(reportPage.report).toContainText(
      `"mathesar_version": "${await api.version()}"`,
    );
    await expect(reportPage.report).toContainText('"user_count"');
  });

  test('is refused to a standard user', async ({ createUser, signInAs }) => {
    const page = await signInAs(await createUser());
    await expect(page).toHaveURL('/');

    const reportPage = new SampleUsageReportPage(page);
    await reportPage.goto();
    await expect(reportPage.report).toContainText(
      'Authentication failed when calling',
    );
  });
});
