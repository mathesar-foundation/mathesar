import type { Page } from '@playwright/test';

import type { Database } from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { DisconnectDatabaseModal } from '../../support/ui/components/database-modals';
import { Toasts } from '../../support/ui/components/toast';
import { HomePage } from '../../support/ui/pages/home-page';
import { expect, installedSchemas, test } from './fixtures';

test.describe('disconnect database', () => {
  let homePage: HomePage;

  async function openDisconnect(
    page: Page,
    database: Database,
  ): Promise<DisconnectDatabaseModal> {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.chooseCardAction(database.name, 'Disconnect Database');
    return new DisconnectDatabaseModal(page, database.name);
  }

  // With a second database the server stays in use, so the form does not
  // offer to remove its stored roles. server-records.spec.ts covers that.
  test.beforeEach(async ({ api, newDatabaseName }) => {
    await api.createDatabase(newDatabaseName());
  });

  test('explains what happens in Mathesar and in PostgreSQL', async ({
    page,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await expect(modal.body).toContainText(
      'This will disconnect the database from Mathesar.',
    );
    await expect(modal.removeStoredRoles).toHaveCount(0);
    await expect(modal.removeMetadata).toBeChecked();
    await expect(modal.removeMetadata).toBeDisabled();
    await expect(modal.keepDatabase).toBeChecked();
    await expect(modal.removeInternalSchemas).not.toBeChecked();
    await expect(modal.removeCustomTypes).toHaveCount(0);
    await expect(modal.useRole).toHaveCount(0);
  });

  test('does not disconnect while the database is to be dropped', async ({
    page,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.dropDatabase.check();
    await expect(modal.body).toContainText(
      'Dropping databases from within Mathesar is not yet implemented.',
    );
    await expect(modal.removeInternalSchemas).toHaveCount(0);
    await expect(modal.button('Disconnect')).toBeDisabled();

    await modal.keepDatabase.check();
    await expect(modal.button('Disconnect')).toBeEnabled();
  });

  test('disconnects a database and leaves it untouched in PostgreSQL', async ({
    page,
    api,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.button('Disconnect').click();

    await expect(new Toasts(page).items).toHaveText(
      'Database disconnected successfully',
    );
    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveCount(0);
    expect(await api.findDatabase(database.name)).toBeUndefined();
    expect(await installedSchemas(database.name)).toEqual([
      '__msar',
      'mathesar_types',
      'msar',
    ]);
  });

  test('removes the internal schemas of Mathesar and keeps its data types', async ({
    page,
    api,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await expect(modal.removeCustomTypes).not.toBeChecked();
    await expect(modal.useRole).not.toBeChecked();
    await modal.button('Disconnect').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveCount(0);
    expect(await api.findDatabase(database.name)).toBeUndefined();
    expect(await installedSchemas(database.name)).toEqual(['mathesar_types']);
  });

  test('removes the data types of Mathesar with its internal schemas', async ({
    page,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.removeCustomTypes.check();
    await modal.button('Disconnect').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveCount(0);
    expect(await installedSchemas(database.name)).toEqual([]);
  });

  test('stays connected when a table still uses a data type that is to be removed', async ({
    page,
    api,
    database,
  }) => {
    await runSql(
      database.name,
      'CREATE TABLE public."Contacts" ("Email" mathesar_types.email)',
    );
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.removeCustomTypes.check();
    await modal.button('Disconnect').click();

    await expect(modal.footer).toContainText(
      'cannot drop type mathesar_types.email because other objects depend on it',
    );
    await modal.expectOpen();
    await expect(modal.button('Disconnect')).toBeEnabled();
    expect(await api.findDatabase(database.name)).toBeDefined();
    expect(await installedSchemas(database.name)).toEqual([
      '__msar',
      'mathesar_types',
      'msar',
    ]);
  });

  test('removes the schemas as a role that the user specifies', async ({
    page,
    api,
    database,
  }) => {
    // Mathesar stores no password for this owner, so only the specified role can remove the schemas.
    await runSql(database.name, 'ALTER SCHEMA msar OWNER TO pg_database_owner');
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.useRole.check();
    await expect(modal.button('Disconnect')).toBeDisabled();

    await modal.roleName.fill(env.postgres.user);
    await modal.rolePassword.fill(env.postgres.password);
    await modal.button('Disconnect').click();
    await modal.expectClosed();
    expect(await api.findDatabase(database.name)).toBeUndefined();
    expect(await installedSchemas(database.name)).toEqual(['mathesar_types']);
  });

  test('stays connected when the password of the specified role is wrong', async ({
    page,
    api,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.useRole.check();
    await modal.roleName.fill(env.postgres.user);
    await modal.rolePassword.fill('wrong');
    await modal.button('Disconnect').click();

    await expect(modal.footer).toContainText('OperationalError');
    await modal.expectOpen();
    await expect(homePage.card(database.name)).toBeVisible();
    expect(await api.findDatabase(database.name)).toBeDefined();
    expect(await installedSchemas(database.name)).toContain('msar');
  });

  test('says so when the database could not be reached to remove the schemas', async ({
    page,
    api,
    database,
  }) => {
    await runSql(
      'postgres',
      `DROP DATABASE ${quoteIdentifier(database.name)} WITH (FORCE)`,
    );
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.button('Disconnect').click();

    await expect(new Toasts(page).items).toHaveText(
      'Database disconnected successfully. Mathesar was unable to connect to the database to remove internal schemas.',
    );
    await expect(homePage.card(database.name)).toHaveCount(0);
    expect(await api.findDatabase(database.name)).toBeUndefined();
  });

  test('keeps the database connected when the form is cancelled', async ({
    page,
    api,
    database,
  }) => {
    const modal = await openDisconnect(page, database);
    await modal.removeInternalSchemas.check();
    await modal.button('Cancel').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toBeVisible();
    expect(await api.findDatabase(database.name)).toBeDefined();
    expect(await installedSchemas(database.name)).toContain('msar');
  });
});
