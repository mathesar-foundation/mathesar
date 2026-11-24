import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { menuItem } from '../../support/ui/components/menu';
import { chooseOption } from '../../support/ui/components/select';
import { viewStateInUrl } from '../../support/ui/table-view-url';
import { expect, shownItems, test } from './fixtures';

async function quantityOf(schema: Schema, item: string): Promise<number> {
  const [row] = await runSqlInSchema<{ Quantity: number }>(
    schema,
    `SELECT "Quantity" FROM "Orders" WHERE "Item" = '${item}'`,
  );
  return row?.Quantity ?? Number.NaN;
}

test.describe('a filtered, sorted or grouped view', () => {
  test('Refresh shows records changed elsewhere and keeps the view', async ({
    page,
    schema,
    ordersPage,
    filter,
    sort,
  }) => {
    const { sheet } = ordersPage;
    const paid = await filter.addFirstCondition('Paid');
    await chooseOption(paid.value, 'true');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Sort 9-0').click();
    await expect(shownItems(sheet)).toHaveText(['Chair', 'Lamp']);
    const view = viewStateInUrl(page);
    await runSqlInSchema(
      schema,
      `INSERT INTO "Orders" ("Item", "Quantity", "Paid")
       VALUES ('Stool', 5, true), ('Bench', 9, false)`,
    );

    await ordersPage.refreshButton.click();

    await expect(shownItems(sheet)).toHaveText(['Stool', 'Chair', 'Lamp']);
    await expect(filter.trigger).toHaveText('Filter 1');
    await expect(sort.trigger).toHaveText('Sort 1');
    expect(viewStateInUrl(page)).toEqual(view);
  });

  test('an edited record stays in a filtered view it no longer matches until a refresh', async ({
    schema,
    ordersPage,
    filter,
  }) => {
    const { sheet } = ordersPage;
    const condition = await filter.addFirstCondition('Quantity');
    await condition.apply('is greater or equal to', '3');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Chair',
      'Lantern',
      'Sofa',
    ]);
    await ordersPage.heading.click();

    const lampQuantity = sheet.cell(sheet.rowContaining('Lamp'), 'Quantity');
    await sheet.editFormattedCell(lampQuantity, '1');

    await expect(lampQuantity).toHaveText('1');
    await expect.poll(() => quantityOf(schema, 'Lamp')).toBe(1);
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Chair',
      'Lantern',
      'Sofa',
    ]);

    await ordersPage.refreshButton.click();
    await expect(shownItems(sheet)).toHaveText(['Chair', 'Lantern', 'Sofa']);
  });

  test('an edited record stays in its group until a refresh moves it', async ({
    page,
    schema,
    ordersPage,
  }) => {
    const { sheet } = ordersPage;
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();
    const headersBefore = [
      'Quantity 1 1',
      'Quantity 3 2',
      'Quantity 4 1',
      'Quantity 10 1',
      'Quantity NULL 1',
    ];
    await expect(sheet.groupHeaders).toHaveText(headersBefore);

    const deskQuantity = sheet.cell(sheet.rowContaining('Desk'), 'Quantity');
    await sheet.editFormattedCell(deskQuantity, '4');

    await expect(deskQuantity).toHaveText('4');
    await expect.poll(() => quantityOf(schema, 'Desk')).toBe(4);
    await expect(sheet.groupHeaders).toHaveText(headersBefore);
    await expect(shownItems(sheet).first()).toHaveText('Desk');

    await ordersPage.refreshButton.click();
    await expect(sheet.groupHeaders).toHaveText([
      'Quantity 3 2',
      'Quantity 4 2',
      'Quantity 10 1',
      'Quantity NULL 1',
    ]);
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Sofa',
      'Desk',
      'Chair',
      'Lantern',
      'Mirror',
    ]);
  });
});
