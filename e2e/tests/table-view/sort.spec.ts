import {
  chooseColumn,
  columnMenuItem,
} from '../../support/ui/components/column-options';
import { columnIndicator } from '../../support/ui/components/column-indicators';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { expectLoadingEnded } from '../../support/ui/components/status-bar';
import { TablePage } from '../../support/ui/pages/table-page';
import { ORDER_ITEMS, expect, shownItems, test } from './fixtures';

interface SortCase {
  dataType: string;
  column: string;
  /** The names of ascending and descending order for the data type. */
  directions: [string, string];
  /** The orders in each direction. NULL sorts last ascending and first descending. */
  ascending: string[];
  descending: string[];
}

/** Orders of the records by one column, NULL last ascending and first descending. */
const BY_ITEM_DESCENDING = [
  'Sofa',
  'Mirror',
  'Lantern',
  'Lamp',
  'Desk',
  'Chair',
];
const BY_QUANTITY_DESCENDING = [
  'Mirror',
  'Lantern',
  'Chair',
  'Lamp',
  'Sofa',
  'Desk',
];
const BY_ORDERED_DESCENDING = [
  'Mirror',
  'Lantern',
  'Lamp',
  'Chair',
  'Sofa',
  'Desk',
];
const BY_STATUS_ASCENDING = [
  'Chair',
  'Lamp',
  'Lantern',
  'Desk',
  'Sofa',
  'Mirror',
];
const BY_CUSTOMER_DESCENDING = [
  'Mirror',
  'Lantern',
  'Desk',
  'Sofa',
  'Lamp',
  'Chair',
];

const sortCases: SortCase[] = [
  {
    dataType: 'text',
    column: 'Item',
    directions: ['A-Z', 'Z-A'],
    ascending: ['Chair', 'Desk', 'Lamp', 'Lantern', 'Mirror', 'Sofa'],
    descending: BY_ITEM_DESCENDING,
  },
  {
    dataType: 'number',
    column: 'Quantity',
    directions: ['0-9', '9-0'],
    ascending: ['Desk', 'Lamp', 'Sofa', 'Chair', 'Lantern', 'Mirror'],
    descending: BY_QUANTITY_DESCENDING,
  },
  {
    dataType: 'boolean',
    column: 'Paid',
    directions: ['Ascending', 'Descending'],
    ascending: ['Desk', 'Lantern', 'Lamp', 'Chair', 'Sofa', 'Mirror'],
    descending: ['Sofa', 'Mirror', 'Lamp', 'Chair', 'Desk', 'Lantern'],
  },
  {
    dataType: 'date',
    column: 'Ordered',
    directions: ['Oldest-Newest', 'Newest-Oldest'],
    ascending: ['Desk', 'Sofa', 'Chair', 'Lamp', 'Lantern', 'Mirror'],
    descending: BY_ORDERED_DESCENDING,
  },
  {
    dataType: 'time',
    column: 'At',
    directions: ['Oldest-Newest', 'Newest-Oldest'],
    ascending: ['Lamp', 'Chair', 'Desk', 'Lantern', 'Sofa', 'Mirror'],
    descending: ['Mirror', 'Sofa', 'Lantern', 'Desk', 'Lamp', 'Chair'],
  },
  {
    dataType: 'date and time',
    column: 'Shipped',
    directions: ['Oldest-Newest', 'Newest-Oldest'],
    ascending: ['Desk', 'Chair', 'Lamp', 'Lantern', 'Sofa', 'Mirror'],
    descending: ['Sofa', 'Mirror', 'Lantern', 'Lamp', 'Chair', 'Desk'],
  },
  {
    dataType: 'email',
    column: 'Email',
    directions: ['A-Z', 'Z-A'],
    ascending: ['Lamp', 'Lantern', 'Chair', 'Desk', 'Sofa', 'Mirror'],
    descending: ['Sofa', 'Mirror', 'Desk', 'Chair', 'Lantern', 'Lamp'],
  },
  {
    dataType: 'URI',
    column: 'Site',
    directions: ['A-Z', 'Z-A'],
    ascending: ['Lantern', 'Desk', 'Lamp', 'Chair', 'Sofa', 'Mirror'],
    descending: ['Sofa', 'Mirror', 'Chair', 'Lamp', 'Desk', 'Lantern'],
  },
  {
    dataType: 'enum',
    column: 'Status',
    directions: ['Ascending', 'Descending'],
    ascending: BY_STATUS_ASCENDING,
    descending: ['Mirror', 'Desk', 'Sofa', 'Lamp', 'Lantern', 'Chair'],
  },
  {
    dataType: 'foreign key',
    column: 'Customer',
    directions: ['0-9', '9-0'],
    ascending: ['Lamp', 'Chair', 'Desk', 'Sofa', 'Lantern', 'Mirror'],
    descending: BY_CUSTOMER_DESCENDING,
  },
];

test.describe('sorting by the data type of the column', () => {
  for (const {
    dataType,
    column,
    directions,
    ascending,
    descending,
  } of sortCases) {
    test(`sorts ${dataType} columns both ways`, async ({
      ordersPage: { sheet },
      sort,
    }) => {
      await sort.addFirstEntry(column);
      const entry = sort.entry(0);
      await expect(entry.direction).toHaveText(directions[0]);
      await expect(shownItems(sheet)).toHaveText(ascending);

      const offered = await openSelect(entry.direction);
      await expect(offered.getByRole('option')).toHaveText(directions);
      await offered.getByRole('option', { name: directions[1] }).click();

      await expect(shownItems(sheet)).toHaveText(descending);
    });
  }
});

test.describe('sorting by several columns', () => {
  test('a second sort column orders the records that the first leaves tied', async ({
    ordersPage,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await sort.addFirstEntry('Status');
    await expect(shownItems(sheet)).toHaveText(BY_STATUS_ASCENDING);

    await sort.addEntry('Item');
    await expect(sort.entry(1).direction).toHaveText('A-Z');
    await expectLoadingEnded(ordersPage);
    await chooseOption(sort.entry(1).direction, 'Z-A');

    await expect(shownItems(sheet)).toHaveText([
      'Chair',
      'Lantern',
      'Lamp',
      'Sofa',
      'Desk',
      'Mirror',
    ]);
    await expect(sort.trigger).toHaveText('Sort 2');
  });

  test('dragging a sort column above another one gives it priority', async ({
    ordersPage,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await sort.addFirstEntry('Status');
    await expect(shownItems(sheet)).toHaveText(BY_STATUS_ASCENDING);
    await sort.addEntry('Item');
    await expectLoadingEnded(ordersPage);
    await chooseOption(sort.entry(1).direction, 'Z-A');
    await expect(shownItems(sheet)).toHaveText([
      'Chair',
      'Lantern',
      'Lamp',
      'Sofa',
      'Desk',
      'Mirror',
    ]);

    await sort.dragEntry(1, 0);

    await expect(sort.entry(0).column).toHaveText('Item');
    await expect(sort.entry(1).column).toHaveText('Status');
    await expect(shownItems(sheet)).toHaveText(BY_ITEM_DESCENDING);
  });

  test('offers only the columns that are not sorted yet', async ({
    page,
    customers,
    sort,
  }) => {
    const customersPage = new TablePage(page);
    await customersPage.goto(customers);
    await sort.addFirstEntry('Name');
    await expectLoadingEnded(customersPage);

    await sort.addButton.click();
    await expect(openMenu(page).getByRole('menuitem')).toHaveText(['id']);
    await columnMenuItem(page, 'id').click();

    await expect(sort.entries).toHaveCount(2);
    await expect(sort.addButton).toHaveCount(0);
  });

  test('another column for a sort entry keeps its direction', async ({
    ordersPage,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await sort.addFirstEntry('Quantity');
    await expectLoadingEnded(ordersPage);
    await chooseOption(sort.entry(0).direction, '9-0');
    await expect(shownItems(sheet)).toHaveText(BY_QUANTITY_DESCENDING);

    await chooseColumn(sort.entry(0).column, 'Ordered');

    await expect(sort.entry(0).direction).toHaveText('Newest-Oldest');
    await expect(shownItems(sheet)).toHaveText(BY_ORDERED_DESCENDING);
  });

  test('removing a sort column keeps the others, and removing the last offers the columns again', async ({
    page,
    ordersPage,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await sort.addFirstEntry('Status');
    await expect(shownItems(sheet)).toHaveText(BY_STATUS_ASCENDING);
    await sort.addEntry('Quantity');
    await expectLoadingEnded(ordersPage);
    await chooseOption(sort.entry(1).direction, '9-0');
    await expect(shownItems(sheet)).toHaveText([
      'Chair',
      'Lantern',
      'Lamp',
      'Sofa',
      'Desk',
      'Mirror',
    ]);

    await sort.entry(0).removeButton.click();
    await expect(shownItems(sheet)).toHaveText(BY_QUANTITY_DESCENDING);
    await expect(sort.trigger).toHaveText('Sort 1');

    await sort.entry(0).removeButton.click();
    await expect(shownItems(sheet)).toHaveText(ORDER_ITEMS);
    await expect(sort.trigger).toHaveText('Sort');
    await expect(columnMenuItem(page, 'Item')).toBeVisible();
  });
});

test.describe('sorting from the menu of a column header', () => {
  test('sorts the column and offers to remove the sorting', async ({
    page,
    ordersPage: { sheet },
    sort,
  }) => {
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Sort 9-0').click();
    await expect(shownItems(sheet)).toHaveText(BY_QUANTITY_DESCENDING);
    await expect(sort.trigger).toHaveText('Sort 1');

    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await expect(menuItem(page, 'Sort 0-9')).toBeVisible();
    await menuItem(page, 'Remove 9-0 Sorting').click();

    await expect(shownItems(sheet)).toHaveText(ORDER_ITEMS);
    await expect(sort.trigger).toHaveText('Sort');
  });

  test('names the directions of a foreign key column by ID, unlike the Sort dropdown', async ({
    page,
    ordersPage: { sheet },
    sort,
  }) => {
    await sheet.columnHeader('Customer').click({ button: 'right' });
    await expect(menuItem(page, 'Sort Ascending ID')).toBeVisible();
    await menuItem(page, 'Sort Descending ID').click();
    await expect(shownItems(sheet)).toHaveText(BY_CUSTOMER_DESCENDING);

    await sort.trigger.click();
    await expect(sort.entry(0).direction).toHaveText('9-0');
  });

  test('marks a sorted column in its header with the direction', async ({
    ordersPage,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await sort.addFirstEntry('Item');
    await expect(
      columnIndicator(sheet, 'Item', 'sorted ascending'),
    ).toBeVisible();
    await expectLoadingEnded(ordersPage);

    await chooseOption(sort.entry(0).direction, 'Z-A');
    await expect(
      columnIndicator(sheet, 'Item', 'sorted descending'),
    ).toBeVisible();
    await expect(
      columnIndicator(sheet, 'Item', 'sorted ascending'),
    ).toHaveCount(0);
    await expectLoadingEnded(ordersPage);

    await sort.entry(0).removeButton.click();
    await expect(
      columnIndicator(sheet, 'Item', 'sorted descending'),
    ).toHaveCount(0);
  });
});
