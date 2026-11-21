import type { Page } from '@playwright/test';

import { type Schema, uniqueName } from '../../support/api/mathesar';
import { failRpcMethod } from '../../support/rpc-failures';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { databaseUrl } from '../../support/ui/urls';
import { expect, test } from './shop';

// The lists of a schema come with the page when it is loaded at its own URL.
// The app requests them when the user arrives from the database page.
async function openFromDatabasePage(page: Page, schema: Schema): Promise<void> {
  const databasePage = new DatabasePage(page);
  await databasePage.goto(schema.database);
  await databasePage.schemaLink(schema.name).click();
}

test.describe('schema page when a list cannot be loaded', () => {
  test('shows the error instead of the tables and loads them on Retry', async ({
    page,
    shop,
    schemaPage,
  }) => {
    const restore = await failRpcMethod(
      page,
      'tables.list_with_metadata',
      'The tables are out of reach',
    );
    await openFromDatabasePage(page, shop.products.schema);
    await expect(schemaPage.tables.section).toContainText(
      'The tables are out of reach',
    );
    await expect(schemaPage.tables.items).toHaveCount(0);

    await restore();
    await schemaPage.tables.retryButton.click();
    await expect(schemaPage.tables.items).toHaveCount(3);
    await expect(schemaPage.tables.retryButton).toHaveCount(0);
  });

  test('leads back to the database when the tables cannot be loaded', async ({
    page,
    shop,
    schemaPage,
  }) => {
    await failRpcMethod(page, 'tables.list_with_metadata', 'Out of reach');
    await openFromDatabasePage(page, shop.products.schema);
    await schemaPage.tables.goToDatabaseLink.click();
    await expect(page).toHaveURL(databaseUrl(shop.products.schema.database));
    await expect(
      new DatabasePage(page).schemaRow(shop.products.schema.name),
    ).toBeVisible();
  });

  test('shows the error instead of the explorations and loads them on Retry', async ({
    page,
    api,
    shop,
    schemaPage,
  }) => {
    const name = uniqueName('Price list');
    await api.defineExploration(shop.products, { name, columns: ['Name'] });
    const restore = await failRpcMethod(
      page,
      'explorations.list',
      'The explorations are out of reach',
    );
    await openFromDatabasePage(page, shop.products.schema);
    await expect(schemaPage.explorations.section).toContainText(
      'The explorations are out of reach',
    );
    await expect(schemaPage.explorations.goToDatabaseLink).toBeVisible();

    await restore();
    await schemaPage.explorations.retryButton.click();
    await expect(schemaPage.explorations.item(name)).toBeVisible();
    await expect(schemaPage.explorations.retryButton).toHaveCount(0);
  });

  test('shows the error instead of the forms and loads them on Retry', async ({
    page,
    api,
    shop,
    schemaPage,
  }) => {
    await api.defineForm(shop.products, { name: 'Restock', fields: [] });
    const restore = await failRpcMethod(
      page,
      'forms.list',
      'The forms are out of reach',
    );
    await openFromDatabasePage(page, shop.products.schema);
    await expect(schemaPage.forms.section).toContainText(
      'The forms are out of reach',
    );
    await expect(schemaPage.forms.goToDatabaseLink).toBeVisible();

    await restore();
    await schemaPage.forms.retryButton.click();
    await expect(schemaPage.forms.item('Restock')).toBeVisible();
    await expect(schemaPage.forms.retryButton).toHaveCount(0);
  });
});
