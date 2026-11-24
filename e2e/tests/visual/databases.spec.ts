import type { Locator } from '@playwright/test';

import { runSql } from '../../support/api/postgres';
import { runsAlone } from '../../support/fixtures';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { DatabaseSettingsPage } from '../../support/ui/pages/database-settings-page';
import { HomePage } from '../../support/ui/pages/home-page';
import {
  expect,
  expectSettled,
  rewriteRpcResult,
  seedLibrary,
  test,
} from './fixtures';

test('the home page of a user with two databases', async ({
  api,
  createNamedDatabase,
  createNamedUser,
  signInAs,
}) => {
  const user = await createNamedUser({ username: 'visual_home' });
  const library = await createNamedDatabase('visual_home_library');
  await api.setNickname(library, 'Library');
  const archive = await createNamedDatabase('visual_home_archive');
  await api.addCollaboratorWithCreatorRole(library, user);
  await api.addCollaboratorWithCreatorRole(archive, user);
  const page = await signInAs(user);
  await expect(new HomePage(page).cards).toHaveCount(2);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('home-page.png');
});

test('the database page with its schemas', async ({
  page,
  api,
  createNamedDatabase,
}) => {
  const database = await createNamedDatabase('visual_database_page');
  await seedLibrary(api, database);
  const databasePage = new DatabasePage(page);
  await databasePage.goto(database);
  await expect(databasePage.schemaRows).toHaveCount(2);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('database-page.png');
});

test.describe('database settings', () => {
  let settingsPage: DatabaseSettingsPage;
  let settingsPanel: Locator;

  test.beforeEach(({ page }) => {
    settingsPage = new DatabaseSettingsPage(page);
    settingsPanel = new DatabaseLayout(page).settingsPanel;
  });

  test(
    'the roles of the server with their child roles',
    runsAlone,
    async ({ page, database }) => {
      const roles = ['visual_editor', 'visual_reader', 'visual_staff'];
      // The screenshot needs the same names in every run, so the roles stay
      // until the next run replaces them.
      await runSql(
        'postgres',
        `DROP ROLE IF EXISTS ${roles.join(', ')};
       CREATE ROLE visual_staff;
       CREATE ROLE visual_editor LOGIN IN ROLE visual_staff;
       CREATE ROLE visual_reader LOGIN IN ROLE visual_staff;`,
      );
      await rewriteRpcResult<{ name: string }[]>(page, 'roles.list', (all) =>
        all.filter(({ name }) => roles.includes(name)),
      );
      await settingsPage.goto(database, 'Roles');
      await expect(
        settingsPage.roles.row('visual_staff').childRoles,
      ).toHaveCount(2);
      await expectSettled(page);

      await expect(settingsPanel).toHaveScreenshot('database-roles.png');
    },
  );

  test('the collaborators of a database', async ({
    page,
    api,
    database,
    createNamedUser,
  }) => {
    const ada = await createNamedUser({
      username: 'visual_collaborator_ada',
      fullName: 'Ada Lovelace',
    });
    const grace = await createNamedUser({
      username: 'visual_collaborator_grace',
    });
    await api.addCollaboratorWithCreatorRole(database, ada);
    await api.addCollaboratorWithCreatorRole(database, grace);
    // The server lists them in no fixed order.
    await rewriteRpcResult<{ id: number }[]>(
      page,
      'collaborators.list',
      (all) => all.sort((a, b) => a.id - b.id),
    );
    await settingsPage.goto(database, 'Collaborators');
    await expect(
      settingsPage.collaborators.row('visual_collaborator_grace').role,
    ).toHaveText('mathesar');
    await expectSettled(page);

    await expect(settingsPanel).toHaveScreenshot('database-collaborators.png');
  });
});
