import type { Database } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { runsAlone } from '../../support/fixtures';
import {
  ConnectDatabaseModal,
  DisconnectDatabaseModal,
  EditConnectionModal,
} from '../../support/ui/components/database-modals';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { HomePage } from '../../support/ui/pages/home-page';
import { expect, test } from './fixtures';

const { host, port } = env.postgresFromMathesar;

// Mathesar keeps one server per host and port. These tests must not change the stack's
// server, so they reach it under another spelling of its host and share that server.
test.describe.configure({ mode: 'default' });

test.describe('server of a database', runsAlone, () => {
  let homePage: HomePage;

  test.beforeEach(({ page, otherHostSpelling }) => {
    test.skip(otherHostSpelling === host, 'The host has no other spelling');
    homePage = new HomePage(page);
  });

  test.describe('new connection', () => {
    let modal: ConnectDatabaseModal;

    test.beforeEach(async ({ page, externalDatabase, otherHostSpelling }) => {
      modal = new ConnectDatabaseModal(page);
      await homePage.goto();
      await homePage.connectDatabaseButton.click();
      await modal.connectExistingOption.click();
      await modal.fillExisting({
        ...externalDatabase,
        host: otherHostSpelling,
      });
    });

    test('stores the server with the chosen SSL mode', async ({
      api,
      externalDatabase,
      otherHostSpelling,
    }) => {
      await chooseOption(modal.sslMode, 'Disable SSL');
      await modal.button('Connect Database').click();

      await modal.expectClosed();
      await expect(homePage.card(externalDatabase.name)).toHaveText(
        `${externalDatabase.name} ${otherHostSpelling}:${port}`,
      );
      expect(await api.listServers()).toContainEqual(
        expect.objectContaining({
          host: otherHostSpelling,
          port,
          sslmode: 'disable',
        }),
      );
    });

    test('stores the server without a port when the field is empty', async ({
      api,
      externalDatabase,
      otherHostSpelling,
    }) => {
      await modal.port.fill('');
      await modal.button('Connect Database').click();

      await modal.expectClosed();
      await expect(homePage.card(externalDatabase.name)).toHaveText(
        `${externalDatabase.name} ${otherHostSpelling}`,
      );
      expect(await api.listServers()).toContainEqual(
        expect.objectContaining({ host: otherHostSpelling, port: null }),
      );
    });
  });

  test('changes the host, the port and the SSL mode of the server', async ({
    page,
    api,
    externalDatabase,
    otherHostSpelling,
  }) => {
    const database = await api.connectDatabase({
      ...externalDatabase,
      host: otherHostSpelling,
    });
    const newHost = host[0]?.toUpperCase() + host.slice(1);
    const modal = new EditConnectionModal(page, database.name);
    await homePage.goto();
    await homePage.chooseCardAction(database.name, 'Edit Connection');
    await modal.host.fill(newHost);
    await modal.port.fill('');
    await chooseOption(modal.sslMode, 'Disable SSL');
    await modal.button('Save').click();

    await modal.expectClosed();
    await expect(homePage.card(database.name)).toHaveText(
      `${database.name} ${newHost}`,
    );
    expect(await api.listServers()).toContainEqual({
      id: database.serverId,
      host: newHost,
      port: null,
      sslmode: 'disable',
    });
  });

  test.describe('disconnecting the last database of a server', () => {
    let database: Database;
    let modal: DisconnectDatabaseModal;

    test.beforeEach(
      async ({ page, api, externalDatabase, otherHostSpelling }) => {
        database = await api.connectDatabase({
          ...externalDatabase,
          host: otherHostSpelling,
        });
        modal = new DisconnectDatabaseModal(page, database.name);
        await homePage.goto();
        await homePage.chooseCardAction(database.name, 'Disconnect Database');
      },
    );

    test('removes the server and its stored roles from Mathesar', async ({
      page,
      api,
      otherHostSpelling,
    }) => {
      await expect(modal.removeStoredRoles).toBeChecked();
      await modal.button('Disconnect').click();

      await expect(new Toasts(page).items).toHaveText(
        'Database disconnected successfully',
      );
      expect(await api.listServers()).not.toContainEqual(
        expect.objectContaining({ host: otherHostSpelling }),
      );
      expect(await api.storedRoleNamesOfServer(database.serverId)).toEqual([]);
    });

    test('keeps the server and its stored roles when the user chooses so', async ({
      page,
      api,
      externalDatabase,
      otherHostSpelling,
    }) => {
      await modal.removeStoredRoles.uncheck();
      await modal.button('Disconnect').click();

      await expect(new Toasts(page).items).toHaveText(
        'Database disconnected successfully',
      );
      expect(await api.listServers()).toContainEqual(
        expect.objectContaining({ host: otherHostSpelling }),
      );
      expect(await api.storedRoleNamesOfServer(database.serverId)).toEqual([
        externalDatabase.role,
      ]);
    });
  });
});
