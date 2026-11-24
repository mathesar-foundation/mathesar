import { readFile } from 'node:fs/promises';

import { uploadFile } from '../../support/api/file-uploads';
import { holdRequests } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { downloadFrom } from '../../support/ui/components/file-attachments';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { TablePage } from '../../support/ui/pages/table-page';
import { tableUrl } from '../../support/ui/urls';
import {
  COVER,
  NOTES_TEXT,
  SMALL_IMAGE,
  attachmentCell,
  expect,
  storeAttachment,
  storedAttachments,
  test,
} from './fixtures';

test.describe('the details of a file that is not an image', () => {
  test('a click on the file shows its name, storage URI and MIME type, with the focus on Remove', async ({
    documents: { notes },
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await attachmentCell(sheet, 1).fileButton.click();

    const { details } = fileDropdown;
    await expect(details.labels).toHaveText([
      'Name',
      'Storage URI',
      'MIME type',
    ]);
    await expect(details.name).toHaveText('notes.txt');
    await expect(details.storageUri).toHaveText(notes.uri);
    await expect(details.mimeType).toHaveText('text/plain');
    await expect(fileDropdown.removeButton).toBeFocused();
    await expect(fileDropdown.downloadLink).toBeVisible();
  });

  test('the details open under the file', async ({
    tablePage: { sheet },
    fileDropdown,
  }) => {
    const file = attachmentCell(sheet, 1).fileButton;
    await file.click();
    await expect(fileDropdown.removeButton).toBeFocused();

    const fileBox = (await file.boundingBox())!;
    await expect
      .poll(async () => (await fileDropdown.root.boundingBox())!.y)
      .toBeGreaterThan(fileBox.y + fileBox.height / 2);
    const details = (await fileDropdown.root.boundingBox())!;
    const fileCenter = fileBox.x + fileBox.width / 2;
    expect(details.x).toBeLessThan(fileCenter);
    expect(details.x + details.width).toBeGreaterThan(fileCenter);
  });

  test('the file button names the file in a tooltip', async ({
    page,
    tablePage: { sheet },
  }) => {
    await attachmentCell(sheet, 1).fileButton.hover();

    await expect(tooltip(page)).toHaveText('notes.txt');
  });

  test('Escape closes the details and gives the focus back to the cell', async ({
    page,
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await attachmentCell(sheet, 1).fileButton.click();
    await expect(fileDropdown.removeButton).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(fileDropdown.root).toHaveCount(0);
    await expect(sheet.cell(1, 'Attachment')).toHaveAttribute(
      'data-cell-active',
    );
    await sheet.expectFocusOnActiveCell();
  });

  test('Enter on the active cell opens the details', async ({
    page,
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await sheet.cell(1, 'Title').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(fileDropdown.removeButton).toBeFocused();
  });

  test('a double click on the cell beside the file opens the details', async ({
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await sheet.cell(1, 'Attachment').dblclick({ position: { x: 120, y: 10 } });

    await expect(fileDropdown.removeButton).toBeVisible();
  });

  test('Download saves the file under its name and keeps the page and the details', async ({
    page,
    documents: { table },
    tablePage: { sheet },
    fileDropdown,
  }) => {
    await attachmentCell(sheet, 1).fileButton.click();
    const file = await downloadFrom(fileDropdown.downloadLink);

    expect(file.name).toBe('notes.txt');
    expect(file.content.toString()).toBe(NOTES_TEXT);
    await expect(page).toHaveURL(tableUrl(table));
    await expectStaysOpen(fileDropdown.root);
  });

  test('Remove asks first, then empties the cell and stores NULL', async ({
    documents: { table, cover },
    tablePage: { sheet },
    fileDropdown,
    removeConfirmation,
  }) => {
    const readingNotes = attachmentCell(sheet, 1);
    await readingNotes.fileButton.click();
    await fileDropdown.removeButton.click();
    await expect(removeConfirmation.body).toHaveText(
      'Are you sure you wish to remove this file?',
    );
    await expect(readingNotes.fileButton).toBeVisible();
    await removeConfirmation.removeButton.click();

    await removeConfirmation.expectClosed();
    await expect(fileDropdown.root).toHaveCount(0);
    await expect(readingNotes.fileButton).toHaveCount(0);
    await expect(readingNotes.uploadButton).toBeVisible();
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([cover, null, null]);
  });

  test('Escape in the confirmation keeps the file, closes the details and gives the focus back to the cell', async ({
    page,
    documents: { table, cover, notes },
    tablePage: { sheet },
    fileDropdown,
    removeConfirmation,
  }) => {
    const readingNotes = attachmentCell(sheet, 1);
    await readingNotes.fileButton.click();
    await fileDropdown.removeButton.click();
    await removeConfirmation.expectOpen();
    await page.keyboard.press('Escape');

    await removeConfirmation.expectClosed();
    await expect(fileDropdown.root).toHaveCount(0);
    await expect(readingNotes.fileButton).toHaveAccessibleName(notes.uri);
    await sheet.expectFocusOnActiveCell();
    expect(await storedAttachments(table)).toEqual([cover, notes, null]);
  });

  test(
    'leaves the keyboard focus on the page after a removal, so that the arrow keys do nothing',
    pinsKnownBug('file-removal-loses-focus'),
    async ({
      page,
      tablePage: { sheet },
      fileDropdown,
      removeConfirmation,
    }) => {
      await attachmentCell(sheet, 1).fileButton.click();
      await fileDropdown.removeButton.click();
      await removeConfirmation.removeButton.click();
      await removeConfirmation.expectClosed();

      await expect(sheet.focusTarget(sheet.activeCell)).not.toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(sheet.cell(1, 'Attachment')).toHaveAttribute(
        'data-cell-active',
      );
    },
  );

  test.fixme('gives the focus back to the cell after a removal', async ({
    page,
    tablePage: { sheet },
    fileDropdown,
    removeConfirmation,
  }) => {
    await attachmentCell(sheet, 1).fileButton.click();
    await fileDropdown.removeButton.click();
    await removeConfirmation.removeButton.click();
    await removeConfirmation.expectClosed();

    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowDown');
    await expect(sheet.cell(2, 'Attachment')).toHaveAttribute(
      'data-cell-active',
    );
  });
});

test.describe('the lightbox of an image', () => {
  test('a click on the thumbnail shows the full image with labelled buttons and the focus on the close button', async ({
    documents: { cover },
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();

    await expect(lightbox.image).toHaveAttribute(
      'src',
      new RegExp(`/files/${cover.mash}/$`),
    );
    await expect(lightbox.closeButton).toBeFocused();
    await expect(lightbox.buttonLabel('Remove')).toBeVisible();
    await expect(lightbox.buttonLabel('Info')).toBeVisible();
    await expect(lightbox.buttonLabel('Download')).toBeVisible();
  });

  test('the thumbnail names the file in a tooltip', async ({
    page,
    tablePage: { sheet },
  }) => {
    await attachmentCell(sheet, 0).thumbnail.hover();

    await expect(tooltip(page)).toHaveText('cover.png');
  });

  test('Escape closes the lightbox and gives the focus back to the cell', async ({
    page,
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    await expect(lightbox.closeButton).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(lightbox.root).toHaveCount(0);
    await sheet.expectFocusOnActiveCell();
  });

  test('Tab moves through the buttons of the lightbox and stays inside it', async ({
    page,
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    await expect(lightbox.closeButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(lightbox.removeButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(lightbox.infoButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(lightbox.downloadLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(lightbox.closeButton).toBeFocused();
    await expectStaysOpen(lightbox.root);
  });

  test('the close button closes the lightbox and gives the focus back to the cell', async ({
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    await lightbox.closeButton.click();

    await expect(lightbox.root).toHaveCount(0);
    await sheet.expectFocusOnActiveCell();
  });

  test('Enter on the active cell opens the lightbox', async ({
    page,
    tablePage: { sheet },
    lightbox,
  }) => {
    await sheet.cell(0, 'Title').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(lightbox.closeButton).toBeFocused();
  });

  test('Info shows the name, the storage URI and the MIME type of the image', async ({
    documents: { cover },
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    await lightbox.infoButton.click();

    await expect(lightbox.details.name).toHaveText('cover.png');
    await expect(lightbox.details.storageUri).toHaveText(cover.uri);
    await expect(lightbox.details.mimeType).toHaveText('image/png');
  });

  test('Escape with the details of Info open closes them and the lightbox together', async ({
    page,
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    await lightbox.infoButton.click();
    await expect(lightbox.details.name).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(lightbox.details.name).toHaveCount(0);
    await expect(lightbox.root).toHaveCount(0);
  });

  test(
    'the Info button is named "Filter"',
    pinsKnownBug('lightbox-info-button-named-filter'),
    async ({ tablePage: { sheet }, lightbox }) => {
      await attachmentCell(sheet, 0).thumbnail.click();

      await expect(lightbox.infoButton).toHaveAccessibleName('Filter');
    },
  );

  test.fixme('the Info button is named "Info"', async ({
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();

    await expect(lightbox.infoButton).toHaveAccessibleName('Info');
  });

  test('Download saves the image under its name', async ({
    tablePage: { sheet },
    lightbox,
  }) => {
    await attachmentCell(sheet, 0).thumbnail.click();
    const file = await downloadFrom(lightbox.downloadLink);

    expect(file.name).toBe('cover.png');
    expect(file.content).toEqual(await readFile(COVER));
  });

  test('Remove asks first, then empties the cell, which keeps the focus', async ({
    documents: { table, notes },
    tablePage: { sheet },
    lightbox,
    removeConfirmation,
  }) => {
    const bookCover = attachmentCell(sheet, 0);
    await bookCover.thumbnail.click();
    await lightbox.removeButton.click();
    await removeConfirmation.expectOpen();
    await expect(bookCover.thumbnail).toBeVisible();
    await removeConfirmation.removeButton.click();

    await expect(lightbox.root).toHaveCount(0);
    await expect(bookCover.thumbnail).toHaveCount(0);
    await expect(bookCover.uploadButton).toBeVisible();
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(() => storedAttachments(table))
      .toEqual([null, notes, null]);
  });

  test('the names of the buttons show as tooltips when the image is small', async ({
    page,
    documents: { table },
    lightbox,
  }) => {
    const smallImage = await uploadFile(page.request, SMALL_IMAGE);
    await storeAttachment(table, 3, JSON.stringify(smallImage));
    const tablePage = new TablePage(page);
    await tablePage.goto(table);
    await attachmentCell(tablePage.sheet, 2).thumbnail.click();
    // Until the lightbox has zoomed in, its buttons move away from the pointer.
    await expectStaysOpen(lightbox.root);

    await expect(lightbox.buttonLabel('Download')).toBeHidden();
    await lightbox.downloadLink.hover();
    // The tooltip of the thumbnail closes a moment after the pointer left it.
    await expect(tooltip(page)).toHaveText(['Download']);
  });

  test.describe(() => {
    // The app logs the failure that the test causes. Firefox reduces the
    // logged error to its name.
    test.use({ allowedBrowserErrors: /Error: Failed to load image|^Error$/ });

    test('says so when the image cannot be loaded', async ({
      page,
      documents: { cover },
      tablePage: { sheet },
      lightbox,
    }) => {
      await page.route(`**/files/${cover.mash}/`, (route) =>
        route.fulfill({ status: 404 }),
      );
      await attachmentCell(sheet, 0).thumbnail.click();

      await new Toasts(page).expectMessage('Failed to load image');
      await expect(lightbox.root).toHaveCount(0);
    });
  });

  test('shows a spinner while the image loads, and stays closed when the user clicks elsewhere meanwhile', async ({
    page,
    documents: { cover },
    tablePage: { sheet },
    lightbox,
  }) => {
    const releaseImage = await holdRequests(page, `**/files/${cover.mash}/`);
    const bookCover = attachmentCell(sheet, 0);
    await bookCover.thumbnail.click();
    await expect(bookCover.loadingIndicator).toBeVisible();
    await sheet.cell(1, 'Title').click();
    releaseImage();

    await expect(bookCover.loadingIndicator).toHaveCount(0);
    await expect(lightbox.root).toHaveCount(0);
  });
});
