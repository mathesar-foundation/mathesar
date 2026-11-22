import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { uncaughtErrorMessage } from '../../support/page-errors';
import { columnMenuItem } from '../../support/ui/components/column-options';
import { menuItem } from '../../support/ui/components/menu';
import { chooseOption } from '../../support/ui/components/select';
import {
  expectLoadingEnded,
  retryButton,
} from '../../support/ui/components/status-bar';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { TablePage } from '../../support/ui/pages/table-page';
import {
  encodeViewState,
  tableUrlWithQuery,
  viewStateInUrl,
} from '../../support/ui/table-view-url';
import { schemaUrl } from '../../support/ui/urls';
import { ORDER_ITEMS, expect, shownItems, test } from './fixtures';

/** The parts of a view in the URL. Columns are named by attnum. */
interface ViewParts {
  pagination?: [number, number];
  sorting?: [string, 'ASCENDING' | 'DESCENDING'][];
  grouping?: string[][];
  /** The conditions of the outermost filter group, which joins them by "and". */
  filters?: unknown[];
  hiddenColumns?: string[];
}

const ITEMS_ASCENDING = ['Chair', 'Desk', 'Lamp', 'Lantern', 'Mirror', 'Sofa'];
const ITEMS_DESCENDING = [...ITEMS_ASCENDING].reverse();

/** What reading `type` of an undefined column throws, as each browser words it. */
const TYPE_OF_UNDEFINED = {
  chromium: /^Cannot read properties of undefined \(reading 'type'\)$/,
  firefox: /^can't access property "type", \w+ is undefined$/,
  webkit: /^undefined is not an object \(evaluating '\w+\.type'\)$/,
};

/** A view state with only these parts changed from the default view. */
function viewState({
  pagination = [1, 500],
  sorting = [],
  grouping = [],
  filters = [],
  hiddenColumns = [],
}: ViewParts): unknown {
  return [
    pagination,
    sorting,
    grouping,
    ['g', 'and', filters],
    [],
    hiddenColumns,
  ];
}

test.describe('the view in the URL', () => {
  test('is left out for the default view, also after a change is undone', async ({
    page,
    orders,
    ordersPage: { sheet },
    sort,
  }) => {
    expect(viewStateInUrl(page)).toBeUndefined();

    await sort.addFirstEntry('Item');
    await expect(shownItems(sheet)).toHaveText(ITEMS_ASCENDING);
    await expect
      .poll(() => viewStateInUrl(page))
      .toEqual(
        viewState({ sorting: [[String(orders.columns.Item), 'ASCENDING']] }),
      );

    await sort.entry(0).removeButton.click();
    await expect(shownItems(sheet)).toHaveText(ORDER_ITEMS);
    await expect.poll(() => viewStateInUrl(page)).toBeUndefined();
  });

  test('holds the filter, sort, grouping, hidden columns and page size, which a reload restores', async ({
    page,
    orders,
    ordersPage,
    filter,
    sort,
    group,
    hide,
    pagination,
  }) => {
    const { sheet } = ordersPage;
    const column = (name: string): string => String(orders.columns[name]);
    const groupHeaders = ['Paid false 1', 'Paid true 2', 'Paid NULL 1'];
    const items = ['Lantern', 'Lamp', 'Chair', 'Sofa'];
    const quantity = await filter.addFirstCondition('Quantity');
    await quantity.apply('is greater or equal to', '3');
    await expect(shownItems(sheet)).toHaveCount(4);
    await sheet.columnHeader('Item').click({ button: 'right' });
    await menuItem(page, 'Sort Z-A').click();
    await expect(shownItems(sheet)).toHaveText([
      'Sofa',
      'Lantern',
      'Lamp',
      'Chair',
    ]);
    await sheet.columnHeader('Paid').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();
    await expect(sheet.groupHeaders).toHaveText(groupHeaders);
    await expect(shownItems(sheet)).toHaveText(items);
    await sheet.columnHeader('Note').click({ button: 'right' });
    await menuItem(page, 'Hide Column').click();
    await chooseOption(pagination.pageSize, '50');
    await ordersPage.expectLoaded();

    await expect
      .poll(() => viewStateInUrl(page))
      .toEqual(
        viewState({
          pagination: [1, 50],
          sorting: [[column('Item'), 'DESCENDING']],
          grouping: [[column('Paid')]],
          filters: [['i', column('Quantity'), 'greater_or_equal', '3']],
          hiddenColumns: [column('Note')],
        }),
      );

    await page.reload();
    await ordersPage.expectLoaded();

    await expect(sheet.groupHeaders).toHaveText(groupHeaders);
    await expect(shownItems(sheet)).toHaveText(items);
    await expect(sheet.columnHeader('Note')).toHaveCount(0);
    await expect(pagination.pageSize).toHaveText('50');
    await expect(sort.trigger).toHaveText('Sort 1');
    await expect(group.trigger).toHaveText('Group 1');
    await expect(hide.trigger).toHaveText('Hide 1');
    await filter.trigger.click();
    await expect(filter.condition(0).column).toHaveText('Quantity');
    await expect(filter.condition(0).condition).toHaveText(
      'is greater or equal to',
    );
    await expect(filter.condition(0).value).toHaveValue('3');
  });

  test('changes replace the history entry, so Back leaves the table and Forward brings the view back', async ({
    page,
    orders,
    ordersPage,
    hide,
  }) => {
    const { sheet } = ordersPage;
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(orders.schema);
    // WebKit reports the requests of a page left too early. Forms load last.
    await expect(schemaPage.forms.section).toContainText('No Forms');
    await ordersPage.goto(orders);
    await sheet.columnHeader('Item').click({ button: 'right' });
    await menuItem(page, 'Sort Z-A').click();
    await expect(shownItems(sheet)).toHaveText(ITEMS_DESCENDING);
    await sheet.columnHeader('Note').click({ button: 'right' });
    await menuItem(page, 'Hide Column').click();
    await expect(hide.trigger).toHaveText('Hide 1');

    await page.goBack();
    await expect(page).toHaveURL(schemaUrl(orders.schema));
    await expect(schemaPage.forms.section).toContainText('No Forms');

    await page.goForward();
    await expect(shownItems(sheet)).toHaveText(ITEMS_DESCENDING);
    await expect(sheet.columnHeader('Note')).toHaveCount(0);
  });

  test('a filter condition without a value and an empty group are not kept, so a reload drops them', async ({
    page,
    ordersPage,
    filter,
  }) => {
    await filter.addFirstCondition('Item');
    await filter.rootGroup.addGroupButton.click();
    await expect(filter.trigger).toHaveText('Filter 1');
    expect(viewStateInUrl(page)).toBeUndefined();

    await page.reload();
    await ordersPage.expectLoaded();
    await expect(shownItems(ordersPage.sheet)).toHaveCount(6);
    await expect(filter.trigger).toHaveText('Filter');
    await filter.trigger.click();
    await expect(columnMenuItem(page, 'Item')).toBeVisible();
  });
});

test.describe('opening a URL with a view', () => {
  test('that is not a view opens the default view and drops it from the URL', async ({
    page,
    orders,
  }) => {
    const tablePage = new TablePage(page);

    await page.goto(tableUrlWithQuery(orders, 'not-a-view'));
    await expect(shownItems(tablePage.sheet)).toHaveText(ORDER_ITEMS);
    await expect.poll(() => viewStateInUrl(page)).toBeUndefined();
    await tablePage.expectLoaded();

    await page.goto(tableUrlWithQuery(orders, encodeViewState({ page: 2 })));
    await expect(shownItems(tablePage.sheet)).toHaveText(ORDER_ITEMS);
    await expect.poll(() => viewStateInUrl(page)).toBeUndefined();
  });

  test('sorting or hiding by a column that does not exist is ignored', async ({
    page,
    orders,
    sort,
    hide,
  }) => {
    const tablePage = new TablePage(page);
    const view = viewState({
      sorting: [['999', 'DESCENDING']],
      hiddenColumns: ['999'],
    });

    await page.goto(tableUrlWithQuery(orders, encodeViewState(view)));

    await expect(shownItems(tablePage.sheet)).toHaveText(ORDER_ITEMS);
    await expect(tablePage.sheet.columnHeaders).toHaveCount(12);
    await expect(sort.trigger).toHaveText('Sort 1');
    await expect(hide.trigger).toHaveText('Hide 1');
  });

  test('filtering or grouping by a column that does not exist loads no records', async ({
    page,
    orders,
  }) => {
    const tablePage = new TablePage(page);
    const filtered = viewState({ filters: [['i', '999', 'equal', '3']] });
    const grouped = viewState({ grouping: [['999']] });

    await page.goto(tableUrlWithQuery(orders, encodeViewState(filtered)));
    await expect(tablePage.recordCount).toHaveText('No records found');
    await expect(retryButton(tablePage)).toBeVisible();

    await page.goto(tableUrlWithQuery(orders, encodeViewState(grouped)));
    await expect(tablePage.recordCount).toHaveText('No records found');
    await expect(retryButton(tablePage)).toBeVisible();
    await expect(tablePage.sheet.recordRows).toHaveCount(0);
  });

  test('a page size that the select does not offer is used, while the select shows 10', async ({
    page,
    longTable,
    pagination,
  }) => {
    const tablePage = new TablePage(page);

    await page.goto(
      tableUrlWithQuery(
        longTable,
        encodeViewState(viewState({ pagination: [1, 7] })),
      ),
    );

    await expect(tablePage.recordCount).toHaveText('Showing 1–7 of 1,200');
    await expect(tablePage.sheet.recordRows).toHaveCount(7);
    await expect(pagination.currentPage).toHaveText('Page 1 of 172');
    await expect(pagination.pageSize).toHaveText('10');
  });

  test(
    'a reload shows the first page again and keeps the page size',
    pinsKnownBug('page-lost-on-load'),
    async ({ page, longTablePage, pagination }) => {
      await chooseOption(pagination.pageSize, '100');
      await expectLoadingEnded(longTablePage);
      await pagination.nextButton.click();
      await expect(longTablePage.recordCount).toHaveText(
        'Showing 101–200 of 1,200',
      );
      await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 101');

      await page.reload();
      await longTablePage.expectLoaded();

      await expect(pagination.currentPage).toHaveText('Page 1 of 12');
      await expect(longTablePage.recordCount).toHaveText(
        'Showing 1–100 of 1,200',
      );
      await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 1');
      await expect
        .poll(() => viewStateInUrl(page))
        .toEqual(viewState({ pagination: [1, 100] }));
    },
  );

  test.fixme('a reload stays on the page of the URL', async ({
    page,
    longTablePage,
    pagination,
  }) => {
    await chooseOption(pagination.pageSize, '100');
    await expectLoadingEnded(longTablePage);
    await pagination.nextButton.click();
    await expect(pagination.currentPage).toHaveText('Page 2 of 12');
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 101');

    await page.reload();
    await longTablePage.expectLoaded();

    await expect(pagination.currentPage).toHaveText('Page 2 of 12');
    await expect(longTablePage.recordCount).toHaveText(
      'Showing 101–200 of 1,200',
    );
    await expect(longTablePage.sheet.cell(0, 'Label')).toHaveText('row 101');
  });
});

test.describe('the Filter dropdown opened while a filtered table loads', () => {
  test.use({
    allowedBrowserErrors: /reading 'type'|property "type"|\w+\.type'/,
  });

  // What the records and the status bar show afterwards depends on timing.
  test(
    'loses the column and the condition, with an uncaught TypeError',
    pinsKnownBug('filter-opened-while-loading'),
    async ({ page, orders, filter, browserName }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(uncaughtErrorMessage(error)));
      const view = viewState({
        filters: [
          ['i', String(orders.columns.Item), 'contains_case_insensitive', 'la'],
        ],
      });
      const releaseColumns = await holdRpcCalls(
        page,
        'columns.list_with_metadata',
      );
      await page.goto(tableUrlWithQuery(orders, encodeViewState(view)));
      await filter.trigger.click();
      await expect(filter.panel).toBeVisible();

      releaseColumns();

      await expect(filter.condition(0).column).toHaveText('');
      await expect(filter.condition(0).condition).toHaveText('');
      await expect
        .poll(() => errors)
        .toContainEqual(expect.stringMatching(TYPE_OF_UNDEFINED[browserName]));
    },
  );

  test.fixme('shows the condition once the columns are there', async ({
    page,
    orders,
    filter,
  }) => {
    const tablePage = new TablePage(page);
    const view = viewState({
      filters: [
        ['i', String(orders.columns.Item), 'contains_case_insensitive', 'la'],
      ],
    });
    const releaseColumns = await holdRpcCalls(
      page,
      'columns.list_with_metadata',
    );
    await page.goto(tableUrlWithQuery(orders, encodeViewState(view)));
    await filter.trigger.click();

    releaseColumns();

    await expect(filter.condition(0).column).toHaveText('Item');
    await expect(shownItems(tablePage.sheet)).toHaveText(['Lamp', 'Lantern']);
  });
});
