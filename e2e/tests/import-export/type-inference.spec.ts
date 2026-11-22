import { pinsKnownBug } from '../../support/known-bugs';
import { tableUrl } from '../../support/ui/urls';
import { expect, storedColumns, storedRecords, test } from './fixtures';

/** The columns of `inferred-types.csv`. */
const FILE_COLUMNS = [
  'Whole',
  'Decimal',
  'Flag',
  'Day',
  'Moment',
  'Email',
  'Website',
  'Price',
  'Note',
];

test.describe('type inference of an import', () => {
  test('suggests a type for each column from its values', async ({
    openPreview,
    previewPage,
  }) => {
    await openPreview('inferred-types.csv');

    await previewPage.expectColumns([
      ['id', 'Number'],
      ['Whole', 'Number'],
      ['Decimal', 'Number'],
      ['Flag', 'Boolean'],
      ['Day', 'Date'],
      ['Moment', 'Date & Time'],
      ['Email', 'Email'],
      ['Website', 'URI'],
      ['Price', 'Money'],
      ['Note', 'Text'],
    ]);
    await expect(previewPage.cells).toHaveText([
      ...['1', '1', '1.5', '', '01/15/2024', '01/15/2024 10:30'],
      ...['ada@example.com', 'https://example.com/a', '$10.5', 'first'],
      ...['2', '2', '2.25', '', '12/31/2023', '12/31/2023 23:59'],
      ...['grace@example.org', 'https://mathesar.org', '$2,000', 'NULL'],
      ...['3', '3', '-3.75', '', '07/04/1999', '07/04/1999 00:00'],
      ...['alan@example.net', 'http://example.org/path?q=1', '$0.99', 'third'],
    ]);
  });

  test('Confirm stores the suggested types and converts the values', async ({
    page,
    openPreview,
    previewPage,
    schema,
  }) => {
    const table = await openPreview('inferred-types.csv');
    await previewPage.confirmButton.click();

    await expect(page).toHaveURL(tableUrl(table));
    expect(await storedColumns(schema, 'inferred-types')).toEqual([
      { name: 'id', type: 'integer' },
      { name: 'Whole', type: 'numeric' },
      { name: 'Decimal', type: 'numeric' },
      { name: 'Flag', type: 'boolean' },
      { name: 'Day', type: 'date' },
      { name: 'Moment', type: 'timestamp without time zone' },
      { name: 'Email', type: 'mathesar_types.email' },
      { name: 'Website', type: 'mathesar_types.uri' },
      { name: 'Price', type: 'mathesar_types.mathesar_money' },
      { name: 'Note', type: 'text' },
    ]);
    const [first, second] = await storedRecords(schema, 'inferred-types');
    expect(first).toEqual({
      id: 1,
      Whole: 1,
      Decimal: 1.5,
      Flag: true,
      Day: '2024-01-15',
      Moment: '2024-01-15T10:30:00',
      Email: 'ada@example.com',
      Website: 'https://example.com/a',
      Price: 10.5,
      Note: 'first',
    });
    expect(second).toMatchObject({ Flag: false, Price: 2000, Note: null });
  });

  test('without type inference, every column is stored as text as written', async ({
    page,
    openPreview,
    previewPage,
    schema,
  }) => {
    const table = await openPreview('inferred-types.csv', { inference: false });
    await previewPage.confirmButton.click();

    await expect(page).toHaveURL(tableUrl(table));
    expect(await storedColumns(schema, 'inferred-types')).toEqual([
      { name: 'id', type: 'integer' },
      ...FILE_COLUMNS.map((name) => ({ name, type: 'text' })),
    ]);
    expect(await storedRecords(schema, 'inferred-types')).toContainEqual({
      id: 1,
      Whole: '1',
      Decimal: '1.5',
      Flag: 'true',
      Day: '2024-01-15',
      Moment: '2024-01-15 10:30:00',
      Email: 'ada@example.com',
      Website: 'https://example.com/a',
      Price: '$10.50',
      Note: 'first',
    });
  });

  test(
    'takes a prefix that all values of a column share for a currency symbol',
    pinsKnownBug('import-infers-prefix-as-money'),
    async ({ page, openPreview, previewPage, schema }) => {
      const table = await openPreview('row-labels.csv');

      await expect(previewPage.column(1).type).toHaveText('Money');
      await expect(previewPage.cells).toHaveText([
        ...['1', '$1', '5'],
        ...['2', '$2', '7'],
      ]);
      await previewPage.confirmButton.click();
      await expect(page).toHaveURL(tableUrl(table));
      expect(await storedRecords(schema, 'row-labels')).toEqual([
        { id: 1, Label: 1, Count: 5 },
        { id: 2, Label: 2, Count: 7 },
      ]);
    },
  );

  test.fixme('keeps text values that share a prefix as text', async ({
    page,
    openPreview,
    previewPage,
    schema,
  }) => {
    const table = await openPreview('row-labels.csv');

    await expect(previewPage.column(1).type).toHaveText('Text');
    await previewPage.confirmButton.click();
    await expect(page).toHaveURL(tableUrl(table));
    expect(await storedRecords(schema, 'row-labels')).toEqual([
      { id: 1, Label: 'Row 1', Count: 5 },
      { id: 2, Label: 'Row 2', Count: 7 },
    ]);
  });
});
