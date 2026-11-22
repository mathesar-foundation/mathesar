import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { failRpcMethod } from '../../support/rpc-failures';
import type { NewColumnDropdown } from '../../support/ui/components/new-column-dropdown';
import type { Sheet } from '../../support/ui/components/sheet';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import {
  type StoredColumn,
  columnMetadata,
  expect,
  storedColumn,
  storedColumns,
  test,
} from './fixtures';

const BOOKS_COLUMNS = ['id', 'Title', 'Author', 'Pages', 'Code', 'Notes'];

/** Adds one column per type through the form, each named after its type. */
async function addColumnsNamedAfterTypes(
  sheet: Sheet,
  newColumn: NewColumnDropdown,
  types: string[],
): Promise<void> {
  for (const type of types) {
    await sheet.newColumnButton.click();
    await newColumn.name.fill(type);
    await newColumn.type(type).click();
    await newColumn.addButton.click();
    await expect(sheet.columnHeader(type)).toBeVisible();
    await expect(newColumn.root).toHaveCount(0);
  }
}

function namesAndTypes(columns: StoredColumn[]): string[][] {
  return columns.map(({ name, type }) => [name, type]);
}

test.describe('adding a column', () => {
  test('adds a column with the typed name after the last column, without a reload', async ({
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await expect(newColumn.name).toBeFocused();
    await expect(newColumn.type('Text')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await newColumn.name.fill('Edition');
    await newColumn.addButton.click();

    await expect(newColumn.root).toHaveCount(0);
    await expect(sheet.columnHeaders).toHaveText([...BOOKS_COLUMNS, 'Edition']);
    await expect(sheet.cell(0, 'Edition')).toHaveText('NULL');
    await expect(sheet.cell(0, 'Title')).toHaveText('Dune');
    await expect(sheet.newColumnButton).toBeFocused();
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual([...BOOKS_COLUMNS, 'Edition']);
  });

  test('offers every type in alphabetical order', async ({
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();

    await expect(newColumn.types).toHaveText([
      'Boolean',
      'Date',
      'Date & Time',
      'Duration',
      'Email',
      'File',
      'JSON',
      'Money',
      'Number',
      'Text',
      'Time',
      'URI',
      'User',
      'UUID',
    ]);
  });

  test('creates each type as its PostgreSQL type', async ({
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    const types: Record<string, string> = {
      Boolean: 'boolean',
      Date: 'date',
      Duration: 'interval',
      Email: 'mathesar_types.email',
      JSON: 'jsonb',
      Money: 'mathesar_types.mathesar_money',
      Number: 'numeric',
      URI: 'mathesar_types.uri',
      UUID: 'uuid',
    };
    await addColumnsNamedAfterTypes(sheet, newColumn, Object.keys(types));

    const added = (await storedColumns(books.schema, 'Books')).slice(
      BOOKS_COLUMNS.length,
    );
    expect(namesAndTypes(added)).toEqual(Object.entries(types));
  });

  test(
    'creates Text, Time and Date & Time columns with other types than the documented defaults',
    pinsKnownBug('new-column-types-differ-from-docs'),
    async ({ books, tablePage: { sheet }, newColumn }) => {
      await addColumnsNamedAfterTypes(sheet, newColumn, [
        'Text',
        'Time',
        'Date & Time',
      ]);

      const added = (await storedColumns(books.schema, 'Books')).slice(
        BOOKS_COLUMNS.length,
      );
      expect(namesAndTypes(added)).toEqual([
        ['Text', 'character varying'],
        ['Time', 'time without time zone'],
        ['Date & Time', 'timestamp without time zone'],
      ]);
    },
  );

  test.fixme('creates Text, Time and Date & Time columns with the documented default types', async ({
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await addColumnsNamedAfterTypes(sheet, newColumn, [
      'Text',
      'Time',
      'Date & Time',
    ]);

    const added = (await storedColumns(books.schema, 'Books')).slice(
      BOOKS_COLUMNS.length,
    );
    expect(namesAndTypes(added)).toEqual([
      ['Text', 'text'],
      ['Time', 'time with time zone'],
      ['Date & Time', 'timestamp with time zone'],
    ]);
  });

  test('a User column is an integer column that shows users by their username', async ({
    api,
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await addColumnsNamedAfterTypes(sheet, newColumn, ['User']);

    await expect(sheet.columnTypeIcon('User')).toHaveAttribute(
      'aria-label',
      'User',
    );
    expect(await storedColumn(books.schema, 'Books', 'User')).toMatchObject({
      type: 'integer',
    });
    expect(await columnMetadata(api, books, 'User')).toMatchObject({
      user_display_field: 'username',
    });
  });

  test('a File column is a jsonb column that keeps the files in the configured storage', async ({
    api,
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await addColumnsNamedAfterTypes(sheet, newColumn, ['File']);

    await expect(sheet.columnTypeIcon('File')).toHaveAttribute(
      'aria-label',
      'File',
    );
    expect(await storedColumn(books.schema, 'Books', 'File')).toMatchObject({
      type: 'jsonb',
    });
    expect(await columnMetadata(api, books, 'File')).toMatchObject({
      file_backend: 'default',
    });
  });

  test('requires a name that no other column has', async ({
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await expect(newColumn.addButton).toBeDisabled();
    await expect(newColumn.nameErrors).toHaveCount(0);

    await newColumn.name.fill('Title');
    await expect(newColumn.nameErrors).toHaveText(
      'A column with that name already exists',
    );
    await expect(newColumn.addButton).toBeDisabled();

    await newColumn.name.fill('');
    await expect(newColumn.nameErrors).toHaveCount(0);
    await expect(newColumn.addButton).toBeDisabled();

    await newColumn.name.fill('title');
    await expect(newColumn.addButton).toBeEnabled();
  });

  test('accepts a name of spaces only and names the column "Column"', async ({
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await newColumn.name.fill('   ');
    await expect(newColumn.nameErrors).toHaveCount(0);
    await newColumn.addButton.click();

    await expect(sheet.columnHeaders).toHaveText([...BOOKS_COLUMNS, 'Column']);
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual([...BOOKS_COLUMNS, 'Column']);
  });

  test('Cancel closes the form without adding a column, and the form opens empty again', async ({
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await newColumn.name.fill('Edition');
    await newColumn.type('Number').click();
    await newColumn.cancelButton.click();

    await expect(newColumn.root).toHaveCount(0);
    await expect(sheet.newColumnButton).toBeFocused();
    await sheet.newColumnButton.click();
    await expect(newColumn.name).toHaveValue('');
    await expect(newColumn.type('Text')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(sheet.columnHeaders).toHaveText(BOOKS_COLUMNS);
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual(BOOKS_COLUMNS);
  });

  test('a second click on + or a click elsewhere closes the form', async ({
    tablePage,
    newColumn,
  }) => {
    const { sheet } = tablePage;
    await sheet.newColumnButton.click();
    await sheet.newColumnButton.click();
    await expect(newColumn.root).toHaveCount(0);

    await sheet.newColumnButton.click();
    await expect(newColumn.root).toBeVisible();
    await tablePage.heading.click();
    await expect(newColumn.root).toHaveCount(0);
  });

  test('Tab keeps the focus inside the form and skips Add while it is disabled', async ({
    page,
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await expect(newColumn.name).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(newColumn.typeList).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(newColumn.cancelButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(newColumn.name).toBeFocused();
    await expectStaysOpen(newColumn.root);
  });

  test('adds a column with the keyboard alone, choosing the type with the arrow keys', async ({
    page,
    books,
    tablePage: { sheet },
    newColumn,
  }) => {
    await sheet.newColumnButton.click();
    await expect(newColumn.name).toBeFocused();
    await page.keyboard.type('Opens');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(newColumn.type('Time')).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(newColumn.addButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(sheet.columnHeaders).toHaveText([...BOOKS_COLUMNS, 'Opens']);
    expect(await storedColumns(books.schema, 'Books')).toContainEqual(
      expect.objectContaining({
        name: 'Opens',
        type: 'time without time zone',
      }),
    );
  });

  test('Enter and Escape in the name field neither submit nor close the form', async ({
    page,
    tablePage: { sheet },
    newColumn,
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await sheet.newColumnButton.click();
    await newColumn.name.fill('Edition');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    await expectStaysOpen(newColumn.root);
    await expect(newColumn.name).toHaveValue('Edition');
    await newColumn.addButton.click();
    await expect(sheet.columnHeader('Edition')).toBeVisible();
    expect(rpcCalls.filter((method) => method === 'columns.add')).toEqual([
      'columns.add',
    ]);
  });

  test('keeps the form open with the error when the server refuses the column', async ({
    page,
    tablePage: { sheet },
    newColumn,
  }) => {
    await failRpcMethod(page, 'columns.add', 'The disk is full');
    await sheet.newColumnButton.click();
    await newColumn.name.fill('Edition');
    await newColumn.addButton.click();

    await expect(newColumn.submitErrors).toHaveText('The disk is full');
    await expectStaysOpen(newColumn.root);
    await expect(newColumn.name).toHaveValue('Edition');
    await expect(sheet.columnHeaders).toHaveText(BOOKS_COLUMNS);
  });
});
