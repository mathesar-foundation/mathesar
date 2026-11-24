import { FilterDropdown } from '../../support/ui/components/filter-dropdown';
import { GroupDropdown } from '../../support/ui/components/group-dropdown';
import { menuItem } from '../../support/ui/components/menu';
import { SortDropdown } from '../../support/ui/components/sort-dropdown';
import { expectLoadingEnded } from '../../support/ui/components/status-bar';
import { TablePage } from '../../support/ui/pages/table-page';
import { ScreenshotAreas } from '../../support/ui/screenshot-areas';
import { expect, expectSettled, test } from './fixtures';

let tablePage: TablePage;

test.beforeEach(async ({ page, library }) => {
  tablePage = new TablePage(page);
  await tablePage.goto(library.books);
  await expect(tablePage.sheet.activeCell).toHaveCount(1);
});

test('the Filter dropdown with two conditions', async ({ page }) => {
  const filter = new FilterDropdown(tablePage);
  const title = await filter.addFirstCondition('Title');
  await title.value.fill('e');
  await expectLoadingEnded(tablePage);
  await filter.rootGroup.addCondition('Pages');
  await filter.condition(1).apply('is greater than', '420');
  await expect(tablePage.sheet.recordRows).toHaveCount(3);
  await expectSettled(page);

  await expect(filter.panel).toHaveScreenshot('filter-dropdown.png');
});

test('the Sort dropdown with two sort columns', async ({ page }) => {
  const sort = new SortDropdown(tablePage);
  await sort.addFirstEntry('Author');
  await sort.addEntry('Pages');
  await expect(sort.entries).toHaveCount(2);
  await expectLoadingEnded(tablePage);
  await expectSettled(page);

  await expect(sort.panel).toHaveScreenshot('sort-dropdown.png');
});

test('the Group dropdown with a grouping by a linked column', async ({
  page,
}) => {
  const group = new GroupDropdown(tablePage);
  await group.addFirstEntry('Author');
  await expect(group.entries).toHaveCount(1);
  await expectLoadingEnded(tablePage);
  await expectSettled(page);

  await expect(group.panel).toHaveScreenshot('group-dropdown.png');
});

test('the sheet with the records grouped by a linked column', async ({
  page,
}) => {
  await tablePage.sheet.columnHeader('Author').click({ button: 'right' });
  await menuItem(page, 'Group by Column').click();
  await expect(tablePage.sheet.groupHeaders).toHaveCount(4);
  await expectLoadingEnded(tablePage);
  await expectSettled(page);

  await expect(new ScreenshotAreas(page).tableSheet).toHaveScreenshot(
    'sheet-grouped.png',
  );
});
