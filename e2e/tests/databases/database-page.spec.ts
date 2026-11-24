import { quoteIdentifier, runSql } from '../../support/api/postgres';
import {
  DisconnectDatabaseModal,
  EditConnectionModal,
  UpgradeDatabaseModal,
} from '../../support/ui/components/database-modals';
import { openMenu } from '../../support/ui/components/menu';
import { Toasts } from '../../support/ui/components/toast';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { ErrorPage } from '../../support/ui/pages/error-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { databaseUrl } from '../../support/ui/urls';
import {
  SAMPLE_FUNCTION,
  SERVER,
  expect,
  sampleFunctionOwners,
  test,
} from './fixtures';

test.describe('database page', () => {
  let layout: DatabaseLayout;
  let databasePage: DatabasePage;

  test.beforeEach(({ page }) => {
    layout = new DatabaseLayout(page);
    databasePage = new DatabasePage(page);
  });

  test('opens on the schemas and names the database and its server', async ({
    page,
    database,
  }) => {
    await page.goto(`/db/${database.id}/`);
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(page).toHaveTitle(`${database.name} | Mathesar`);
    await expect(layout.header).toContainText(`Database ${database.name}`);
    await expect(layout.connection).toHaveText(`${database.name} @ ${SERVER}`);
    await expect(layout.schemasTab).toHaveAttribute('aria-selected', 'true');
    await expect(databasePage.schemaRow('public')).toBeVisible();
  });

  test('is titled with the nickname of the database', async ({
    page,
    api,
    database,
  }) => {
    await api.setNickname(database, 'Stock room');
    await databasePage.goto(database);
    await expect(page).toHaveTitle('Stock room | Mathesar');
    await expect(layout.header).toContainText('Database Stock room');
    await expect(layout.connection).toHaveText(`${database.name} @ ${SERVER}`);
  });

  test('switches between the schemas and the settings of the database', async ({
    page,
    database,
  }) => {
    await databasePage.goto(database);
    await layout.settingsTab.click();
    await expect(page).toHaveURL(`/db/${database.id}/settings/roles/`);
    await expect(layout.settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(layout.schemasTab).toHaveAttribute('aria-selected', 'false');
    await expect(layout.settingsPanel).toBeVisible();

    await page.reload();
    await expect(layout.settingsTab).toHaveAttribute('aria-selected', 'true');

    await layout.schemasTab.click();
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(layout.schemasTab).toHaveAttribute('aria-selected', 'true');
    await expect(databasePage.schemaRow('public')).toBeVisible();
  });

  test('explains schemas in a tooltip that links to the documentation', async ({
    database,
  }) => {
    await databasePage.goto(database);
    await layout.schemasHelp.hover();
    await expect(layout.tooltip).toHaveText(
      'Use schemas to organize related tables into logical groups within your database. See our documentation to learn more.',
    );
    await expect(layout.tooltipLink).toHaveAttribute(
      'href',
      'https://docs.mathesar.org/user-guide/schemas/',
    );
  });

  test('says that a database is unknown and leads back to the home page', async ({
    page,
  }) => {
    await page.goto('/db/2147483647/');
    await expect(layout.notFoundMessage).toHaveText(
      'Database with id 2147483647 is not found.',
    );
    await new ErrorPage(page).homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('says that it cannot connect when the database is gone', async ({
    database,
  }) => {
    await runSql(
      'postgres',
      `DROP DATABASE ${quoteIdentifier(database.name)} WITH (FORCE)`,
    );
    await databasePage.goto(database);
    await expect(layout.schemasPanel).toContainText(
      'Unable to connect to the database',
    );
    await expect(databasePage.schemaRows).toHaveCount(0);
    await expect(databasePage.createSchemaButton).toBeDisabled();
  });

  test.describe('header menu', () => {
    test('keeps the menu open behind the form that it opened', async ({
      page,
      database,
    }) => {
      const modal = new EditConnectionModal(page, database.name);
      await databasePage.goto(database);
      await layout.chooseAction('Edit Connection');
      await modal.expectOpen();
      await expectStaysOpen(openMenu(page));

      await modal.title.click();
      await expect(openMenu(page)).toHaveCount(0);
      await modal.expectOpen();
    });

    test('shows a new nickname in the header right after it is saved', async ({
      page,
      api,
      database,
    }) => {
      const modal = new EditConnectionModal(page, database.name);
      await databasePage.goto(database);
      await layout.chooseAction('Edit Connection');
      await modal.useNickname.check();
      await modal.nickname.fill('Stock room');
      await modal.button('Save').click();

      await modal.expectClosed();
      await expect(layout.header).toContainText('Database Stock room');
      await expect(page).toHaveTitle('Stock room | Mathesar');
      expect(await api.findDatabase(database.name)).toMatchObject({
        nickname: 'Stock room',
      });
    });

    test('goes to the home page after it disconnected the database', async ({
      page,
      api,
      database,
      newDatabaseName,
    }) => {
      // A second database keeps the server in use. See disconnect-database.spec.ts.
      await api.createDatabase(newDatabaseName());
      const modal = new DisconnectDatabaseModal(page, database.name);
      await databasePage.goto(database);
      await layout.chooseAction('Disconnect Database');
      await modal.button('Disconnect').click();

      await expect(page).toHaveURL('/');
      await expect(new Toasts(page).items).toHaveText(
        'Database disconnected successfully',
      );
      await expect(new HomePage(page).card(database.name)).toHaveCount(0);
      expect(await api.findDatabase(database.name)).toBeUndefined();
    });

    test('reinstalls the schemas of Mathesar', async ({ page, database }) => {
      const modal = UpgradeDatabaseModal.toReinstall(page, database.name);
      await runSql(database.name, `DROP FUNCTION ${SAMPLE_FUNCTION}`);
      await databasePage.goto(database);
      await layout.chooseAction('Reinstall Mathesar Schemas');
      await modal.button('Reinstall').click();

      await expect(new Toasts(page).items).toHaveText(
        'Mathesar schemas reinstalled successfully',
      );
      await modal.expectClosed();
      await expect(page).toHaveURL(databaseUrl(database));
      expect(await sampleFunctionOwners(database.name)).toHaveLength(1);
    });
  });
});
