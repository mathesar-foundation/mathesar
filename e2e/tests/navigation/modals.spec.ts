import {
  modalCloseButton,
  modalOverlay,
} from '../../support/ui/components/modal-window';
import { GatedTablePage } from '../../support/ui/pages/privilege-gated-pages';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { expect, test } from './fixtures';

test('a modal that ignores Escape closes on its cross and gives the focus back to its button', async ({
  page,
  library,
}) => {
  const schemaPage = new SchemaPage(page);
  const modal = schemaPage.permissionsModal('Library', 'schema');
  await page.clock.install();
  await schemaPage.goto(library.schema);
  await schemaPage.permissionsButton.click();
  await modal.expectOpen();

  await page.keyboard.press('Escape');
  // A modal that closes slides out for 150 ms.
  await page.clock.runFor(1000);
  await modal.expectOpen();

  await modalCloseButton(modal).click();
  await modal.expectClosed();
  await expect(schemaPage.permissionsButton).toBeFocused();
});

test.describe('a confirmation over another modal', () => {
  let tablePage: GatedTablePage;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new GatedTablePage(page);
    await tablePage.goto(library.books);
    await tablePage.inspector.button('Advanced').click();
    await tablePage.inspector.button(/^Constraints/).click();
    await tablePage.constraintsModal.deleteButton('Title').click();
  });

  test('leaves the modal below without its overlay and its cross until Escape closes the confirmation', async ({
    page,
  }) => {
    const { constraintsModal } = tablePage;
    const confirmation = constraintsModal.deleteConfirmation('Books_Title_key');
    await confirmation.expectOpen();
    await expect(modalOverlay(constraintsModal)).toHaveCount(0);
    await expect(modalCloseButton(constraintsModal)).toHaveCount(0);

    await page.keyboard.press('Escape');
    await confirmation.expectClosed();
    await expect(constraintsModal.deleteButton('Title')).toBeFocused();
    await expect(modalOverlay(constraintsModal)).toHaveCount(1);
    await expect(modalCloseButton(constraintsModal)).toBeVisible();
  });

  test('keeps the Tab key inside the confirmation', async ({ page }) => {
    const confirmation =
      tablePage.constraintsModal.deleteConfirmation('Books_Title_key');
    await expect(confirmation.button('Cancel')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(confirmation.button('Delete Constraint')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(modalCloseButton(confirmation)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(confirmation.button('Cancel')).toBeFocused();
  });
});
