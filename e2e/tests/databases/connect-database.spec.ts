import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { pinsKnownBug } from '../../support/known-bugs';
import { ConnectDatabaseModal } from '../../support/ui/components/database-modals';
import {
  keepHighlights,
  newItemHighlight,
  newItemScrollHint,
  skipHighlightDelay,
  waitForViewCheck,
} from '../../support/ui/components/new-item-highlight';
import { openSelect } from '../../support/ui/components/select';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { SERVER, expect, installedSchemas, test } from './fixtures';

const ALL_MATHESAR_SCHEMAS = ['__msar', 'mathesar_types', 'msar'];

function existsOnServer(database: string): Promise<{ exists: boolean }[]> {
  return runSql(
    'postgres',
    'SELECT EXISTS (SELECT FROM pg_database WHERE datname = $1)',
    [database],
  );
}

test.describe('connect database modal', () => {
  let homePage: HomePage;
  let modal: ConnectDatabaseModal;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    modal = new ConnectDatabaseModal(page);
    await homePage.goto();
    await homePage.connectDatabaseButton.click();
  });

  test('offers to create a database or to connect an existing one', async () => {
    await expect(modal.title).toHaveText(
      'How would you like to connect your database?',
    );
    await expect(modal.createNewOption).toContainText(
      "Create a new PostgreSQL database on Mathesar's internal server",
    );
    await expect(modal.connectExistingOption).toContainText(
      'Provide the details to connect an existing PostgreSQL database to Mathesar',
    );
  });

  test('starts again with an empty form after it was closed', async () => {
    await modal.createNewOption.click();
    await modal.databaseName.fill('abandoned');
    await modal.close();
    await modal.expectClosed();

    await homePage.connectDatabaseButton.click();
    await expect(modal.title).toHaveText(
      'How would you like to connect your database?',
    );
    await modal.createNewOption.click();
    await expect(modal.databaseName).toHaveValue('');
  });

  test('stays open when the user presses Escape', async ({ page }) => {
    await modal.createNewOption.click();
    await modal.databaseName.focus();
    await page.keyboard.press('Escape');

    await modal.expectOpen();
    await expect(modal.databaseName).toBeFocused();
  });

  test.describe('create a new database', () => {
    test.beforeEach(async () => {
      await modal.createNewOption.click();
    });

    test('requires a database name', async () => {
      await expect(modal.title).toHaveText('Create a New Database');
      await expect(modal.button('Create Database')).toBeDisabled();

      await modal.databaseName.fill('x');
      await expect(modal.button('Create Database')).toBeEnabled();
      await modal.databaseName.fill('');
      await expect(modal.button('Create Database')).toBeDisabled();
    });

    test('accepts a name that consists of spaces', async () => {
      await modal.databaseName.fill('   ');
      await expect(modal.button('Create Database')).toBeEnabled();
    });

    test('always installs the schemas of Mathesar and offers sample data', async () => {
      await expect(modal.schemaOptions).toHaveCount(8);
      await expect(modal.schemaOptions).toContainText([
        'mathesar_types, __msar, msar',
        'Bike Shop',
        'Hardware Store',
        'Ice Cream Employee Management',
        'Library Makerspace',
        'Movie Rentals',
        'Museum Exhibits',
        'Nonprofit Grant Tracking',
      ]);
      const mathesarSchemas = modal.schemaToInstall(
        'mathesar_types, __msar, msar',
      );
      await expect(mathesarSchemas).toBeChecked();
      await expect(mathesarSchemas).toBeDisabled();
      await expect(modal.schemaToInstall('Bike Shop')).not.toBeChecked();
    });

    test('creates a database and adds its card without leaving the page', async ({
      page,
      api,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.button('Create Database').click();

      await modal.expectClosed();
      await expect(page).toHaveURL('/');
      await expect(homePage.card(name)).toHaveText(`${name} ${SERVER}`);
      expect(await api.findDatabase(name)).toMatchObject({ nickname: null });
      expect(await installedSchemas(name)).toEqual(ALL_MATHESAR_SCHEMAS);
    });

    test('gives the new database a nickname', async ({
      api,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.useNickname.check();
      await modal.nickname.fill('Field notes');
      await modal.button('Create Database').click();

      await modal.expectClosed();
      await expect(homePage.card(name)).toHaveText(
        `Field notes (${name}) ${SERVER}`,
      );
      expect(await api.findDatabase(name)).toMatchObject({
        nickname: 'Field notes',
      });
    });

    test('drops the nickname when the user switches back to the database name', async ({
      api,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.useNickname.check();
      await modal.nickname.fill('Field notes');
      await modal.useDatabaseName.check();
      await expect(modal.nickname).toHaveCount(0);
      await modal.button('Create Database').click();

      await modal.expectClosed();
      await expect(homePage.card(name)).toHaveText(`${name} ${SERVER}`);
      expect(await api.findDatabase(name)).toMatchObject({ nickname: null });
    });

    test(
      'shows no display name when the nickname is left blank',
      pinsKnownBug('blank-database-nickname'),
      async ({ api, newDatabaseName }) => {
        const name = newDatabaseName();
        await modal.databaseName.fill(name);
        await modal.useNickname.check();
        await modal.button('Create Database').click();

        await modal.expectClosed();
        await expect(homePage.card(name)).toHaveText(`(${name}) ${SERVER}`);
        await expect(homePage.cardLink(name)).toHaveAccessibleName(
          'Open database',
        );
        expect(await api.findDatabase(name)).toMatchObject({ nickname: '' });
      },
    );

    test.fixme('shows the database name when the nickname is left blank', async ({
      api,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.useNickname.check();
      await modal.button('Create Database').click();

      await modal.expectClosed();
      await expect(homePage.card(name)).toHaveText(`${name} ${SERVER}`);
      expect(await api.findDatabase(name)).toMatchObject({ nickname: null });
    });

    test('installs a sample schema in the new database', async ({
      page,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.schemaToInstall('Bike Shop').check();
      await modal.button('Create Database').click();

      await modal.expectClosed();
      await homePage.cardLink(name).click();
      await expect(new DatabasePage(page).schemaRow('Bike Shop')).toContainText(
        '7 tables',
      );
      expect(
        await runSql(
          name,
          `SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname = 'Bike Shop'`,
        ),
      ).toEqual([{ tables: 7 }]);
    });

    test('shows the error of the server when the name is taken', async ({
      database,
    }) => {
      await modal.databaseName.fill(database.name);
      await modal.button('Create Database').click();

      await expect(modal.footer).toContainText(
        `DuplicateDatabase: database "${database.name}" already exists`,
      );
      await modal.expectOpen();
      await expect(modal.button('Create Database')).toBeEnabled();
      // The page loaded before the database existed, so it has no card for it yet.
      await expect(homePage.card(database.name)).toHaveCount(0);
    });

    test('creates nothing when the form is cancelled', async ({
      api,
      newDatabaseName,
    }) => {
      const name = newDatabaseName();
      await modal.databaseName.fill(name);
      await modal.button('Cancel').click();

      await modal.expectClosed();
      await expect(homePage.card(name)).toHaveCount(0);
      expect(await api.findDatabase(name)).toBeUndefined();
      expect(await existsOnServer(name)).toEqual([{ exists: false }]);
    });
  });

  test.describe('connect an existing database', () => {
    test.beforeEach(async () => {
      await modal.connectExistingOption.click();
    });

    test('starts with a local server and requires a database and a role', async () => {
      await expect(modal.title).toHaveText('Connect to an Existing Database');
      await expect(modal.host).toHaveValue('localhost');
      await expect(modal.port).toHaveValue('5432');
      await expect(modal.sslMode).toHaveText('Prefer SSL');
      await expect(modal.button('Connect Database')).toBeDisabled();

      await modal.databaseName.fill('any_database');
      await expect(modal.button('Connect Database')).toBeDisabled();
      await modal.roleName.fill('any_role');
      await expect(modal.button('Connect Database')).toBeEnabled();

      await modal.host.fill('');
      await expect(modal.body).toContainText('Value cannot be empty.');
      await expect(modal.button('Connect Database')).toBeDisabled();
    });

    test('offers to prefer, require or disable SSL', async () => {
      const options = await openSelect(modal.sslMode);
      await expect(options).toHaveText(
        /^\s*Prefer SSL\s*Require SSL\s*Disable SSL\s*$/,
      );
    });

    test('connects a database as the role that the user enters', async ({
      page,
      api,
      externalDatabase,
    }) => {
      await modal.fillExisting(externalDatabase);
      await modal.button('Connect Database').click();

      await modal.expectClosed();
      await expect(page).toHaveURL('/');
      await expect(homePage.card(externalDatabase.name)).toHaveText(
        `${externalDatabase.name} ${SERVER}`,
      );
      expect(await api.findDatabase(externalDatabase.name)).toMatchObject({
        nickname: null,
      });
      expect(
        await runSql(
          externalDatabase.name,
          `SELECT nspowner::regrole::text AS owner FROM pg_namespace WHERE nspname = 'msar'`,
        ),
      ).toEqual([{ owner: externalDatabase.role }]);
    });

    test('connects a database with a nickname and a sample schema', async ({
      api,
      externalDatabase,
    }) => {
      await modal.fillExisting(externalDatabase);
      await modal.useNickname.check();
      await modal.nickname.fill('Workshop');
      await modal.schemaToInstall('Bike Shop').check();
      await modal.button('Connect Database').click();

      await modal.expectClosed();
      await expect(homePage.card(externalDatabase.name)).toHaveText(
        `Workshop (${externalDatabase.name}) ${SERVER}`,
      );
      expect(await api.findDatabase(externalDatabase.name)).toMatchObject({
        nickname: 'Workshop',
      });
      expect(
        await runSql(
          externalDatabase.name,
          `SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname = 'Bike Shop'`,
        ),
      ).toEqual([{ tables: 7 }]);
    });

    test('shows an error and connects nothing when the password is wrong', async ({
      api,
      externalDatabase,
    }) => {
      await modal.fillExisting({ ...externalDatabase, password: 'wrong' });
      await modal.button('Connect Database').click();

      await expect(modal.footer).toContainText('OperationalError');
      await modal.expectOpen();
      await expect(modal.button('Connect Database')).toBeEnabled();
      await expect(homePage.card(externalDatabase.name)).toHaveCount(0);
      expect(await api.findDatabase(externalDatabase.name)).toBeUndefined();
      expect(await installedSchemas(externalDatabase.name)).toEqual([]);
    });

    test('connects the database once the password is corrected', async ({
      externalDatabase,
    }) => {
      await modal.fillExisting({ ...externalDatabase, password: 'wrong' });
      await modal.button('Connect Database').click();
      await expect(modal.footer).toContainText('OperationalError');

      await modal.password.fill(externalDatabase.password);
      await modal.button('Connect Database').click();
      await modal.expectClosed();
      await expect(homePage.card(externalDatabase.name)).toBeVisible();
    });

    test('shows an error and connects nothing when the host is unknown', async ({
      api,
      externalDatabase,
    }) => {
      await modal.fillExisting({
        ...externalDatabase,
        host: 'no-such-host.invalid',
      });
      await modal.button('Connect Database').click();

      await expect(modal.footer).toContainText('OperationalError');
      await modal.expectOpen();
      await expect(homePage.card(externalDatabase.name)).toHaveCount(0);
      expect(await api.findDatabase(externalDatabase.name)).toBeUndefined();
    });

    test('shows an error and connects nothing when the role may not create schemas', async ({
      api,
      externalDatabase,
    }) => {
      await runSql(
        'postgres',
        `ALTER DATABASE ${quoteIdentifier(externalDatabase.name)} OWNER TO CURRENT_USER`,
      );
      await modal.fillExisting(externalDatabase);
      await modal.button('Connect Database').click();

      await expect(modal.footer).toContainText(
        `InsufficientPrivilege: permission denied for database ${externalDatabase.name}`,
      );
      await modal.expectOpen();
      await expect(homePage.card(externalDatabase.name)).toHaveCount(0);
      expect(await api.findDatabase(externalDatabase.name)).toBeUndefined();
      expect(await installedSchemas(externalDatabase.name)).toEqual([]);
    });

    test('keeps one card when the database is already connected', async ({
      page,
      api,
      externalDatabase,
    }) => {
      await api.connectDatabase(externalDatabase);
      await modal.fillExisting(externalDatabase);
      await modal.button('Connect Database').click();

      await modal.expectClosed();
      await expect(homePage.card(externalDatabase.name)).toHaveCount(1);
      // The page loaded before the first connection. After a reload it shows
      // every connection that Mathesar stored.
      await page.reload();
      await expect(homePage.card(externalDatabase.name)).toHaveCount(1);
    });
  });
});

test.describe('new database in the list', () => {
  let homePage: HomePage;
  let modal: ConnectDatabaseModal;

  // The list highlights additions only two seconds after it loaded.
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    modal = new ConnectDatabaseModal(page);
    await page.clock.install();
  });

  test('highlights the card of a database that was just created', async ({
    page,
    database,
    newDatabaseName,
  }) => {
    await homePage.goto();
    await expect(homePage.card(database.name)).toBeVisible();
    await skipHighlightDelay(page);

    // The name puts the card at the top of the list, where it is in view.
    await homePage.connectDatabaseButton.click();
    await modal.createNewOption.click();
    await modal.databaseName.fill(newDatabaseName('_e2e_db'));
    await modal.button('Create Database').click();
    await expect(newItemHighlight(page)).toBeVisible();
  });

  test('points to a new database that is outside the visible part of the list', async ({
    page,
    api,
    newDatabaseName,
  }) => {
    const top = await api.createDatabase(newDatabaseName('e2e_db_a'));
    await api.createDatabase(newDatabaseName('e2e_db_b'));
    await api.createDatabase(newDatabaseName('e2e_db_c'));
    const name = newDatabaseName('e2e_db_z');
    await page.setViewportSize({ width: 1440, height: 500 });
    await homePage.goto();
    await expect(homePage.card(top.name)).toBeVisible();
    await skipHighlightDelay(page);

    await homePage.connectDatabaseButton.click();
    await modal.createNewOption.click();
    await modal.databaseName.fill(name);
    await modal.button('Create Database').click();
    await expect(newItemScrollHint(page)).toHaveText(
      'Scroll or click here to see the database.',
    );
    await expect(homePage.card(name)).not.toBeInViewport();

    await newItemScrollHint(page).click();
    await expect(homePage.card(name)).toBeInViewport();
    await expect(newItemHighlight(page)).toBeVisible();
    await expect(newItemScrollHint(page)).toHaveCount(0);
  });

  test('highlights nothing when the search brings cards back', async ({
    page,
    api,
    database,
    newDatabaseName,
  }) => {
    const other = await api.createDatabase(newDatabaseName());
    await homePage.goto();
    await expect(homePage.card(other.name)).toBeVisible();
    await skipHighlightDelay(page);
    await keepHighlights(page);

    await homePage.search.fill(database.name);
    await expect(homePage.cards).toHaveCount(1);
    await homePage.search.fill('');
    await expect(homePage.card(other.name)).toBeVisible();
    await waitForViewCheck(homePage.card(other.name));
    await expect(newItemHighlight(page)).toHaveCount(0);
  });
});
