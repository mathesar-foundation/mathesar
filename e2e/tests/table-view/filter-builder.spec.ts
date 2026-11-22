import { pinsKnownBug } from '../../support/known-bugs';
import {
  chooseColumn,
  columnMenuItem,
} from '../../support/ui/components/column-options';
import { columnIndicator } from '../../support/ui/components/column-indicators';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { chooseOption } from '../../support/ui/components/select';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import {
  ORDER_COLUMNS,
  expect,
  shownItems,
  showingAll,
  test,
} from './fixtures';

test.describe('building a filter', () => {
  test('opens on a menu of the columns and adds a condition for the chosen one', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    await filter.trigger.click();
    await expect(openMenu(page).getByRole('menuitem')).toHaveText(
      ORDER_COLUMNS,
    );
    await columnMenuItem(page, 'Note').click();

    const condition = filter.condition(0);
    await expect(condition.column).toHaveText('Note');
    await expect(condition.condition).toHaveText('contains');
    await expect(condition.value).toBeFocused();
    await expect(filter.trigger).toHaveText('Filter 1');
    await expect(shownItems(sheet)).toHaveCount(6);
  });

  test('joins the conditions by all, any or none of them', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const { rootGroup } = filter;
    const itemCondition = await filter.addFirstCondition('Item');
    await itemCondition.value.fill('la');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Lantern']);
    await rootGroup.addCondition('Quantity');
    await filter.condition(1).apply('is greater than', '3');

    await expect(rootGroup.operator).toHaveText('all of the following');
    await expect(rootGroup.connectors).toHaveText(['and']);
    await expect(shownItems(sheet)).toHaveText(['Lantern']);

    await chooseOption(rootGroup.operator, 'any of the following');
    await expect(rootGroup.connectors).toHaveText(['or']);
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair', 'Lantern']);

    await chooseOption(rootGroup.operator, 'none of the following');
    await expect(rootGroup.connectors).toBeHidden();
    // Mirror is left out too: its quantity is NULL, and NOT of NULL is not true.
    await expect(shownItems(sheet)).toHaveText(['Desk', 'Sofa']);
  });

  test('adds a group with the other operator, whose conditions match as a whole', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const quantity = await filter.addFirstCondition('Quantity');
    await quantity.apply('is greater or equal to', '3');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Chair',
      'Lantern',
      'Sofa',
    ]);

    await filter.rootGroup.addGroupButton.click();
    const group = filter.group(0);
    await expect(group.operator).toHaveText('any of the following');
    await expect(group.emptyText).toBeVisible();

    await group.addCondition('Item');
    await group.condition(0).value.fill('Lamp');
    await expect(shownItems(sheet)).toHaveText(['Lamp']);
    await group.addCondition('Item');
    await group.condition(1).value.fill('Sofa');

    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Sofa']);
    await expect(group.emptyText).toBeHidden();
    await expect(filter.trigger).toHaveText('Filter 3');
  });

  test('nests groups two levels deep at most, and empty groups filter nothing', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    await filter.addFirstCondition('Item');
    await filter.rootGroup.addGroupButton.click();
    await filter.group(0).addGroupButton.click();

    await expect(filter.group(1).operator).toHaveText('all of the following');
    await expect(filter.group(1).addFilterButton).toBeVisible();
    await expect(filter.group(1).addGroupButton).toHaveCount(0);
    await expect(shownItems(sheet)).toHaveCount(6);
  });

  test('Add Filter adds a condition without a value and keeps the focus on the button', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    await filter.addFirstCondition('Item');
    await filter.rootGroup.addCondition('Quantity');

    await expect(filter.condition(1).column).toHaveText('Quantity');
    await expect(filter.condition(1).condition).toHaveText('equals');
    await expect(filter.condition(1).value).toHaveValue('');
    await expect(filter.rootGroup.addFilterButton).toBeFocused();
    await expect(shownItems(sheet)).toHaveCount(6);
  });

  test('removing a condition shows the records it left out', async ({
    ordersPage,
    filter,
  }) => {
    const { sheet } = ordersPage;
    const item = await filter.addFirstCondition('Item');
    await item.value.fill('la');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Lantern']);
    await filter.rootGroup.addCondition('Paid');
    await chooseOption(filter.condition(1).value, 'true');
    await expect(shownItems(sheet)).toHaveText(['Lamp']);

    await item.removeButton.click();

    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);
    await expect(filter.condition(0).column).toHaveText('Paid');
    await expect(filter.trigger).toHaveText('Filter 1');
    await expect(ordersPage.recordCount).toHaveText(showingAll(2));
  });

  test('removing a group removes its conditions', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    await filter.addFirstCondition('Paid');
    await chooseOption(filter.condition(0).value, 'true');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);
    await filter.rootGroup.addGroupButton.click();
    await filter.group(0).addCondition('Item');
    await filter.group(0).condition(0).value.fill('Chair');
    await expect(shownItems(sheet)).toHaveText(['Chair']);

    await filter.group(0).removeButton.click();

    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);
    await expect(filter.conditions).toHaveCount(1);
    await expect(filter.trigger).toHaveText('Filter 1');
  });

  test('clearing the filter removes every condition and offers the columns again', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    await filter.addFirstCondition('Paid');
    await chooseOption(filter.condition(0).value, 'false');
    await expect(shownItems(sheet)).toHaveText(['Desk', 'Lantern']);
    await filter.rootGroup.addGroupButton.click();
    await filter.group(0).addCondition('Item');
    await filter.group(0).condition(0).value.fill('Desk');
    await expect(shownItems(sheet)).toHaveText(['Desk']);

    await filter.clearAllButton.click();

    await expect(shownItems(sheet)).toHaveCount(6);
    await expect(filter.trigger).toHaveText('Filter');
    await expect(filter.panel).toBeHidden();
    await expect(columnMenuItem(page, 'Item')).toBeVisible();
  });

  test('a condition without a value, or with only spaces, leaves the records as they are', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Note');
    await condition.value.fill('heavy');
    await expect(shownItems(sheet)).toHaveText(['Sofa']);

    await condition.value.fill('  ');
    await expect(shownItems(sheet)).toHaveCount(6);
    await condition.value.fill('flat');
    await expect(shownItems(sheet)).toHaveText(['Desk']);
    await condition.value.fill('');

    await expect(shownItems(sheet)).toHaveCount(6);
    await expect(filter.trigger).toHaveText('Filter 1');
  });

  test('another column for a condition clears its value and keeps the condition if the column offers it', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Note');
    await condition.apply('starts with', 'F');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Desk', 'Lantern']);

    await chooseColumn(condition.column, 'Item');
    await expect(condition.condition).toHaveText('starts with');
    await expect(condition.value).toHaveValue('');
    await expect(shownItems(sheet)).toHaveCount(6);
    await condition.value.fill('L');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Lantern']);

    await chooseColumn(condition.column, 'Quantity');
    await expect(condition.condition).toHaveText('equals');
    await expect(condition.value).toHaveValue('');
    await expect(shownItems(sheet)).toHaveCount(6);
  });

  test('a condition dragged into a group joins it', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    const quantity = await filter.addFirstCondition('Quantity');
    await quantity.apply('is greater or equal to', '3');
    await expect(shownItems(sheet)).toHaveCount(4);
    await filter.rootGroup.addCondition('Item');
    await filter.condition(1).value.fill('lamp');
    await expect(shownItems(sheet)).toHaveText(['Lamp']);
    await filter.rootGroup.addGroupButton.click();
    const group = filter.group(0);
    await group.addCondition('Item');
    await group.condition(0).value.fill('chair');
    await expect(shownItems(sheet)).toHaveCount(0);

    await filter.dragOver(filter.condition(1), group);
    await expect(filter.dragGhost).toHaveCount(1);
    await expect(filter.dropPlaceholder).toHaveCount(1);
    await page.mouse.up();

    await expect(filter.dragGhost).toHaveCount(0);
    await expect(filter.rootGroup.conditions).toHaveCount(1);
    await expect(group.conditions).toHaveCount(2);
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);
  });

  test('Escape keeps the builder open and a click outside closes it', async ({
    page,
    ordersPage,
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Item');
    await condition.value.fill('desk');
    await expect(shownItems(ordersPage.sheet)).toHaveText(['Desk']);

    await page.keyboard.press('Escape');
    await expectStaysOpen(filter.panel);
    await ordersPage.heading.click();
    await expect(filter.panel).toBeHidden();

    await filter.trigger.click();
    await expect(filter.condition(0).value).toHaveValue('desk');
  });

  test('Escape closes the menu of columns without adding a condition', async ({
    page,
    ordersPage,
    filter,
  }) => {
    await filter.trigger.click();
    await expect(columnMenuItem(page, 'Item')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(openMenu(page)).toBeHidden();
    await expect(filter.trigger).toHaveText('Filter');
    await expect(filter.trigger).toBeFocused();
    await expect(ordersPage.recordCount).toHaveText(showingAll(6));
  });

  test('marks a column in its header once a condition on it has a value', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Note');
    await expect(columnIndicator(sheet, 'Note', 'filtered')).toHaveCount(0);

    await condition.value.fill('glass');

    await expect(shownItems(sheet)).toHaveText(['Lantern']);
    await expect(columnIndicator(sheet, 'Note', 'filtered')).toBeVisible();
    await expect(columnIndicator(sheet, 'Item', 'filtered')).toHaveCount(0);
  });
});

test.describe('filtering from the menu of a column header', () => {
  test(
    'Filter Column adds a condition for the column and leaves the focus on the sheet',
    pinsKnownBug('filter-column-menu-focus'),
    async ({ page, ordersPage: { sheet }, filter }) => {
      await sheet.columnHeader('Quantity').click({ button: 'right' });
      await menuItem(page, 'Filter Column').click();

      await expect(filter.condition(0).column).toHaveText('Quantity');
      await expect(filter.condition(0).condition).toHaveText('equals');
      await sheet.expectFocusOnActiveCell();
    },
  );

  test.fixme('Filter Column puts the focus in the value of the new condition', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Filter Column').click();

    await expect(filter.condition(0).value).toBeFocused();
  });

  test('a filtered column offers to add another condition and to remove its conditions', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Quantity');
    await condition.apply('is greater than', '1');
    await expect(shownItems(sheet)).toHaveCount(4);
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await expect(menuItem(page, 'Remove Filter')).toBeVisible();
    await menuItem(page, 'Add Filter').click();
    await filter.condition(1).apply('is lesser than', '4');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Sofa']);

    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Remove 2 Filters').click();

    await expect(shownItems(sheet)).toHaveCount(6);
    await expect(filter.trigger).toHaveText('Filter');
  });
});
