import { runSqlInSchema } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { pinsKnownBug } from '../../support/known-bugs';
import type { FilterDropdown } from '../../support/ui/components/filter-dropdown';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { RowSeeker } from '../../support/ui/components/row-seeker';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { retryButton } from '../../support/ui/components/status-bar';
import type { TablePage } from '../../support/ui/pages/table-page';
import { expect, shownItems, showingAll, test } from './fixtures';

interface ConditionCase {
  condition: string;
  /** Left out for a condition that takes no value. */
  value?: string;
  /** The records that match, by "Item", in table order. */
  items: string[];
}

interface TypedColumn {
  dataType: string;
  column: string;
  /**
   * In the order of the condition select. Two cases in a row never match the
   * same records, so no check can pass on the result of the case before.
   */
  cases: ConditionCase[];
}

/** Columns of `orders`. */
const orderColumnsWithTypedValue: TypedColumn[] = [
  {
    dataType: 'text',
    column: 'Note',
    cases: [
      { condition: 'contains', value: 'FRA', items: ['Lamp', 'Lantern'] },
      {
        condition: 'starts with',
        value: 'F',
        items: ['Lamp', 'Desk', 'Lantern'],
      },
      { condition: 'equals', value: 'Fragile', items: ['Lamp'] },
      { condition: 'is empty', items: ['Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern', 'Sofa'],
      },
    ],
  },
  {
    dataType: 'number',
    column: 'Quantity',
    cases: [
      { condition: 'equals', value: '3', items: ['Lamp', 'Sofa'] },
      { condition: 'is empty', items: ['Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern', 'Sofa'],
      },
      { condition: 'is lesser than', value: '3', items: ['Desk'] },
      { condition: 'is greater than', value: '3', items: ['Chair', 'Lantern'] },
      {
        condition: 'is lesser or equal to',
        value: '3',
        items: ['Lamp', 'Desk', 'Sofa'],
      },
      {
        condition: 'is greater or equal to',
        value: '3',
        items: ['Lamp', 'Chair', 'Lantern', 'Sofa'],
      },
    ],
  },
  {
    dataType: 'date',
    column: 'Ordered',
    cases: [
      { condition: 'is same as', value: '03/02/2024', items: ['Chair'] },
      { condition: 'is empty', items: ['Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern', 'Sofa'],
      },
      { condition: 'is before', value: '03/02/2024', items: ['Desk', 'Sofa'] },
      {
        condition: 'is after',
        value: '03/02/2024',
        items: ['Lamp', 'Lantern'],
      },
      {
        condition: 'is before or same as',
        value: '03/02/2024',
        items: ['Desk', 'Chair', 'Sofa'],
      },
      {
        condition: 'is after or same as',
        value: '03/02/2024',
        items: ['Lamp', 'Chair', 'Lantern'],
      },
    ],
  },
  {
    dataType: 'time',
    column: 'At',
    cases: [
      { condition: 'is same as', value: '14:00', items: ['Desk'] },
      { condition: 'is empty', items: ['Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern', 'Sofa'],
      },
      { condition: 'is before', value: '14:00', items: ['Lamp', 'Chair'] },
      { condition: 'is after', value: '14:00', items: ['Lantern', 'Sofa'] },
      {
        condition: 'is before or same as',
        value: '14:00',
        items: ['Lamp', 'Desk', 'Chair'],
      },
      {
        condition: 'is after or same as',
        value: '14:00',
        items: ['Desk', 'Lantern', 'Sofa'],
      },
    ],
  },
  {
    dataType: 'date and time',
    column: 'Shipped',
    cases: [
      { condition: 'is same as', value: '03/04/2024 16:45', items: ['Chair'] },
      { condition: 'is empty', items: ['Sofa', 'Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern'],
      },
      { condition: 'is before', value: '03/04/2024 16:45', items: ['Desk'] },
      {
        condition: 'is after',
        value: '03/04/2024 16:45',
        items: ['Lamp', 'Lantern'],
      },
      {
        condition: 'is before or same as',
        value: '03/04/2024 16:45',
        items: ['Desk', 'Chair'],
      },
      {
        condition: 'is after or same as',
        value: '03/04/2024 16:45',
        items: ['Lamp', 'Chair', 'Lantern'],
      },
    ],
  },
  {
    dataType: 'email',
    column: 'Email',
    cases: [
      { condition: 'contains', value: 'ADA', items: ['Lamp', 'Lantern'] },
      {
        condition: 'starts with',
        value: 'a',
        items: ['Lamp', 'Chair', 'Lantern'],
      },
      { condition: 'equals', value: 'alan@example.com', items: ['Chair'] },
      { condition: 'is empty', items: ['Sofa', 'Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern'],
      },
      {
        condition: 'email domain is',
        value: 'example.com',
        items: ['Lamp', 'Chair'],
      },
      {
        condition: 'email domain contains',
        value: 'org',
        items: ['Desk', 'Lantern'],
      },
    ],
  },
  {
    dataType: 'URI',
    column: 'Site',
    cases: [
      {
        condition: 'contains',
        value: 'TEST',
        items: ['Desk', 'Chair', 'Lantern'],
      },
      {
        condition: 'starts with',
        value: 'http',
        items: ['Lamp', 'Desk', 'Chair'],
      },
      {
        condition: 'equals',
        value: 'http://myshop.test/desk',
        items: ['Desk'],
      },
      { condition: 'is empty', items: ['Sofa', 'Mirror'] },
      {
        condition: 'is not empty',
        items: ['Lamp', 'Desk', 'Chair', 'Lantern'],
      },
      { condition: 'URI scheme is', value: 'https', items: ['Lamp', 'Chair'] },
      {
        condition: 'URI authority contains',
        value: 'shop',
        items: ['Desk', 'Chair'],
      },
    ],
  },
];

/** Columns of `measures`. */
const measureColumnsWithTypedValue: TypedColumn[] = [
  {
    dataType: 'money',
    column: 'Price',
    cases: [
      { condition: 'equals', value: '12', items: ['Beta'] },
      { condition: 'is empty', items: ['Delta'] },
      { condition: 'is not empty', items: ['Alpha', 'Beta', 'Gamma'] },
      { condition: 'is lesser than', value: '12', items: ['Alpha'] },
      { condition: 'is greater than', value: '12', items: ['Gamma'] },
      {
        condition: 'is lesser or equal to',
        value: '12',
        items: ['Alpha', 'Beta'],
      },
      {
        condition: 'is greater or equal to',
        value: '12',
        items: ['Beta', 'Gamma'],
      },
    ],
  },
  {
    dataType: 'duration',
    column: 'Span',
    cases: [
      { condition: 'equals', value: '30:00', items: ['Gamma'] },
      { condition: 'is empty', items: ['Delta'] },
      { condition: 'is not empty', items: ['Alpha', 'Beta', 'Gamma'] },
      { condition: 'is lesser than', value: '60:00', items: ['Gamma'] },
      { condition: 'is greater than', value: '60:00', items: ['Beta'] },
      {
        condition: 'is lesser or equal to',
        value: '60:00',
        items: ['Alpha', 'Gamma'],
      },
      {
        condition: 'is greater or equal to',
        value: '60:00',
        items: ['Alpha', 'Beta'],
      },
    ],
  },
  {
    dataType: 'UUID',
    column: 'Code',
    cases: [
      {
        condition: 'equals',
        value: '22222222-2222-2222-2222-222222222222',
        items: ['Beta'],
      },
      { condition: 'is empty', items: ['Gamma', 'Delta'] },
      { condition: 'is not empty', items: ['Alpha', 'Beta'] },
    ],
  },
  {
    dataType: 'JSON object',
    column: 'Meta',
    cases: [
      { condition: 'equals', value: '{"b": 2}', items: ['Beta'] },
      { condition: 'is empty', items: ['Gamma', 'Delta'] },
      { condition: 'is not empty', items: ['Alpha', 'Beta'] },
    ],
  },
  {
    dataType: 'array',
    column: 'Labels',
    cases: [
      { condition: 'equals', value: '{red}', items: ['Gamma'] },
      { condition: 'is empty', items: ['Delta'] },
      { condition: 'is not empty', items: ['Alpha', 'Beta', 'Gamma'] },
    ],
  },
];

/** Applies each case in turn and checks the records it leaves. */
async function expectEachConditionToNarrow(
  { page, sheet, recordCount }: TablePage,
  filter: FilterDropdown,
  { column, cases }: TypedColumn,
): Promise<void> {
  const condition = await filter.addFirstCondition(column);
  const offered = await openSelect(condition.condition);
  await expect(offered.getByRole('option')).toHaveText(
    cases.map((conditionCase) => conditionCase.condition),
  );
  await page.keyboard.press('Escape');

  for (const { condition: name, value, items } of cases) {
    await test.step(`${name} ${value ?? ''}`, async () => {
      await condition.apply(name, value);
      await expect(shownItems(sheet)).toHaveText(items);
      await expect(recordCount).toHaveText(showingAll(items.length));
    });
  }
}

test.describe('the conditions of a filter, by the data type of its column', () => {
  for (const typedColumn of orderColumnsWithTypedValue) {
    test(`offers the conditions of ${typedColumn.dataType} columns and each one narrows the records`, async ({
      ordersPage,
      filter,
    }) => {
      await expectEachConditionToNarrow(ordersPage, filter, typedColumn);
    });
  }

  for (const typedColumn of measureColumnsWithTypedValue) {
    test(`offers the conditions of ${typedColumn.dataType} columns and each one narrows the records`, async ({
      measuresPage,
      filter,
    }) => {
      await expectEachConditionToNarrow(measuresPage, filter, typedColumn);
    });
  }

  test('offers the conditions of file columns and each one narrows the records', async ({
    documents,
    documentsPage,
    filter,
  }) => {
    const [beta] = await runSqlInSchema<{ file: string }>(
      documents.schema,
      `SELECT "File"::text AS file FROM "Documents" WHERE "Item" = 'Beta'`,
    );
    await expectEachConditionToNarrow(documentsPage, filter, {
      dataType: 'file',
      column: 'File',
      cases: [
        { condition: 'equals', value: beta?.file, items: ['Beta'] },
        { condition: 'is empty', items: ['Delta'] },
        { condition: 'is not empty', items: ['Alpha', 'Beta', 'Gamma'] },
      ],
    });
  });

  test('a boolean column is filtered by true, by false and by emptiness', async ({
    ordersPage,
    filter,
  }) => {
    const { sheet } = ordersPage;
    const condition = await filter.addFirstCondition('Paid');
    await expect(condition.condition).toHaveText('equals');
    const values = await openSelect(condition.value);
    await expect(values.getByRole('option')).toHaveText(['', 'true', 'false']);
    await values.getByRole('option', { name: 'true' }).click();
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair']);

    await chooseOption(condition.value, 'false');
    await expect(shownItems(sheet)).toHaveText(['Desk', 'Lantern']);

    await chooseOption(condition.condition, 'is empty');
    await expect(shownItems(sheet)).toHaveText(['Sofa', 'Mirror']);
    await expect(condition.value).toHaveCount(0);

    await chooseOption(condition.condition, 'is not empty');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Desk',
      'Chair',
      'Lantern',
    ]);
    await expect(ordersPage.recordCount).toHaveText(showingAll(4));
  });

  test('an enum column is compared in the order of its values', async ({
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Status');
    const values = await openSelect(condition.value);
    await expect(values.getByRole('option')).toHaveText([
      '',
      'draft',
      'open',
      'closed',
    ]);
    await values.getByRole('option', { name: 'open' }).click();
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Lantern']);

    await chooseOption(condition.condition, 'is lesser than');
    await expect(shownItems(sheet)).toHaveText(['Chair']);

    await chooseOption(condition.condition, 'is greater than');
    await expect(shownItems(sheet)).toHaveText(['Desk', 'Sofa']);

    await chooseOption(condition.condition, 'is lesser or equal to');
    await expect(shownItems(sheet)).toHaveText(['Lamp', 'Chair', 'Lantern']);

    await chooseOption(condition.condition, 'is greater or equal to');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Desk',
      'Lantern',
      'Sofa',
    ]);

    await chooseOption(condition.condition, 'is empty');
    await expect(shownItems(sheet)).toHaveText(['Mirror']);

    await chooseOption(condition.condition, 'is not empty');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Desk',
      'Chair',
      'Lantern',
      'Sofa',
    ]);
  });
});

test.describe('a condition on a JSON list column', () => {
  test('offers conditions on the number of elements, and each one narrows the records', async ({
    page,
    measuresPage,
    filter,
  }) => {
    const { sheet } = measuresPage;
    const condition = await filter.addFirstCondition('Tags');
    const offered = await openSelect(condition.condition);
    await expect(offered.getByRole('option')).toHaveText([
      'equals',
      'is empty',
      'is not empty',
      'number of elements is',
      'number of elements >',
      'number of elements >=',
      'number of elements <',
      'number of elements <=',
      'array is not empty',
      'array contains',
    ]);
    await page.keyboard.press('Escape');

    await condition.apply('equals', '["red"]');
    await expect(shownItems(sheet)).toHaveText(['Gamma']);
    await condition.apply('number of elements >', '1');
    await expect(shownItems(sheet)).toHaveText(['Alpha']);
    await condition.apply('number of elements >=', '1');
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);
    await condition.apply('number of elements <', '1');
    await expect(shownItems(sheet)).toHaveText(['Beta']);
    await condition.apply('number of elements <=', '1');
    await expect(shownItems(sheet)).toHaveText(['Beta', 'Gamma']);
    await condition.apply('number of elements is', '1');
    await expect(shownItems(sheet)).toHaveText(['Gamma']);
    await condition.apply('array contains', '"red"');
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);
  });

  test(
    'array is not empty leaves every record',
    pinsKnownBug('json-array-not-empty-ignored'),
    async ({ measuresPage: { sheet }, filter }) => {
      const condition = await filter.addFirstCondition('Tags');
      await condition.apply('number of elements is', '1');
      await expect(shownItems(sheet)).toHaveText(['Gamma']);

      await chooseOption(condition.condition, 'array is not empty');

      await expect(shownItems(sheet)).toHaveText([
        'Alpha',
        'Beta',
        'Gamma',
        'Delta',
      ]);
    },
  );

  test.fixme('array is not empty matches the lists with an element', async ({
    measuresPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Tags');
    await chooseOption(condition.condition, 'array is not empty');

    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);
  });

  test('array contains takes a JSON value, and other text fails to load the records', async ({
    measuresPage,
    filter,
  }) => {
    const { sheet } = measuresPage;
    const condition = await filter.addFirstCondition('Tags');

    await condition.apply('array contains', 'red');
    await expect(retryButton(measuresPage)).toBeVisible();
    await expect(shownItems(sheet)).toHaveCount(4);

    await condition.value.fill('"red"');
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);
    await expect(measuresPage.refreshButton).toBeVisible();
  });
});

test.describe('a condition on a foreign key column', () => {
  test('takes its value from the record selector, which opens with the condition', async ({
    page,
    ordersPage,
    filter,
  }) => {
    const recordSelector = new RecordSelector(page);
    const condition = await filter.addFirstCondition('Customer');
    await expect(recordSelector.title).toHaveText(
      'Pick a Record from Customers',
    );
    await recordSelector.submitButton(recordSelector.row('Grace')).click();

    await expect(recordSelector.root).toHaveCount(0);
    await expect(condition.value).toHaveText('Grace');
    await expect(shownItems(ordersPage.sheet)).toHaveText(['Desk', 'Sofa']);
    await expect(ordersPage.recordCount).toHaveText(showingAll(2));
  });

  test('offers equality and emptiness only', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Customer');
    await page.keyboard.press('Escape');
    const offered = await openSelect(condition.condition);
    await expect(offered.getByRole('option')).toHaveText([
      'equals',
      'is empty',
      'is not empty',
    ]);
    await offered.getByRole('option', { name: 'is empty' }).click();
    await expect(shownItems(sheet)).toHaveText(['Mirror']);

    await chooseOption(condition.condition, 'is not empty');
    await expect(shownItems(sheet)).toHaveText([
      'Lamp',
      'Desk',
      'Chair',
      'Lantern',
      'Sofa',
    ]);
  });

  test('shows all records again when its value is cleared', async ({
    page,
    ordersPage: { sheet },
    filter,
  }) => {
    const condition = await filter.addFirstCondition('Customer');
    const selector = new RecordSelector(page);
    await selector.submitButton(selector.row('Alan')).click();
    await expect(shownItems(sheet)).toHaveText(['Lantern']);

    await condition.value.getByRole('button', { name: 'Clear value' }).click();

    await expect(shownItems(sheet)).toHaveCount(6);
    await expect(condition.value).toHaveText('');
  });

  test('still names the chosen record after a reload', async ({
    page,
    ordersPage,
    filter,
  }) => {
    await filter.addFirstCondition('Customer');
    const selector = new RecordSelector(page);
    await selector.submitButton(selector.row('Grace')).click();
    await expect(shownItems(ordersPage.sheet)).toHaveText(['Desk', 'Sofa']);

    await page.reload();
    await ordersPage.expectLoaded();
    await expect(shownItems(ordersPage.sheet)).toHaveText(['Desk', 'Sofa']);
    await filter.trigger.click();

    await expect(filter.condition(0).value).toHaveText('Grace');
  });
});

test.describe('a condition on a user column', () => {
  test('offers equality and emptiness, and takes a user from the collaborators of the database', async ({
    page,
    collaborator,
    documentsPage: { sheet },
    filter,
  }) => {
    const seeker = new RowSeeker(page);
    const condition = await filter.addFirstCondition('Owner');
    const offered = await openSelect(condition.condition);
    await expect(offered.getByRole('option')).toHaveText([
      'equals',
      'is empty',
      'is not empty',
    ]);
    await page.keyboard.press('Escape');

    await condition.value
      .getByRole('button', { name: 'Pick a record' })
      .click();
    // The server lists the users of the database in no fixed order.
    await expect(seeker.options).toHaveCount(2);
    await expect(seeker.option(env.admin.username)).toBeVisible();
    await expect(seeker.option(collaborator.user.username)).toBeVisible();
    await seeker.option(collaborator.user.username).click();
    await expect(condition.value).toHaveText(collaborator.user.username);
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);

    await chooseOption(condition.condition, 'is empty');
    await expect(shownItems(sheet)).toHaveText(['Delta']);
    await chooseOption(condition.condition, 'is not empty');
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Beta', 'Gamma']);
  });

  test('still names the chosen user after a reload', async ({
    page,
    collaborator,
    documentsPage,
    filter,
  }) => {
    const { sheet } = documentsPage;
    const seeker = new RowSeeker(page);
    const condition = await filter.addFirstCondition('Owner');
    await condition.value
      .getByRole('button', { name: 'Pick a record' })
      .click();
    await seeker.option(collaborator.user.username).click();
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);

    await page.reload();
    await documentsPage.expectLoaded();
    await expect(shownItems(sheet)).toHaveText(['Alpha', 'Gamma']);
    await filter.trigger.click();

    await expect(filter.condition(0).value).toHaveText(
      collaborator.user.username,
    );
  });

  test(
    'leaves the focus on the Filter button when it is added',
    pinsKnownBug('filter-user-condition-focus'),
    async ({ documentsPage, filter }) => {
      const condition = await filter.addFirstCondition('Owner');

      await expect(condition.column).toHaveText('Owner');
      await expect(filter.trigger).toBeFocused();
      await expect(new RowSeeker(documentsPage.page).root).toHaveCount(0);
    },
  );

  test.fixme('opens the list of users when it is added', async ({
    documentsPage,
    filter,
  }) => {
    await filter.addFirstCondition('Owner');

    await expect(new RowSeeker(documentsPage.page).search).toBeFocused();
  });
});
