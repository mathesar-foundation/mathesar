import { pinsKnownBug } from '../../support/known-bugs';
import { menuItem } from '../../support/ui/components/menu';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { expectLoadingEnded } from '../../support/ui/components/status-bar';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { isMarkedDocument, markDocument } from '../../support/ui/document-mark';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from './fixtures';

test.describe('paging through a long table', () => {
  test('the buttons beside the page number go to the next and the previous page', async ({
    longTablePage,
    pagination,
  }) => {
    const { sheet } = longTablePage;
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 1–500 of 1,200',
    );
    await expect(pagination.currentPage).toHaveText('Page 1 of 3');
    await expect(pagination.previousButton).toHaveCount(0);

    await pagination.nextButton.click();
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 501–1,000 of 1,200',
    );
    await expect(pagination.currentPage).toHaveText('Page 2 of 3');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 501');
    await expect(sheet.rowHeader(0)).toHaveText('501');

    await pagination.nextButton.click();
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 1,001–1,200 of 1,200',
    );
    await expect(sheet.cell(0, 'Label')).toHaveText('row 1001');
    await expect(pagination.nextButton).toHaveCount(0);

    await pagination.previousButton.click();
    await expect(pagination.currentPage).toHaveText('Page 2 of 3');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 501');
  });

  test('the page jumper goes to the page typed and closes', async ({
    longTablePage: { sheet },
    pagination,
  }) => {
    const { jumper } = pagination;
    await pagination.currentPage.click();
    await expect(jumper.pageInput).toBeFocused();
    await expect(jumper.pageInput).toHaveValue('1');
    await expect(jumper.totalPages).toHaveText('Total Pages: 3');

    await jumper.typePageNumber(3);
    await jumper.goButton.click();

    await expect(jumper.root).toBeHidden();
    await expect(pagination.currentPage).toHaveText('Page 3 of 3');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 1001');
  });

  test('the page jumper takes a number beyond the last page for the last page', async ({
    longTablePage,
    pagination,
  }) => {
    await pagination.currentPage.click();
    await pagination.jumper.typePageNumber(9);
    await pagination.jumper.goButton.click();

    await expect(pagination.currentPage).toHaveText('Page 3 of 3');
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 1,001–1,200 of 1,200',
    );
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 1001');
  });

  test('the page jumper goes to the first and the last page, each disabled where it leads nowhere', async ({
    longTablePage: { sheet },
    pagination,
  }) => {
    const { jumper } = pagination;
    await pagination.currentPage.click();
    await expect(jumper.firstPageButton).toBeDisabled();
    await jumper.lastPageButton.click();
    await expect(pagination.currentPage).toHaveText('Page 3 of 3');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 1001');
    await expect(jumper.root).toBeHidden();

    await pagination.currentPage.click();
    await expect(jumper.lastPageButton).toBeDisabled();
    await jumper.firstPageButton.click();

    await expect(pagination.currentPage).toHaveText('Page 1 of 3');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 1');
  });

  test(
    'Enter in the page jumper does nothing',
    pinsKnownBug('page-jumper-enter'),
    async ({ page, longTablePage, pagination, browserName }) => {
      test.skip(browserName === 'webkit', 'The bug does not happen in WebKit');
      test.skip(
        browserName === 'firefox',
        'Firefox submits the form of the page jumper, as the next test pins',
      );
      await pagination.currentPage.click();
      await pagination.jumper.typePageNumber(2);
      await page.keyboard.press('Enter');

      await expectStaysOpen(pagination.jumper.root);
      await expect(pagination.currentPage).toHaveText('Page 1 of 3');
      await expect(longTablePage.recordCount).toHaveText(
        'Showing 1–500 of 1,200',
      );
    },
  );

  test(
    'Enter in the page jumper submits its form, which loads the table again without its view',
    pinsKnownBug('page-jumper-enter-reloads'),
    async ({
      page,
      longTable,
      longTablePage,
      pagination,
      sort,
      browserName,
    }) => {
      test.skip(
        browserName !== 'firefox',
        'Only Firefox submits the form of the page jumper on Enter',
      );
      const { sheet } = longTablePage;
      await sheet.columnHeader('Number').click({ button: 'right' });
      await menuItem(page, 'Sort 9-0').click();
      await expect(sheet.cell(0, 'Label')).toHaveText('row 1200');
      await pagination.currentPage.click();
      await pagination.jumper.typePageNumber(2);
      await markDocument(page);
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(tableUrl(longTable));
      expect(await isMarkedDocument(page)).toBe(false);
      await longTablePage.expectLoaded();
      await expect(pagination.currentPage).toHaveText('Page 1 of 3');
      await expect(sort.trigger).toHaveText('Sort');
      await expect(sheet.cell(0, 'Label')).toHaveText('row 1');
    },
  );

  test.fixme('Enter in the page jumper goes to the page typed', async ({
    page,
    longTablePage,
    pagination,
  }) => {
    await pagination.currentPage.click();
    await pagination.jumper.typePageNumber(2);
    await page.keyboard.press('Enter');

    await expect(pagination.currentPage).toHaveText('Page 2 of 3');
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 501–1,000 of 1,200',
    );
  });

  test('a sort or a grouping keeps the page and a filter goes back to the first page', async ({
    page,
    longTablePage,
    pagination,
    filter,
  }) => {
    const { sheet } = longTablePage;
    await pagination.nextButton.click();
    await expect(sheet.cell(0, 'Label')).toHaveText('row 501');

    await sheet.columnHeader('id').click({ button: 'right' });
    await menuItem(page, 'Sort 9-0').click();
    await expect(sheet.cell(0, 'Label')).toHaveText('row 700');
    await expect(pagination.currentPage).toHaveText('Page 2 of 3');

    await sheet.columnHeader('Number').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();
    // Records are ordered by the grouping column first.
    await expect(sheet.groupHeaders.first()).toHaveText('Number 501 1');
    await expect(pagination.currentPage).toHaveText('Page 2 of 3');

    const condition = await filter.addFirstCondition('Number');
    await condition.apply('is greater than', '600');

    await expect(pagination.currentPage).toHaveText('Page 1 of 2');
    await expect(longTablePage.recordCount).toHaveText('Showing 1–500 of 600');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 601');
  });

  test('a filter without matches shows no records and no pages', async ({
    longTablePage,
    pagination,
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Number');
    await condition.apply('is greater than', '5000');

    await expect(longTablePage.recordCount).toHaveText('No records found');
    await expect(longTablePage.sheet.recordRows).toHaveCount(0);
    await expect(pagination.currentPage).toHaveText('Page 1 of 0');
    await expect(pagination.nextButton).toHaveCount(0);
  });
});

test.describe('the page size', () => {
  test('is one of 10, 50, 100 and 500 records', async ({
    longTablePage,
    pagination,
  }) => {
    const sizes = await openSelect(pagination.pageSize);
    await expect(sizes.getByRole('option')).toHaveText([
      '10',
      '50',
      '100',
      '500',
    ]);
    await sizes.getByRole('option', { name: '10', exact: true }).click();

    await expect(longTablePage.recordCount).toHaveText('Showing 1–10 of 1,200');
    await expect(pagination.currentPage).toHaveText('Page 1 of 120');
    await expect(longTablePage.sheet.recordRows).toHaveCount(10);
  });

  test('a new page size keeps the page number', async ({
    longTablePage,
    pagination,
  }) => {
    await pagination.nextButton.click();
    await expect(pagination.currentPage).toHaveText('Page 2 of 3');
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 501');

    await chooseOption(pagination.pageSize, '100');

    await expect(pagination.currentPage).toHaveText('Page 2 of 12');
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 101–200 of 1,200',
    );
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 101');
  });

  test(
    'a larger page size on a page beyond the new last page shows no records',
    pinsKnownBug('page-size-beyond-last-page'),
    async ({ longTablePage, pagination }) => {
      await chooseOption(pagination.pageSize, '100');
      await expectLoadingEnded(longTablePage);
      await pagination.currentPage.click();
      await pagination.jumper.lastPageButton.click();
      await expect(pagination.currentPage).toHaveText('Page 12 of 12');
      await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 1101');

      await chooseOption(pagination.pageSize, '500');

      await expect(longTablePage.recordCount).toHaveText('No records found');
      await expect(pagination.currentPage).toHaveText('Page 12 of 0');
      await expect(longTablePage.sheet.recordRows).toHaveCount(0);
    },
  );

  test.fixme('a larger page size on a page beyond the new last page shows the last page', async ({
    longTablePage,
    pagination,
  }) => {
    await chooseOption(pagination.pageSize, '100');
    await expectLoadingEnded(longTablePage);
    await pagination.currentPage.click();
    await pagination.jumper.lastPageButton.click();
    await expect(pagination.currentPage).toHaveText('Page 12 of 12');
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 1101');

    await chooseOption(pagination.pageSize, '500');

    await expect(pagination.currentPage).toHaveText('Page 3 of 3');
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 1,001–1,200 of 1,200',
    );
  });
});
