import { runSql } from '../../support/api/postgres';
import { menuItem } from '../../support/ui/components/menu';
import { moreActionsButton } from '../../support/ui/components/more-actions';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { databasePrivilegesLoaded } from '../../support/ui/pages/privilege-gated-pages';
import { expect, test } from './fixtures';
import {
  grantOnDatabase,
  makeOwnerOfSchema,
  revokeDatabaseFromPublic,
} from './privileges';

test.describe('what a standard user may do with a database', () => {
  test('shows an error for a database the user is no collaborator of', async ({
    database,
    createUser,
    signInAs,
  }) => {
    const page = await signInAs(await createUser());
    const home = new HomePage(page);
    await expect(home.emptyState).toBeVisible();
    await expect(home.card(database.name)).toHaveCount(0);

    await new DatabasePage(page).goto(database);
    await expect(new DatabaseLayout(page).notFoundMessage).toHaveText(
      `Database with id ${database.id} is not found.`,
    );
  });

  test('lists the database but not its schemas when the role lacks CONNECT', async ({
    database,
    signInAs,
    collaborator: { user },
  }) => {
    await revokeDatabaseFromPublic(database);
    const page = await signInAs(user);
    const databasePage = new DatabasePage(page);
    await new HomePage(page).cardLink(database.name).click();

    await expect(new DatabaseLayout(page).schemasPanel).toContainText(
      'Unable to connect to the database',
    );
    await expect(databasePage.schemaRows).toHaveCount(0);
  });

  test('lists the schemas for a role that holds CONNECT itself', async ({
    database,
    signInAs,
    collaborator: { user, role },
  }) => {
    await revokeDatabaseFromPublic(database);
    await grantOnDatabase(database, role.name, 'CONNECT');
    const page = await signInAs(user);
    const databasePage = new DatabasePage(page);
    await databasePage.goto(database);

    await expect(databasePage.schemaRow('public')).toBeVisible();
    await expect(new DatabaseLayout(page).schemasPanel).not.toContainText(
      'Unable to connect to the database',
    );
  });

  test('disables Create Schema without CREATE on the database', async ({
    database,
    signInAs,
    collaborator: { user },
  }) => {
    const page = await signInAs(user);
    const databasePage = new DatabasePage(page);
    const privilegesLoaded = databasePrivilegesLoaded(page);
    await databasePage.goto(database);
    await privilegesLoaded;

    await expect(databasePage.schemaRow('public')).toBeVisible();
    await expect(databasePage.createSchemaButton).toBeDisabled();
  });

  test('creates a schema with CREATE on the database, owned by the role', async ({
    database,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnDatabase(database, role.name, 'CREATE');
    const databasePage = new DatabasePage(await signInAs(user));
    await databasePage.goto(database);
    await databasePage.createSchemaButton.click();
    await databasePage.createSchemaModal.name.fill('Mine');
    await databasePage.createSchemaModal.button('Create New Schema').click();

    await databasePage.createSchemaModal.expectClosed();
    await expect(databasePage.schemaRow('Mine')).toBeVisible();
    expect(
      await runSql(
        database.name,
        `SELECT pg_get_userbyid(nspowner) AS owner
         FROM pg_namespace WHERE nspname = 'Mine'`,
      ),
    ).toEqual([{ owner: role.name }]);
  });

  test('disables Rename Schema and Delete Schema for a schema of another role', async ({
    schema,
    signInAs,
    collaborator: { user },
  }) => {
    const page = await signInAs(user);
    const databasePage = new DatabasePage(page);
    await databasePage.goto(schema.database);
    await moreActionsButton(databasePage.schemaRow(schema.name)).click();

    await expect(menuItem(page, 'Rename Schema')).toBeDisabled();
    await expect(menuItem(page, 'Delete Schema')).toBeDisabled();
  });

  test('deletes a schema that the role owns', async ({
    schema,
    signInAs,
    collaborator: { user, role },
  }) => {
    await makeOwnerOfSchema(schema, role.name);
    const databasePage = new DatabasePage(await signInAs(user));
    await databasePage.goto(schema.database);
    await databasePage.chooseSchemaAction(schema.name, 'Delete Schema');
    await databasePage.deleteSchemaModal.button('Delete Schema').click();

    await databasePage.deleteSchemaModal.expectClosed();
    await expect(databasePage.schemaRow(schema.name)).toHaveCount(0);
    expect(
      await runSql(
        schema.database.name,
        'SELECT 1 FROM pg_namespace WHERE oid = $1',
        [schema.oid],
      ),
    ).toEqual([]);
  });
});
