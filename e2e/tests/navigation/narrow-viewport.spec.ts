import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { AppShell } from '../../support/ui/pages/app-shell';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, test } from './fixtures';

test.describe('header of a window 750 pixels wide', () => {
  test.use({ viewport: { width: 750, height: 800 } });

  let breadcrumb: Breadcrumb;
  let shell: AppShell;

  test.beforeEach(({ page }) => {
    breadcrumb = new Breadcrumb(page);
    shell = new AppShell(page);
  });

  test('hides the app name and the feedback label once a level of the trail needs the room', async ({
    page,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.schema);
    await expect(breadcrumb.items).toHaveCount(2);
    await expect(breadcrumb.appName).toBeVisible();
    await expect(shell.feedbackButton).toHaveText('Feedback');

    await schemaPage.tables.link('Books').click();
    await expect(breadcrumb.items).toHaveCount(3);
    await expect(breadcrumb.appName).toBeHidden();
    await expect(shell.feedbackButton).toHaveText('');
  });

  test('shows them again while the window is wider', async ({
    page,
    library,
  }) => {
    await new TablePage(page).goto(library.books);
    await expect(breadcrumb.appName).toBeHidden();
    await expect(shell.feedbackButton).toHaveText('');

    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(breadcrumb.appName).toBeVisible();
    await expect(shell.feedbackButton).toHaveText('Feedback');

    await page.setViewportSize({ width: 750, height: 800 });
    await expect(breadcrumb.appName).toBeHidden();
    await expect(shell.feedbackButton).toHaveText('');
  });
});
