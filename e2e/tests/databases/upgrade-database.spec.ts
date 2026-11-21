import type { Database } from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { pinsKnownBug } from '../../support/known-bugs';
import { UpgradeDatabaseModal } from '../../support/ui/components/database-modals';
import { Toasts } from '../../support/ui/components/toast';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { HomePage } from '../../support/ui/pages/home-page';
import { databaseUrl } from '../../support/ui/urls';
import {
  SAMPLE_FUNCTION,
  expect,
  sampleFunctionOwners,
  test,
} from './fixtures';

// The bulk upgrade acts on the outdated databases of every test that runs at
// that moment, so the tests of this file run one after another.
test.describe.configure({ mode: 'default' });

test.describe('reinstall Mathesar schemas', () => {
  let homePage: HomePage;
  let modal: UpgradeDatabaseModal;

  test.beforeEach(async ({ page, database }) => {
    await runSql(database.name, `DROP FUNCTION ${SAMPLE_FUNCTION}`);
    homePage = new HomePage(page);
    modal = UpgradeDatabaseModal.toReinstall(page, database.name);
    await homePage.goto();
    await homePage.chooseCardAction(
      database.name,
      'Reinstall Mathesar Schemas',
    );
  });

  test('installs the code of Mathesar in the database again', async ({
    page,
    database,
  }) => {
    await expect(modal.body).toContainText(
      'Use this form to reinstall the Mathesar application code inside a PostgreSQL database.',
    );
    await modal.button('Reinstall').click();

    await expect(new Toasts(page).items).toHaveText(
      'Mathesar schemas reinstalled successfully',
    );
    await modal.expectClosed();
    expect(await sampleFunctionOwners(database.name)).toHaveLength(1);
  });

  test('requires the name and the password of a role that the user wants to specify', async () => {
    await expect(modal.roleName).toHaveCount(0);
    await modal.useRole.check();
    await expect(modal.button('Reinstall')).toBeDisabled();
    await modal.roleName.fill('any_role');
    await expect(modal.button('Reinstall')).toBeDisabled();
    await modal.rolePassword.fill('any password');
    await expect(modal.button('Reinstall')).toBeEnabled();

    await modal.useRole.uncheck();
    await expect(modal.roleName).toHaveCount(0);
    await expect(modal.button('Reinstall')).toBeEnabled();
  });

  test('shows the error of the server when the password of the role is wrong', async ({
    database,
  }) => {
    await modal.useRole.check();
    await modal.roleName.fill(env.postgres.user);
    await modal.rolePassword.fill('wrong');
    await modal.button('Reinstall').click();

    await expect(modal.footer).toContainText('OperationalError');
    await modal.expectOpen();
    await expect(modal.button('Reinstall')).toBeEnabled();
    expect(await sampleFunctionOwners(database.name)).toEqual([]);
  });

  test('reinstalls nothing when the form is cancelled', async ({
    database,
  }) => {
    await modal.button('Cancel').click();
    await modal.expectClosed();
    expect(await sampleFunctionOwners(database.name)).toEqual([]);
  });
});

test('reinstalls the schemas as the role that the user specifies', async ({
  page,
  api,
  externalDatabase,
}) => {
  await api.connectDatabase(externalDatabase);
  await runSql(externalDatabase.name, `DROP FUNCTION ${SAMPLE_FUNCTION}`);
  const homePage = new HomePage(page);
  const modal = UpgradeDatabaseModal.toReinstall(page, externalDatabase.name);
  await homePage.goto();
  await homePage.chooseCardAction(
    externalDatabase.name,
    'Reinstall Mathesar Schemas',
  );
  await modal.useRole.check();
  await modal.roleName.fill(env.postgres.user);
  await modal.rolePassword.fill(env.postgres.password);
  await modal.button('Reinstall').click();

  await modal.expectClosed();
  expect(await sampleFunctionOwners(externalDatabase.name)).toEqual([
    { owner: env.postgres.user },
  ]);
});

test.describe('databases that need an upgrade', () => {
  let homePage: HomePage;
  let outdated: Database;

  test.beforeEach(async ({ page, api, database, newDatabaseName }) => {
    // A second database that is up to date makes this "some", not "all".
    outdated = await api.createDatabase(newDatabaseName());
    await api.markAsNeedingUpgrade(outdated);
    homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.card(database.name)).toBeVisible();
  });

  test('marks the database, takes away its link and offers to upgrade', async () => {
    await expect(homePage.card(outdated.name)).toContainText(
      'Upgrade Required',
    );
    await expect(homePage.upgradeButton(outdated.name)).toBeVisible();
    await expect(homePage.cardLink(outdated.name)).toHaveCount(0);
    await expect(homePage.upgradeNotice).toContainText(
      'The Mathesar service has been upgraded.',
    );
    await expect(homePage.upgradeNotice).toContainText(
      'Some of your connected databases still require an upgrade to be used with Mathesar.',
    );
    await expect(homePage.bulkUpgradeButton).toHaveText(
      'Upgrade Remaining Databases',
    );
  });

  test('upgrades one database from its card', async ({ page, api }) => {
    const modal = UpgradeDatabaseModal.toUpgrade(page, outdated.name);
    await homePage.upgradeButton(outdated.name).click();
    await expect(modal.body).toContainText(
      'Use this form to upgrade the Mathesar application code inside a single PostgreSQL database.',
    );
    await modal.button('Upgrade Database').click();

    await expect(new Toasts(page).items).toHaveText(
      'Database upgraded successfully',
    );
    await modal.expectClosed();
    await expect(homePage.cardLink(outdated.name)).toBeVisible();
    await expect(homePage.upgradeButton(outdated.name)).toHaveCount(0);
    await expect(homePage.upgradeNotice).toHaveCount(0);
    expect(await api.findDatabase(outdated.name)).toMatchObject({
      needsUpgrade: false,
    });
  });

  test('upgrades all databases that need it at once', async ({
    page,
    api,
    newDatabaseName,
  }) => {
    const alsoOutdated = await api.createDatabase(newDatabaseName());
    await api.markAsNeedingUpgrade(alsoOutdated);
    await page.reload();
    await homePage.bulkUpgradeButton.click();
    const { bulkUpgradeModal } = homePage;
    await expect(bulkUpgradeModal.body).toContainText(
      'The following databases will be upgraded:',
    );
    await expect(bulkUpgradeModal.body).toContainText(outdated.name);
    await expect(bulkUpgradeModal.body).toContainText(alsoOutdated.name);
    await bulkUpgradeModal.button('Upgrade Databases').click();

    await bulkUpgradeModal.expectClosed();
    await expect(homePage.upgradeNotice).toHaveCount(0);
    await expect(homePage.cardLink(outdated.name)).toBeVisible();
    await expect(homePage.cardLink(alsoOutdated.name)).toBeVisible();
    expect(await api.findDatabase(alsoOutdated.name)).toMatchObject({
      needsUpgrade: false,
    });
  });

  test('upgrades nothing when the bulk upgrade is cancelled', async ({
    api,
  }) => {
    await homePage.bulkUpgradeButton.click();
    await homePage.bulkUpgradeModal.button('Cancel').click();

    await homePage.bulkUpgradeModal.expectClosed();
    await expect(homePage.upgradeButton(outdated.name)).toBeVisible();
    expect(await api.findDatabase(outdated.name)).toMatchObject({
      needsUpgrade: true,
    });
  });

  test('names the databases that the bulk upgrade could not upgrade', async ({
    api,
  }) => {
    await runSql(
      'postgres',
      `DROP DATABASE ${quoteIdentifier(outdated.name)} WITH (FORCE)`,
    );
    await homePage.bulkUpgradeButton.click();
    await homePage.bulkUpgradeModal.button('Upgrade Databases').click();

    const { bulkUpgradeErrorsModal } = homePage;
    await expect(bulkUpgradeErrorsModal.body).toContainText(
      'The errors are shown below for each database.',
    );
    await expect(bulkUpgradeErrorsModal.body).toContainText(outdated.name);
    await expect(bulkUpgradeErrorsModal.body).toContainText(
      'NoConnectionAvailable',
    );
    await homePage.bulkUpgradeModal.expectClosed();

    await bulkUpgradeErrorsModal.close();
    await expect(homePage.upgradeButton(outdated.name)).toBeVisible();
    expect(await api.findDatabase(outdated.name)).toMatchObject({
      needsUpgrade: true,
    });
  });
});

test.describe('reinstall from the page of a database that needs an upgrade', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page, api, database }) => {
    await api.markAsNeedingUpgrade(database);
    const layout = new DatabaseLayout(page);
    const modal = UpgradeDatabaseModal.toReinstall(page, database.name);
    homePage = new HomePage(page);
    await page.goto(databaseUrl(database));
    await layout.chooseAction('Reinstall Mathesar Schemas');
    await modal.button('Reinstall').click();
    await modal.expectClosed();
    await layout.homeLink.click();
  });

  test(
    'leaves the upgrade prompt on the home page until it is loaded again',
    pinsKnownBug('stale-upgrade-prompt-after-reinstall'),
    async ({ page, api, database }) => {
      await expect(homePage.upgradeButton(database.name)).toBeVisible();
      expect(await api.findDatabase(database.name)).toMatchObject({
        needsUpgrade: false,
      });

      await page.reload();
      await expect(homePage.cardLink(database.name)).toBeVisible();
      await expect(homePage.upgradeButton(database.name)).toHaveCount(0);
    },
  );

  test.fixme('takes the upgrade prompt off the home page', async ({
    database,
  }) => {
    await expect(homePage.cardLink(database.name)).toBeVisible();
    await expect(homePage.upgradeButton(database.name)).toHaveCount(0);
  });
});

test.describe('standard user whose database needs an upgrade', () => {
  test.beforeEach(async ({ api, database }) => {
    await api.markAsNeedingUpgrade(database);
  });

  test('is told to upgrade all databases', async ({
    collaborator,
    signInAs,
  }) => {
    const homePage = new HomePage(await signInAs(collaborator.user));
    await expect(homePage.upgradeNotice).toContainText(
      "Now you'll need to upgrade the Mathesar code inside each of your connected databases to continue using Mathesar.",
    );
  });

  test(
    'is offered upgrades that fail for lack of rights',
    pinsKnownBug('upgrade-offered-to-standard-users'),
    async ({ api, database, collaborator, signInAs }) => {
      const page = await signInAs(collaborator.user);
      const homePage = new HomePage(page);
      const modal = UpgradeDatabaseModal.toUpgrade(page, database.name);
      await expect(homePage.bulkUpgradeButton).toHaveText(
        'Upgrade All Databases',
      );
      await homePage.upgradeButton(database.name).click();
      await modal.button('Upgrade Database').click();

      await expect(modal.footer).toContainText(
        'Authentication failed when calling "databases.upgrade_sql"',
      );
      await modal.expectOpen();
      expect(await api.findDatabase(database.name)).toMatchObject({
        needsUpgrade: true,
      });
    },
  );

  test.fixme('is not offered an upgrade that only an admin can do', async ({
    database,
    collaborator,
    signInAs,
  }) => {
    const homePage = new HomePage(await signInAs(collaborator.user));
    await expect(homePage.card(database.name)).toContainText(
      'Upgrade Required',
    );
    await expect(homePage.upgradeButton(database.name)).toHaveCount(0);
    await expect(homePage.bulkUpgradeButton).toHaveCount(0);
  });
});
