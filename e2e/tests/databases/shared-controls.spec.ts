import { runSql } from '../../support/api/postgres';
import { pinsKnownBug } from '../../support/known-bugs';
import { UpgradeDatabaseModal } from '../../support/ui/components/database-modals';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { moreActionsButton } from '../../support/ui/components/more-actions';
import { Toasts } from '../../support/ui/components/toast';
import { toastCloseButton } from '../../support/ui/components/toast-close-button';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { expect, test } from './fixtures';

// How modals, menus and toasts behave on every page, shown on the database page
// and the home page.
test.describe('shared controls', () => {
  let databasePage: DatabasePage;

  test.beforeEach(async ({ page, database }) => {
    databasePage = new DatabasePage(page);
    await runSql(database.name, 'CREATE SCHEMA "Sales"');
    await page.clock.install();
    await databasePage.goto(database);
  });

  test.describe('modal', () => {
    test('focuses its first field and keeps the Tab key inside', async ({
      page,
    }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await expect(createSchemaModal.name).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(createSchemaModal.description).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(createSchemaModal.button('Cancel')).toBeFocused();
      // The disabled submit button is skipped. The close button comes last.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(createSchemaModal.name).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(createSchemaModal.button('Cancel')).toBeFocused();
    });

    test('closes on Escape and returns the focus to the button that opened it', async ({
      page,
    }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await createSchemaModal.name.fill('Abandoned');
      await page.keyboard.press('Escape');

      await createSchemaModal.expectClosed();
      await expect(databasePage.createSchemaButton).toBeFocused();
      await expect(databasePage.schemaRow('Abandoned')).toHaveCount(0);
    });

    test('forgets what was typed when it opens again', async () => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await createSchemaModal.name.fill('Abandoned');
      await createSchemaModal.description.fill('Never saved');
      await createSchemaModal.button('Cancel').click();
      await createSchemaModal.expectClosed();

      await databasePage.createSchemaButton.click();
      await expect(createSchemaModal.name).toHaveValue('');
      await expect(createSchemaModal.description).toHaveValue('');
    });

    test(
      'stays open when the user clicks beside it',
      pinsKnownBug('modal-ignores-click-outside'),
      async ({ page }) => {
        const { createSchemaModal } = databasePage;
        await databasePage.createSchemaButton.click();
        await createSchemaModal.expectOpen();
        // The modal slides in and out in 150 ms. This lets it finish both times.
        await page.clock.fastForward(1000);
        await page.mouse.click(10, 10);
        await page.clock.fastForward(1000);
        await createSchemaModal.expectOpen();
      },
    );

    test.fixme('closes when the user clicks beside it', async ({ page }) => {
      const { createSchemaModal } = databasePage;
      await databasePage.createSchemaButton.click();
      await createSchemaModal.expectOpen();
      await page.clock.fastForward(1000);
      await page.mouse.click(10, 10);
      await createSchemaModal.expectClosed();
    });
  });

  test.describe('confirmation', () => {
    test('closes on Escape without doing anything', async ({
      page,
      database,
    }) => {
      await databasePage.chooseSchemaAction('Sales', 'Delete Schema');
      await databasePage.deleteSchemaModal.expectOpen();
      await page.keyboard.press('Escape');

      await databasePage.deleteSchemaModal.expectClosed();
      await expect(databasePage.schemaRow('Sales')).toBeVisible();
      expect(
        await runSql(
          database.name,
          `SELECT 1 AS found FROM pg_namespace WHERE nspname = 'Sales'`,
        ),
      ).toEqual([{ found: 1 }]);
    });

    test('closes and reports the error when the action fails', async ({
      page,
      database,
    }) => {
      await runSql(database.name, 'DROP SCHEMA "Sales"');
      await databasePage.chooseSchemaAction('Sales', 'Delete Schema');
      await databasePage.deleteSchemaModal.button('Delete Schema').click();

      await new Toasts(page).expectMessage(
        /Unable to delete Schema\. InvalidSchemaName: No schema with OID \d+ exists/,
      );
      await databasePage.deleteSchemaModal.expectClosed();
      await expect(databasePage.schemaRow('Sales')).toBeVisible();
    });
  });

  test.describe('menu', () => {
    // A card of the home page has three entries, which tells ArrowUp from ArrowDown.
    test('moves through its entries with the arrow keys and runs one on Enter', async ({
      page,
      database,
    }) => {
      const homePage = new HomePage(page);
      // Firefox and WebKit report the requests of a page that is left while it loads.
      await expect(databasePage.schemaRow('Sales')).toBeVisible();
      await homePage.goto();
      await homePage.cardMenuButton(database.name).click();
      await page.keyboard.press('ArrowDown');
      await expect(menuItem(page, 'Edit Connection')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(menuItem(page, 'Reinstall Mathesar Schemas')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(menuItem(page, 'Disconnect Database')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(menuItem(page, 'Edit Connection')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(menuItem(page, 'Disconnect Database')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(menuItem(page, 'Reinstall Mathesar Schemas')).toBeFocused();

      await page.keyboard.press('Enter');
      await UpgradeDatabaseModal.toReinstall(page, database.name).expectOpen();
      await expect(openMenu(page)).toHaveCount(0);
    });

    test('closes on Escape', async ({ page }) => {
      await moreActionsButton(databasePage.schemaRow('Sales')).click();
      await expect(openMenu(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(openMenu(page)).toHaveCount(0);
    });

    test('closes when the user clicks elsewhere', async ({ page }) => {
      await moreActionsButton(databasePage.schemaRow('Sales')).click();
      await expect(openMenu(page)).toBeVisible();
      await databasePage.schemaSearch.click();
      await expect(openMenu(page)).toHaveCount(0);
    });
  });

  test.describe('toast', () => {
    let toasts: Toasts;

    // Deleting a schema that is already gone fails with a toast. The clock stands
    // still from just before, and the toast has five of its six seconds left.
    test.beforeEach(async ({ page, database }) => {
      toasts = new Toasts(page);
      await runSql(database.name, 'DROP SCHEMA "Sales"');
      await databasePage.chooseSchemaAction('Sales', 'Delete Schema');
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
      await databasePage.deleteSchemaModal.button('Delete Schema').click();
      await expect(toasts.items).toHaveCount(1);
      await page.clock.runFor(1000);
    });

    test('disappears after six seconds', async ({ page }) => {
      await page.clock.runFor(4900);
      await expect(toasts.items).toHaveCount(1);
      await page.clock.runFor(600);
      await expect(toasts.items).toHaveCount(0);
    });

    test('stays for as long as the pointer is on it', async ({ page }) => {
      await toasts.items.hover();
      await page.clock.runFor(60_000);
      await expect(toasts.items).toHaveCount(1);

      await databasePage.schemaSearch.hover();
      await page.clock.runFor(4900);
      await expect(toasts.items).toHaveCount(1);
      await page.clock.runFor(600);
      await expect(toasts.items).toHaveCount(0);
    });

    test('closes on its close button', async ({ page }) => {
      await toastCloseButton(toasts).click();
      await page.clock.runFor(500);
      await expect(toasts.items).toHaveCount(0);
    });
  });
});
