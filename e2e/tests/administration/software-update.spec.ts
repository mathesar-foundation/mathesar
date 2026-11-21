import { expect, test } from '../../support/fixtures';
import {
  stubGitHubReleases,
  stubUnknownRelease,
  stubUnreachableGitHub,
} from '../../support/github-releases';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import { Toasts } from '../../support/ui/components/toast';
import { UserMenu } from '../../support/ui/components/user-menu';
import { SoftwareUpdatePage } from '../../support/ui/pages/software-update-page';

const newerRelease = { tagName: '99.0.0', publishedAt: '2026-03-04T00:00:00Z' };

/** What `fetch` rejects with when a request fails. The toast shows the browser's text. */
const FAILED_FETCH = {
  chromium: 'Failed to fetch',
  firefox: 'NetworkError when attempting to fetch resource.',
  webkit: 'Load failed',
};

// The fixtures answer GitHub with the running version, released on 2026-01-01.
test.describe('Software Update page', () => {
  let updatePage: SoftwareUpdatePage;
  let runningVersion: string;

  test.beforeEach(async ({ page, api }) => {
    updatePage = new SoftwareUpdatePage(page);
    runningVersion = await api.version();
  });

  test('reports that the running version is the latest release', async ({
    page,
  }) => {
    await updatePage.goto();

    const box = updatePage.releaseBox('You are running the latest version');
    await expect(box.root).toContainText(runningVersion);
    await expect(box.root).toContainText('Released 1/1/2026');
    await expect(box.notesLink).toHaveText('Release Notes');
    await expect(box.notesLink).toHaveAttribute(
      'href',
      `https://docs.mathesar.org/releases/${runningVersion}/`,
    );
    await expect(updatePage.releaseBoxes).toHaveCount(1);
    await expect(updatePage.lastChecked).toBeVisible();
    await expect(new UserMenu(page).triggerUpgradeDot).toBeHidden();
  });

  test('announces a newer release next to the installed version', async ({
    page,
  }) => {
    await stubGitHubReleases(page.context(), newerRelease);
    await updatePage.goto();

    const upgrade = updatePage.releaseBox('New Version Available');
    await expect(upgrade.root).toContainText('99.0.0');
    await expect(upgrade.root).toContainText('Released 3/4/2026');
    await expect(upgrade.notesLink).toHaveText(
      'Release Notes and Upgrade Instructions',
    );
    await expect(upgrade.notesLink).toHaveAttribute(
      'href',
      'https://docs.mathesar.org/releases/99.0.0/',
    );
    const installed = updatePage.releaseBox('Currently Installed');
    await expect(installed.root).toContainText(runningVersion);
    await expect(installed.notesLink).toHaveText('Release Notes');
  });

  test('marks the header menu and the navigation while a newer release exists', async ({
    page,
  }) => {
    await stubGitHubReleases(page.context(), newerRelease);
    await page.goto('/profile/');

    const userMenu = new UserMenu(page);
    await expect(userMenu.triggerUpgradeDot).toBeVisible();
    await userMenu.open();
    await expect(userMenu.administrationUpgradeDot).toBeVisible();

    await userMenu.administrationLink.click();
    await expect(updatePage.heading).toBeVisible();
    await expect(new AdminNavigation(page).upgradeDot).toBeVisible();
  });

  test('keeps the result of the last check after a reload', async ({
    page,
  }) => {
    await stubGitHubReleases(page.context(), newerRelease);
    await updatePage.goto();
    await expect(
      updatePage.releaseBox('New Version Available').root,
    ).toBeVisible();

    await stubGitHubReleases(page.context());
    await page.reload();
    await expect(
      updatePage.releaseBox('New Version Available').root,
    ).toBeVisible();
  });

  test('asks GitHub again after a reload once the last check is more than a day old', async ({
    page,
  }) => {
    await page.clock.install();
    await stubGitHubReleases(page.context(), newerRelease);
    await updatePage.goto();
    await expect(
      updatePage.releaseBox('New Version Available').root,
    ).toBeVisible();

    await stubGitHubReleases(page.context());
    await page.clock.fastForward('23:00:00');
    await page.reload();
    await expect(
      updatePage.releaseBox('New Version Available').root,
    ).toBeVisible();

    await page.clock.fastForward('02:00:00');
    await page.reload();
    await expect(
      updatePage.releaseBox('You are running the latest version').root,
    ).toBeVisible();
    await expect(updatePage.releaseBoxes).toHaveCount(1);
  });

  test('Check for Updates asks GitHub again and updates the page', async ({
    page,
  }) => {
    await stubGitHubReleases(page.context(), newerRelease);
    await updatePage.goto();
    await expect(
      updatePage.releaseBox('New Version Available').root,
    ).toBeVisible();

    await stubGitHubReleases(page.context());
    await updatePage.checkForUpdatesButton.click();

    await expect(
      updatePage.releaseBox('You are running the latest version').root,
    ).toBeVisible();
    await expect(updatePage.releaseBoxes).toHaveCount(1);
    await expect(new UserMenu(page).triggerUpgradeDot).toBeHidden();
    await expect(new AdminNavigation(page).upgradeDot).toBeHidden();
  });

  test('says when the latest release cannot be loaded', async ({ page }) => {
    await stubUnknownRelease(page.context(), 'latest');
    await updatePage.goto();

    await expect(
      updatePage.releaseBox('Currently Installed').root,
    ).toContainText(runningVersion);
    await expect(updatePage.error).toHaveText(
      'Unable to load data about the latest release.',
    );
  });

  test('says when GitHub does not know the running version', async ({
    page,
  }) => {
    await stubGitHubReleases(page.context(), newerRelease);
    await stubUnknownRelease(page.context(), 'running');
    await updatePage.goto();

    await expect(updatePage.error).toHaveText(
      `The currently-installed version is ${runningVersion} but we were unable to load data about this release.`,
    );
    await expect(
      updatePage.releaseBox('Latest Available Version (not installed)').root,
    ).toContainText('99.0.0');
  });

  test('keeps the last result and shows a toast when GitHub is unreachable', async ({
    page,
    browserName,
  }) => {
    await updatePage.goto();
    await expect(updatePage.releaseBoxes).toHaveCount(1);

    await stubUnreachableGitHub(page.context());
    await updatePage.checkForUpdatesButton.click();

    await new Toasts(page).expectMessage(FAILED_FETCH[browserName]);
    await expect(
      updatePage.releaseBox('You are running the latest version').root,
    ).toBeVisible();
  });
});
