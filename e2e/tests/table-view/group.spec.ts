import { runSqlInSchema } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { pinsKnownBug } from '../../support/known-bugs';
import { columnMenuItem } from '../../support/ui/components/column-options';
import { columnIndicator } from '../../support/ui/components/column-indicators';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { expectLoadingEnded } from '../../support/ui/components/status-bar';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { recordUrl } from '../../support/ui/urls';
import {
  ORDER_COLUMNS,
  ORDER_ITEMS,
  expect,
  shownItems,
  test,
} from './fixtures';

interface ValueGroupingCase {
  dataType: string;
  column: string;
  headers: string[];
}

interface GroupingWay {
  name: string;
  headers: string[];
}

interface GroupingCase {
  dataType: string;
  column: string;
  /** The headers of the default way, "Value". */
  valueHeaders: string[];
  /** The other ways, in the order of the select after "Value". */
  ways: GroupingWay[];
}

const PAID_HEADERS = ['Paid false 2', 'Paid true 2', 'Paid NULL 2'];

const groupingCases: GroupingCase[] = [
  {
    dataType: 'date',
    column: 'Ordered',
    valueHeaders: [
      'Ordered 2023-12-01 AD 1',
      'Ordered 2023-12-24 AD 1',
      'Ordered 2024-03-02 AD 1',
      'Ordered 2024-03-15 AD 1',
      'Ordered 2024-07-20 AD 1',
      'Ordered NULL 1',
    ],
    ways: [
      {
        name: 'Year',
        headers: [
          'Ordered Year 2023 AD 2',
          'Ordered Year 2024 AD 3',
          'Ordered Year NULL 1',
        ],
      },
      {
        name: 'Year, Month',
        headers: [
          'Ordered Year, Month 2023-12 AD 2',
          'Ordered Year, Month 2024-03 AD 2',
          'Ordered Year, Month 2024-07 AD 1',
          'Ordered Year, Month NULL 1',
        ],
      },
    ],
  },
  {
    dataType: 'date and time',
    column: 'Shipped',
    valueHeaders: [
      'Shipped 2023-12-05T08:15:00.0 AD 1',
      'Shipped 2024-03-04T16:45:00.0 AD 1',
      'Shipped 2024-03-16T10:00:00.0 AD 1',
      'Shipped 2024-07-22T12:00:00.0 AD 1',
      'Shipped NULL 2',
    ],
    ways: [
      {
        name: 'Year, Month, Day',
        headers: [
          'Shipped Year, Month, Day 2023-12-05 AD 1',
          'Shipped Year, Month, Day 2024-03-04 AD 1',
          'Shipped Year, Month, Day 2024-03-16 AD 1',
          'Shipped Year, Month, Day 2024-07-22 AD 1',
          'Shipped Year, Month, Day NULL 2',
        ],
      },
      {
        name: 'Year',
        headers: [
          'Shipped Year 2023 AD 1',
          'Shipped Year 2024 AD 3',
          'Shipped Year NULL 2',
        ],
      },
      {
        name: 'Year, Month',
        headers: [
          'Shipped Year, Month 2023-12 AD 1',
          'Shipped Year, Month 2024-03 AD 2',
          'Shipped Year, Month 2024-07 AD 1',
          'Shipped Year, Month NULL 2',
        ],
      },
    ],
  },
  {
    dataType: 'email',
    column: 'Email',
    valueHeaders: [
      'Email ada@example.com 1',
      'Email ada@work.example.org 1',
      'Email alan@example.com 1',
      'Email grace@example.org 1',
      'Email NULL 2',
    ],
    ways: [
      {
        name: 'Domain',
        headers: [
          'Email Domain example.com 2',
          'Email Domain example.org 1',
          'Email Domain work.example.org 1',
          'Email Domain NULL 2',
        ],
      },
    ],
  },
  {
    dataType: 'URI',
    column: 'Site',
    valueHeaders: [
      'Site ftp://files.test/lantern 1',
      'Site http://myshop.test/desk 1',
      'Site https://example.com/shop/lamp 1',
      'Site https://shop.test/chair 1',
      'Site NULL 2',
    ],
    ways: [
      {
        name: 'URI scheme',
        headers: [
          'Site URI scheme ftp 1',
          'Site URI scheme http 1',
          'Site URI scheme https 2',
          'Site URI scheme NULL 2',
        ],
      },
      {
        name: 'URI Authority',
        headers: [
          'Site URI Authority example.com 1',
          'Site URI Authority files.test 1',
          'Site URI Authority myshop.test 1',
          'Site URI Authority shop.test 1',
          'Site URI Authority NULL 2',
        ],
      },
    ],
  },
];

/** Columns that are grouped by their value only. Times show as stored. */
const valueOnlyCases: ValueGroupingCase[] = [
  {
    dataType: 'number',
    column: 'Quantity',
    headers: [
      'Quantity 1 1',
      'Quantity 3 2',
      'Quantity 4 1',
      'Quantity 10 1',
      'Quantity NULL 1',
    ],
  },
  {
    dataType: 'boolean',
    column: 'Paid',
    headers: PAID_HEADERS,
  },
  {
    dataType: 'time',
    column: 'At',
    headers: [
      'At 09:30:00.0 2',
      'At 14:00:00.0 1',
      'At 18:20:00.0 1',
      'At 23:59:00.0 1',
      'At NULL 1',
    ],
  },
  {
    dataType: 'foreign key',
    column: 'Customer',
    headers: [
      'Customer Ada 2',
      'Customer Grace 2',
      'Customer Alan 1',
      'Customer NULL 1',
    ],
  },
];

test.describe('grouping records', () => {
  test('puts the records under a header per value, with the count, and numbers rows across groups', async ({
    ordersPage: { sheet },
    group,
  }) => {
    await group.addFirstEntry('Status');

    await expect(sheet.groupHeaders).toHaveText([
      'Status draft 1',
      'Status open 2',
      'Status closed 2',
      'Status NULL 1',
    ]);
    await expect(shownItems(sheet)).toHaveText([
      'Chair',
      'Lamp',
      'Lantern',
      'Desk',
      'Sofa',
      'Mirror',
    ]);
    await expect(sheet.rowHeader(sheet.recordRows)).toHaveText([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    await expect(group.trigger).toHaveText('Group 1');
    await expect(group.entry(0).preprocessing).toHaveCount(0);
    await expect(columnIndicator(sheet, 'Status', 'grouped')).toBeVisible();
  });

  for (const { dataType, column, headers } of valueOnlyCases) {
    test(`groups ${dataType} columns by their value`, async ({
      ordersPage: { sheet },
      group,
    }) => {
      await group.addFirstEntry(column);

      await expect(sheet.groupHeaders).toHaveText(headers);
      await expect(group.entry(0).preprocessing).toHaveCount(0);
    });
  }

  for (const { dataType, column, valueHeaders, ways } of groupingCases) {
    test(`groups ${dataType} columns by their value or a part of it`, async ({
      ordersPage: { sheet },
      group,
    }) => {
      await group.addFirstEntry(column);
      const { preprocessing } = group.entry(0);
      await expect(preprocessing).toHaveText('Value');
      await expect(sheet.groupHeaders).toHaveText(valueHeaders);
      const offered = await openSelect(preprocessing);
      await expect(offered.getByRole('option')).toHaveText([
        'Value',
        ...ways.map(({ name }) => name),
      ]);
      await offered.getByRole('option', { name: 'Value', exact: true }).click();

      for (const { name, headers } of ways) {
        await test.step(name, async () => {
          await chooseOption(preprocessing, name);
          await expect(sheet.groupHeaders).toHaveText(headers);
        });
      }
    });
  }

  test('the header of a foreign key group links to the record and opens it in a modal', async ({
    page,
    ordersPage,
    customers,
    orders,
    group,
  }) => {
    await group.addFirstEntry('Customer');
    const link = ordersPage.sheet.groupHeaders.getByRole('link', {
      name: 'Grace',
    });
    await expect(link).toHaveAttribute('href', recordUrl(customers, 2));

    await link.click();

    await ordersPage.recordModal.expectOpen();
    await expect(ordersPage.recordModal.title).toContainText('Grace');
    await expect(ordersPage.recordModalField('Name')).toHaveValue('Grace');
    await expect(page).toHaveURL(new RegExp(`/tables/${orders.oid}/\\?q=`));
  });

  test('the header of a file group shows the URI of the file', async ({
    documents,
    documentsPage: { sheet },
    group,
  }) => {
    const [alpha, beta] = await runSqlInSchema<{ uri: string }>(
      documents.schema,
      `SELECT "File"->>'uri' AS uri FROM "Documents"
       WHERE "Item" IN ('Alpha', 'Beta') ORDER BY "Item"`,
    );

    await group.addFirstEntry('File');

    await expect(sheet.groupHeaders).toHaveText([
      `File ${alpha?.uri} 2`,
      `File ${beta?.uri} 1`,
      'File NULL 1',
    ]);
  });

  test('the header of a user group names the user', async ({
    collaborator,
    documentsPage: { sheet },
    group,
  }) => {
    await group.addFirstEntry('Owner');

    await expect(sheet.groupHeaders).toHaveText([
      `Owner ${env.admin.username} 1`,
      `Owner ${collaborator.user.username} 2`,
      'Owner NULL 1',
    ]);
  });

  test('a second grouping splits the groups of the first, which can no longer change its column', async ({
    page,
    ordersPage: { sheet },
    group,
  }) => {
    await group.addFirstEntry('Status');
    await expect(sheet.groupHeaders).toHaveCount(4);
    await group.addButton.click();
    await expect(openMenu(page).getByRole('menuitem')).toHaveText(
      ORDER_COLUMNS.filter((column) => column !== 'Status'),
    );
    await columnMenuItem(page, 'Paid').click();

    await expect(sheet.groupHeaders).toHaveText([
      'Status draft Paid true 1',
      'Status open Paid false 1',
      'Status open Paid true 1',
      'Status closed Paid false 1',
      'Status closed Paid NULL 1',
      'Status NULL Paid NULL 1',
    ]);
    await expect(group.entry(0).column).toBeDisabled();
    await expect(group.entry(1).column).toBeEnabled();
    await expect(group.trigger).toHaveText('Group 2');
  });

  test('records inside a group follow the sort', async ({
    ordersPage,
    group,
    sort,
  }) => {
    const { sheet } = ordersPage;
    await group.addFirstEntry('Status');
    await expect(sheet.groupHeaders).toHaveCount(4);
    await sort.addFirstEntry('Item');
    await expectLoadingEnded(ordersPage);
    await chooseOption(sort.entry(0).direction, 'Z-A');

    await expect(shownItems(sheet)).toHaveText([
      'Chair',
      'Lantern',
      'Lamp',
      'Sofa',
      'Desk',
      'Mirror',
    ]);
    await expect(sheet.groupHeaders).toHaveText([
      'Status draft 1',
      'Status open 2',
      'Status closed 2',
      'Status NULL 1',
    ]);
  });

  test('removing the groupings removes the headers and offers the columns again', async ({
    page,
    ordersPage: { sheet },
    group,
  }) => {
    await group.addFirstEntry('Status');
    await expect(sheet.groupHeaders).toHaveCount(4);
    await group.addEntry('Paid');
    await expect(sheet.groupHeaders).toHaveCount(6);

    await group.entry(1).removeButton.click();
    await expect(sheet.groupHeaders).toHaveCount(4);
    await expect(group.entry(0).column).toBeEnabled();
    await group.entry(0).removeButton.click();

    await expect(sheet.groupHeaders).toHaveCount(0);
    await expect(shownItems(sheet)).toHaveText(ORDER_ITEMS);
    await expect(group.trigger).toHaveText('Group');
    await expect(columnMenuItem(page, 'Item')).toBeVisible();
  });

  test('Escape keeps the groupings open', async ({
    page,
    ordersPage: { sheet },
    group,
  }) => {
    await group.addFirstEntry('Status');
    await expect(sheet.groupHeaders).toHaveCount(4);

    await page.keyboard.press('Escape');

    await expectStaysOpen(group.panel);
  });
});

test.describe('grouping from the menu of a column header', () => {
  test('groups by the column without opening the dropdown, and removes the grouping', async ({
    page,
    ordersPage: { sheet },
    group,
  }) => {
    await sheet.columnHeader('Paid').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();

    await expect(sheet.groupHeaders).toHaveText(PAID_HEADERS);
    await expect(group.panel).toBeHidden();
    await expect(group.trigger).toHaveText('Group 1');

    await sheet.columnHeader('Paid').click({ button: 'right' });
    await menuItem(page, 'Remove Grouping').click();

    await expect(sheet.groupHeaders).toHaveCount(0);
    await expect(group.trigger).toHaveText('Group');
  });
});

test.describe('a sort on the grouping column', () => {
  test(
    'fills the pages in its order but lists the groups of a page in ascending order',
    pinsKnownBug('group-sort-direction-ignored'),
    async ({ page, longTablePage: { sheet }, pagination }) => {
      await sheet.columnHeader('Number').click({ button: 'right' });
      await menuItem(page, 'Group by Column').click();
      await expect(sheet.groupHeaders.nth(0)).toHaveText('Number 1 1');
      await sheet.columnHeader('Number').click({ button: 'right' });
      await menuItem(page, 'Sort 9-0').click();

      await expect(sheet.groupHeaders.nth(0)).toHaveText('Number 701 1');
      await expect(sheet.groupHeaders.nth(1)).toHaveText('Number 702 1');
      await expect(sheet.cell(0, 'Label')).toHaveText('row 701');
      await expect(pagination.currentPage).toHaveText('Page 1 of 3');
    },
  );

  test.fixme('lists the groups in its order', async ({
    page,
    longTablePage: { sheet },
  }) => {
    await sheet.columnHeader('Number').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();
    await expect(sheet.groupHeaders.nth(0)).toHaveText('Number 1 1');
    await sheet.columnHeader('Number').click({ button: 'right' });
    await menuItem(page, 'Sort 9-0').click();

    await expect(sheet.groupHeaders.nth(0)).toHaveText('Number 1200 1');
    await expect(sheet.groupHeaders.nth(1)).toHaveText('Number 1199 1');
    await expect(sheet.cell(0, 'Label')).toHaveText('row 1200');
  });
});
