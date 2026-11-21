import type { Page } from '@playwright/test';

import { uniqueName } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { uncaughtErrorMessage } from '../../support/page-errors';
import { failRpcMethod } from '../../support/rpc-failures';
import { Toasts } from '../../support/ui/components/toast';
import {
  dataExplorerUrl,
  explorationUrl,
} from '../../support/ui/pages/data-explorer-page';
import type { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, test } from './shop';

test.describe('explorations of a schema', () => {
  test('invites the user to create the first exploration', async ({
    shop,
    schema,
    schemaPage,
  }) => {
    await schemaPage.goto(shop.products.schema);
    const { explorations } = schemaPage;
    await expect(explorations.items).toHaveCount(0);
    await expect(explorations.section).toContainText(
      "It's time to use your tables. Create your first exploration.",
    );
    await expect(explorations.link('Open Data Explorer')).toHaveAttribute(
      'href',
      dataExplorerUrl(schema),
    );
    await expect(explorations.link('New Exploration')).toHaveAttribute(
      'href',
      dataExplorerUrl(schema),
    );
  });

  test('explains explorations in a tooltip', async ({ shop, schemaPage }) => {
    await schemaPage.goto(shop.products.schema);
    await schemaPage.explorationsHelp.hover();
    await expect(schemaPage.tooltip).toContainText(
      'Explorations let you query your data to uncover trends and insights.',
    );
  });

  test.describe('with saved explorations', () => {
    // Mathesar accepts the name of an exploration only once per installation.
    let priceList: string;
    let orderNumbers: string;

    test.beforeEach(async ({ api, shop, schemaPage }) => {
      priceList = uniqueName('Price list');
      orderNumbers = uniqueName('Order numbers');
      await api.defineExploration(shop.products, {
        name: priceList,
        description: 'Prices of all products',
        columns: ['Name', 'Price'],
      });
      await api.defineExploration(shop.orders, {
        name: orderNumbers,
        columns: ['id'],
      });
      await schemaPage.goto(shop.products.schema);
    });

    test('lists the explorations by name with their base tables', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      const stored = await api.findExploration(schema, priceList);
      await expect(explorations.items).toHaveText([
        `${orderNumbers} Based on Orders`,
        `${priceList} Based on Products`,
      ]);
      await expect(explorations.link(priceList)).toHaveAttribute(
        'href',
        explorationUrl(schema, stored?.id ?? 0),
      );
      await expect(explorations.section).toContainText('Explore your Data');
      await expect(explorations.link('Open Data Explorer')).toHaveAttribute(
        'href',
        dataExplorerUrl(schema),
      );
    });

    test('shows the description of an exploration on hover', async ({
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      await expect(explorations.descriptionIcon(orderNumbers)).toHaveCount(0);
      await explorations.descriptionIcon(priceList).hover();
      await expect(schemaPage.tooltip).toHaveText('Prices of all products');
    });

    test('renames an exploration and changes its description', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      const newName = uniqueName('Catalogue');
      const renameModal = schemaPage.renameModal('Exploration', priceList);
      await explorations.chooseAction(priceList, 'Rename Exploration');
      await expect(renameModal.name).toHaveValue(priceList);
      await expect(renameModal.description).toHaveValue(
        'Prices of all products',
      );
      await renameModal.name.fill(newName);
      await renameModal.description.fill('What we sell');
      await renameModal.button('Save').click();

      await renameModal.expectClosed();
      await expect(explorations.items).toHaveText([
        `${newName} Based on Products`,
        `${orderNumbers} Based on Orders`,
      ]);
      expect(await api.listExplorations(schema)).toContainEqual(
        expect.objectContaining({ name: newName, description: 'What we sell' }),
      );
    });

    test.describe('with a name that another exploration has', () => {
      async function renameToTakenName(
        page: Page,
        schemaPage: SchemaPage,
      ): Promise<void> {
        const renameModal = schemaPage.renameModal('Exploration', orderNumbers);
        await schemaPage.explorations.chooseAction(
          orderNumbers,
          'Rename Exploration',
        );
        await renameModal.name.fill(priceList);
        await renameModal.button('Save').click();
        await new Toasts(page).expectMessage(
          'duplicate key value violates unique constraint',
        );
        await renameModal.expectOpen();
      }

      test.describe('today', () => {
        test.use({ allowedBrowserErrors: /mathesar_explorations_name_key/ });

        test(
          'reports the error of the server and also throws it uncaught',
          pinsKnownBug('exploration-rename-error-uncaught'),
          async ({ page, api, schema, schemaPage }) => {
            const uncaughtError = page.waitForEvent('pageerror');
            await renameToTakenName(page, schemaPage);
            expect((await uncaughtError).message).toContain(
              'duplicate key value violates unique constraint "mathesar_explorations_name_key"',
            );
            expect(
              await api.findExploration(schema, orderNumbers),
            ).toBeDefined();
          },
        );
      });

      test.fixme('reports the error of the server', async ({
        page,
        api,
        schema,
        schemaPage,
      }) => {
        await renameToTakenName(page, schemaPage);
        expect(await api.findExploration(schema, orderNumbers)).toBeDefined();
      });
    });

    test(
      'saves an exploration without a name',
      pinsKnownBug('exploration-renamed-to-nothing'),
      async ({ api, schema, schemaPage }) => {
        const { explorations } = schemaPage;
        const renameModal = schemaPage.renameModal('Exploration', priceList);
        await explorations.chooseAction(priceList, 'Rename Exploration');
        await renameModal.name.fill('');
        await renameModal.button('Save').click();

        await renameModal.expectClosed();
        await expect(explorations.items).toHaveText([
          'Based on Products',
          `${orderNumbers} Based on Orders`,
        ]);
        expect(await api.findExploration(schema, '')).toBeDefined();
      },
    );

    test.fixme('requires a name to rename an exploration', async ({
      schemaPage,
    }) => {
      const renameModal = schemaPage.renameModal('Exploration', priceList);
      await schemaPage.explorations.chooseAction(
        priceList,
        'Rename Exploration',
      );
      await renameModal.name.fill('');
      await expect(renameModal.button('Save')).toBeDisabled();
    });

    test('duplicates an exploration under a name that is not taken in the schema', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      await explorations.chooseAction(priceList, 'Duplicate Exploration');
      await expect(explorations.items).toHaveText([
        `Duplicate of ${priceList} Based on Products`,
        `${orderNumbers} Based on Orders`,
        `${priceList} Based on Products`,
      ]);

      await explorations.chooseAction(priceList, 'Duplicate Exploration');
      await expect(
        explorations.item(`Duplicate of ${priceList} (1)`),
      ).toBeVisible();
      await explorations.chooseAction(priceList, 'Duplicate Exploration');
      await expect(
        explorations.item(`Duplicate of ${priceList} (2)`),
      ).toBeVisible();
      expect(await api.listExplorations(schema)).toContainEqual(
        expect.objectContaining({
          name: `Duplicate of ${priceList} (2)`,
          description: 'Prices of all products',
        }),
      );
    });

    test.describe('with a duplicate that the server refuses', () => {
      async function duplicateRefused(
        page: Page,
        schemaPage: SchemaPage,
      ): Promise<void> {
        await failRpcMethod(
          page,
          'explorations.add',
          'The explorations are read-only',
        );
        await schemaPage.explorations.chooseAction(
          priceList,
          'Duplicate Exploration',
        );
        await new Toasts(page).expectMessage(
          'Failed to duplicate data exploration. The explorations are read-only',
        );
      }

      async function expectNoCopy(schemaPage: SchemaPage): Promise<void> {
        await expect(schemaPage.explorations.items).toHaveText([
          `${orderNumbers} Based on Orders`,
          `${priceList} Based on Products`,
        ]);
      }

      test.describe('today', () => {
        test.use({ allowedBrowserErrors: /The explorations are read-only/ });

        test(
          'reports the error of the server and also throws it uncaught',
          pinsKnownBug('exploration-duplicate-error-uncaught'),
          async ({ page, schemaPage }) => {
            const uncaughtError = page.waitForEvent('pageerror');
            await duplicateRefused(page, schemaPage);
            expect(uncaughtErrorMessage(await uncaughtError)).toBe(
              'The explorations are read-only',
            );
            await expectNoCopy(schemaPage);
          },
        );
      });

      test.fixme('reports the error of the server', async ({
        page,
        schemaPage,
      }) => {
        await duplicateRefused(page, schemaPage);
        await expectNoCopy(schemaPage);
      });
    });

    test('deletes an exploration after confirmation', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      const deleteModal = schemaPage.deleteModal('Exploration', priceList);
      await explorations.chooseAction(priceList, 'Delete Exploration');
      await expect(deleteModal.body).toHaveText(
        'Are you sure you want to proceed?',
      );
      await deleteModal.button('Delete Exploration').click();

      await deleteModal.expectClosed();
      await expect(explorations.items).toHaveText([
        `${orderNumbers} Based on Orders`,
      ]);
      expect(await api.findExploration(schema, priceList)).toBeUndefined();
    });

    test('keeps the exploration when the deletion is cancelled', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { explorations } = schemaPage;
      const deleteModal = schemaPage.deleteModal('Exploration', priceList);
      await explorations.chooseAction(priceList, 'Delete Exploration');
      await deleteModal.button('Cancel').click();

      await deleteModal.expectClosed();
      await expect(explorations.item(priceList)).toBeVisible();
      expect(await api.findExploration(schema, priceList)).toBeDefined();
    });
  });
});
