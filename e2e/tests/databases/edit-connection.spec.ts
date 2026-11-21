import type { Page } from '@playwright/test';

import type { Database } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { EditConnectionModal } from '../../support/ui/components/database-modals';
import { HomePage } from '../../support/ui/pages/home-page';
import { SERVER, expect, test } from './fixtures';

const SERVER_CHANGE_WARNING =
  'Your changes to the host and port will affect all connected databases using this server.';

test.describe('edit connection', () => {
  let homePage: HomePage;

  async function editConnection(
    page: Page,
    database: Database,
    displayName = database.name,
  ): Promise<EditConnectionModal> {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.chooseCardAction(database.name, 'Edit Connection');
    return new EditConnectionModal(page, displayName);
  }

  test('shows the stored connection', async ({ page, database }) => {
    const modal = await editConnection(page, database);
    await expect(modal.databaseName).toHaveValue(database.name);
    await expect(modal.useDatabaseName).toBeChecked();
    await expect(modal.nickname).toHaveCount(0);
    await expect(modal.host).toHaveValue(env.postgresFromMathesar.host);
    await expect(modal.port).toHaveValue(String(env.postgresFromMathesar.port));
    await expect(modal.sslMode).toHaveText('Prefer SSL');
  });

  test('gives the database a nickname', async ({ page, api, database }) => {
    const modal = await editConnection(page, database);
    await modal.useNickname.check();
    await modal.nickname.fill('Archive');
    await modal.button('Save').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveText(
      `Archive (${database.name}) ${SERVER}`,
    );
    expect(await api.findDatabase(database.name)).toMatchObject({
      nickname: 'Archive',
    });
  });

  test('removes the nickname of the database', async ({
    page,
    api,
    database,
  }) => {
    await api.setNickname(database, 'Archive');
    const modal = await editConnection(page, database, 'Archive');
    await expect(modal.nickname).toHaveValue('Archive');
    await modal.useDatabaseName.check();
    await modal.button('Save').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveText(
      `${database.name} ${SERVER}`,
    );
    expect(await api.findDatabase(database.name)).toMatchObject({
      nickname: null,
    });
  });

  test('requires a database name', async ({ page, database }) => {
    const modal = await editConnection(page, database);
    await modal.databaseName.fill('');
    await expect(modal.body).toContainText('Value cannot be empty.');
    await expect(modal.button('Save')).toBeDisabled();
  });

  test('saves another database name without checking that the database exists', async ({
    page,
    api,
    database,
    newDatabaseName,
  }) => {
    const newName = newDatabaseName();
    const modal = await editConnection(page, database);
    await modal.databaseName.fill(newName);
    await modal.button('Save').click();

    await modal.expectClosed();
    await expect(homePage.card(newName)).toHaveText(`${newName} ${SERVER}`);
    await expect(homePage.card(database.name)).toHaveCount(0);
    expect(await api.findDatabase(newName)).toMatchObject({ id: database.id });
  });

  test('shows the error of the server when another connection has the name', async ({
    page,
    api,
    database,
    newDatabaseName,
  }) => {
    const other = await api.createDatabase(newDatabaseName());
    const modal = await editConnection(page, database);
    await modal.databaseName.fill(other.name);
    await modal.button('Save').click();

    await expect(modal.footer).toContainText(
      'duplicate key value violates unique constraint "unique_database"',
    );
    await modal.expectOpen();
    await expect(modal.button('Save')).toBeEnabled();
    expect(await api.findDatabase(database.name)).toMatchObject({
      id: database.id,
    });
  });

  test('warns that a change of the server affects the other databases on it', async ({
    page,
    api,
    database,
    newDatabaseName,
  }) => {
    const other = await api.createDatabase(newDatabaseName());
    const modal = await editConnection(page, database);
    await expect(modal.body).not.toContainText(SERVER_CHANGE_WARNING);

    await modal.host.fill('another-host');
    await expect(modal.body).toContainText(SERVER_CHANGE_WARNING);
    await expect(modal.body).toContainText(other.name);
    await expect(modal.body).not.toContainText(database.name);
  });

  test('resets the form without closing it', async ({ page, database }) => {
    const modal = await editConnection(page, database);
    await modal.databaseName.fill('changed');
    await modal.useNickname.check();
    await modal.nickname.fill('Changed');
    await modal.host.fill('another-host');
    await modal.button('Reset').click();

    await expect(modal.databaseName).toHaveValue(database.name);
    await expect(modal.useDatabaseName).toBeChecked();
    await expect(modal.host).toHaveValue(env.postgresFromMathesar.host);
    await expect(modal.body).not.toContainText(SERVER_CHANGE_WARNING);
  });
});
