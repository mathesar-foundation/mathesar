import { uniqueName } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { HomePage } from '../../support/ui/pages/home-page';
import { SERVER, expect, test } from './fixtures';

test.describe('home page', () => {
  let homePage: HomePage;

  test.beforeEach(({ page }) => {
    homePage = new HomePage(page);
  });

  test('welcomes the user by username', async ({ page }) => {
    await homePage.goto();
    await expect(page).toHaveTitle('Databases | Mathesar');
    await expect(homePage.welcome).toHaveText(
      `Welcome to Mathesar, ${env.admin.username}!`,
    );
  });

  test('shows a database with its name and its server', async ({
    database,
  }) => {
    await homePage.goto();
    await expect(homePage.card(database.name)).toHaveText(
      `${database.name} ${SERVER}`,
    );
  });

  test('shows the nickname of a database before its name', async ({
    api,
    database,
  }) => {
    await api.setNickname(database, 'Stock room');
    await homePage.goto();
    await expect(homePage.card(database.name)).toHaveText(
      `Stock room (${database.name}) ${SERVER}`,
    );
    await expect(homePage.cardLink(database.name)).toHaveAccessibleName(
      'Open database Stock room',
    );
  });

  test('sorts the databases by name, whatever their nicknames', async ({
    api,
    newDatabaseName,
  }) => {
    const group = uniqueName('sorted');
    const first = await api.createDatabase(newDatabaseName('e2e_db_a'));
    const second = await api.createDatabase(newDatabaseName('e2e_db_b'));
    await api.setNickname(first, `Zebra ${group}`);
    await api.setNickname(second, `Apple ${group}`);
    await homePage.goto();
    await homePage.search.fill(group);
    await expect(homePage.cards).toContainText([
      `Zebra ${group}`,
      `Apple ${group}`,
    ]);
  });

  test('opens the database page from a card', async ({ page, database }) => {
    await homePage.goto();
    await homePage.cardLink(database.name).click();
    await expect(page).toHaveURL(`/db/${database.id}/schemas/`);
    await expect(new DatabaseLayout(page).connection).toHaveText(
      `${database.name} @ ${SERVER}`,
    );
  });

  test('filters the databases by name as the user types', async ({
    database,
  }) => {
    await homePage.goto();
    await homePage.search.fill(database.name.toUpperCase());
    await expect(homePage.cards).toHaveCount(1);
    await expect(homePage.card(database.name)).toBeVisible();
    await expect(homePage.searchSummary).toHaveText(
      `1 database matches ${database.name.toUpperCase()}`,
    );

    await homePage.search.fill('no such database');
    await expect(homePage.cards).toHaveCount(0);
    await expect(homePage.searchSummary).toHaveText(
      '0 databases match no such database',
    );

    await homePage.clearSearchButton.click();
    await expect(homePage.search).toHaveValue('');
    await expect(homePage.searchSummary).toHaveCount(0);
    await expect(homePage.card(database.name)).toBeVisible();
  });

  test('finds a database by its nickname', async ({ api, database }) => {
    const nickname = uniqueName('Ledger');
    await api.setNickname(database, nickname);
    await homePage.goto();
    await homePage.search.fill(nickname);
    await expect(homePage.cards).toHaveCount(1);
    await expect(homePage.card(database.name)).toBeVisible();
  });

  test('explains databases in a tooltip that links to the documentation', async () => {
    await homePage.goto();
    await homePage.help.hover();
    await expect(homePage.tooltip).toHaveText(
      'See our documentation to learn more about how databases work.',
    );
    await expect(homePage.tooltipLink).toHaveAttribute(
      'href',
      'https://docs.mathesar.org/user-guide/databases/',
    );
  });

  test('links to the resources of the project', async () => {
    const resources = [
      ['Documentation', 'https://docs.mathesar.org/user-guide/'],
      ['Connect with Us', 'https://mathesar.org/community'],
      ['Stay Informed', 'https://mathesar.org/mailing-list'],
      ['Support Our Mission', 'https://mathesar.org/donate'],
    ] as const;
    await homePage.goto();
    await expect(homePage.resourceLinks).toHaveText(
      resources.map(([name]) => name),
    );
    for (const [index, [, url]] of resources.entries()) {
      await expect(homePage.resourceLinks.nth(index)).toHaveAttribute(
        'href',
        url,
      );
    }
  });
});

test.describe('home page of a standard user', () => {
  test('says that no database is connected, without a way to connect one', async ({
    createUser,
    signInAs,
  }) => {
    const homePage = new HomePage(await signInAs(await createUser()));
    await expect(homePage.emptyState).toHaveText(
      "No Databases Connected Seems you haven't set up any databases. To use Mathesar, you'll need to connect one.",
    );
    await expect(homePage.search).toHaveCount(0);
    await expect(homePage.connectDatabaseButton).toHaveCount(0);
  });

  test('lists only the databases the user collaborates on, without their menus', async ({
    database,
    collaborator,
    signInAs,
  }) => {
    const homePage = new HomePage(await signInAs(collaborator.user));
    await expect(homePage.cards).toHaveCount(1);
    await expect(homePage.card(database.name)).toHaveText(
      `${database.name} ${SERVER}`,
    );
    await expect(homePage.cardMenuButton(database.name)).toHaveCount(0);
    await expect(homePage.connectDatabaseButton).toHaveCount(0);
  });
});
