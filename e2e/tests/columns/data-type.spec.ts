import { runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { FileField } from '../../support/ui/components/file-attachments';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { expect, storedColumn, test } from './fixtures';

const TEXT_CONVERSIONS = [
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
];

test.describe('the Data Type section', () => {
  test.use({
    extraSql: `ALTER TABLE "Books"
                 ADD COLUMN "Year" text, ADD COLUMN "Price" text, ADD COLUMN "Opens" time;
               UPDATE "Books" SET "Year" = (1960 + id)::text, "Price" = '9.50', "Opens" = '09:30';
               UPDATE "Books" SET "Price" = 'cheap' WHERE "Title" = 'Emma';`,
  });

  test('shows the data type and the database type of the selected column', async ({
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Pages').click();
    await expect(dataType.select).toHaveText('Number');
    await expect(dataType.databaseType).toHaveText('Database Type: integer');
    await expect(dataType.numberType).toHaveText('Integer');
    await expect(dataType.integerSize).toHaveText('Default (4 bytes)');

    await sheet.columnHeader('Author').click();
    await expect(dataType.select).toHaveText('Text');
    await expect(dataType.databaseType).toHaveText('Database Type: text');
    await expect(dataType.maxLengthCheckbox).not.toBeChecked();
  });

  test('offers only the types that the column can be converted to', async ({
    page,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Author').click();
    await expect(await dataType.openTypes()).toHaveText(TEXT_CONVERSIONS);
    await page.keyboard.press('Escape');

    await sheet.columnHeader('Opens').click();
    await expect(await dataType.openTypes()).toHaveText(['Text', 'Time']);
  });

  test('changes a text column to Number and converts its values', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Year').click();
    await dataType.chooseType('Number');
    await expect(dataType.databaseType).toHaveText('Database Type: numeric');
    await expect(dataType.dataLossWarning).toBeVisible();
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    await expect(dataType.dataLossWarning).toHaveCount(0);
    await expect(dataType.select).toHaveText('Number');
    await expect(sheet.columnTypeIcon('Year')).toHaveAttribute(
      'aria-label',
      'Number',
    );
    await expect(sheet.cell(0, 'Year')).toHaveText('1,961');
    expect(await storedColumn(books.schema, 'Books', 'Year')).toMatchObject({
      type: 'numeric',
    });
  });

  test('a conversion that the database refuses shows the error and changes nothing', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Price').click();
    await dataType.chooseType('Number');
    await dataType.saveButton.click();

    await new Toasts(page).expectMessage(
      'RaiseException: cheap cannot be cast to numeric',
    );
    await expect(dataType.select).toHaveText('Number');
    await expect(dataType.saveButton).toBeEnabled();
    expect(await storedColumn(books.schema, 'Books', 'Price')).toMatchObject({
      type: 'text',
    });

    await dataType.cancelButton.click();
    await expect(dataType.select).toHaveText('Text');
  });

  test.describe('of a column with stored display settings', () => {
    test.beforeEach(async ({ api, books }) => {
      await api.setColumnMetadata(books, 'Notes', { display_width: 200 });
    });

    test('Cancel discards the chosen type and sends nothing', async ({
      page,
      tablePage: { sheet },
      columnInspector: { dataType },
    }) => {
      await sheet.columnHeader('Notes').click();
      await expect(dataType.dataLossWarning).toHaveCount(0);
      const rpcCalls = recordRpcCalls(page);
      await dataType.chooseType('Email');
      await expect(dataType.databaseType).toHaveText(
        'Database Type: mathesar_types.email',
      );
      await dataType.cancelButton.click();

      await expect(dataType.select).toHaveText('Text');
      await expect(dataType.databaseType).toHaveText('Database Type: text');
      await expect(dataType.saveButton).toHaveCount(0);
      await expect(dataType.dataLossWarning).toHaveCount(0);
      expect(
        rpcCalls.filter((method) => method.startsWith('columns.')),
      ).toEqual([]);
    });
  });

  test('a maximum length makes a text column character varying of that length', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Author').click();
    await dataType.maxLengthCheckbox.check();
    await expect(dataType.maxLength).toHaveValue('255');
    await expect(dataType.databaseType).toHaveText(
      'Database Type: character varying',
    );
    await dataType.maxLength.fill('');
    await expect(dataType.fieldErrors).toHaveText('* This is a required field');
    await expect(dataType.saveButton).toBeDisabled();

    await dataType.maxLength.pressSequentially('40');
    await expect(dataType.maxLength).toHaveValue('40');
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    expect(await storedColumn(books.schema, 'Books', 'Author')).toMatchObject({
      type: 'character varying(40)',
    });
  });

  test('a maximum length below the longest value is refused by the database', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Code').click();
    await dataType.maxLengthCheckbox.check();
    await fillFormattedInput(dataType.maxLength, '1');
    await dataType.saveButton.click();

    await new Toasts(page).expectMessage(
      'StringDataRightTruncation: value too long for type character varying(1)',
    );
    expect(await storedColumn(books.schema, 'Books', 'Code')).toMatchObject({
      type: 'text',
    });
  });

  test('Integer Data Size makes an integer column bigint', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Pages').click();
    await chooseOption(dataType.integerSize, 'Big Integer (8 bytes)');
    await expect(dataType.databaseType).toHaveText('Database Type: bigint');
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    await expect(dataType.integerSize).toHaveText('Big Integer (8 bytes)');
    expect(await storedColumn(books.schema, 'Books', 'Pages')).toMatchObject({
      type: 'bigint',
    });
  });

  test('Decimal with Max Digits and Decimal Places makes a numeric column of that precision and scale', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Pages').click();
    await chooseOption(dataType.numberType, 'Decimal');
    await expect(dataType.databaseType).toHaveText('Database Type: numeric');
    await fillFormattedInput(dataType.maxDigits, '6');
    await fillFormattedInput(dataType.decimalPlaces, '2');
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    await expect(dataType.maxDigits).toHaveValue('6');
    await expect(dataType.decimalPlaces).toHaveValue('2');
    expect(await storedColumn(books.schema, 'Books', 'Pages')).toMatchObject({
      type: 'numeric(6,2)',
    });
  });

  test('Float makes a real column, or a double precision one', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Pages').click();
    await chooseOption(dataType.numberType, 'Float');
    await expect(dataType.floatType).toHaveText('Real (6 digits)');
    await expect(dataType.databaseType).toHaveText('Database Type: real');
    await chooseOption(dataType.floatType, 'Double Precision (15 digits)');
    await expect(dataType.databaseType).toHaveText(
      'Database Type: double precision',
    );
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    expect(await storedColumn(books.schema, 'Books', 'Pages')).toMatchObject({
      type: 'double precision',
    });
  });

  test('Support Time Zones makes a time column time with time zone', async ({
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Opens').click();
    await expect(dataType.select).toHaveText('Time');
    await dataType.timeZonesCheckbox.check();
    await expect(dataType.databaseType).toHaveText(
      'Database Type: time with time zone',
    );
    await dataType.saveButton.click();

    await expect(dataType.saveButton).toHaveCount(0);
    await expect(dataType.timeZonesCheckbox).toBeChecked();
    expect(await storedColumn(books.schema, 'Books', 'Opens')).toMatchObject({
      type: 'time with time zone',
    });
  });

  test(
    'shows the data loss warning and Save before any change for a column without display settings',
    pinsKnownBug('column-type-warning-without-change'),
    async ({ tablePage: { sheet }, columnInspector: { dataType } }) => {
      await sheet.columnHeader('Author').click();

      await expect(dataType.dataLossWarning).toBeVisible();
      await expect(dataType.saveButton).toBeEnabled();
      await expect(dataType.cancelButton).toBeVisible();
    },
  );

  test.fixme('shows the data loss warning and Save only once the type changes', async ({
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Author').click();
    await expect(dataType.dataLossWarning).toHaveCount(0);
    await expect(dataType.saveButton).toHaveCount(0);

    await dataType.chooseType('Number');
    await expect(dataType.dataLossWarning).toBeVisible();
    await expect(dataType.saveButton).toBeEnabled();
  });
});

test.describe('the Data Type section of a key column', () => {
  test.use({
    extraSql: `CREATE TABLE "Authors" (
                 id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
                 "Name" text
               );
               ALTER TABLE "Books" ADD COLUMN "Writer" integer REFERENCES "Authors" (id);`,
  });

  test('does not let the type of the primary key column change', async ({
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('id').click();

    await expect(dataType.select).toBeDisabled();
    await expect(dataType.note).toHaveText(
      'The data type of the primary key column is restricted and cannot be changed.',
    );
  });

  test('does not let the type of a foreign key column change', async ({
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Writer').click();

    await expect(dataType.select).toBeDisabled();
    await expect(dataType.note).toHaveText(
      'The data type of this column must match the referenced column and cannot be changed.',
    );
  });
});

test.describe('the Data Type section of a column that can hold users or files', () => {
  test.use({
    extraSql: `ALTER TABLE "Books" ADD COLUMN "Owner" integer, ADD COLUMN "Cover" jsonb;`,
  });

  test('changes an integer column to User and back to an integer Number, which sets and clears the user display', async ({
    api,
    books,
    collaborator: { user },
    tablePage,
    columnInspector: { dataType },
  }) => {
    const { sheet } = tablePage;
    await runSqlInSchema(
      books.schema,
      `UPDATE "Books" SET "Owner" = ${user.id} WHERE "Title" = 'Dune';`,
    );
    await tablePage.goto(books);
    const userId = user.id.toLocaleString('en-US');
    await expect(sheet.cell(0, 'Owner')).toHaveText(userId);
    await sheet.columnHeader('Owner').click();
    await dataType.chooseType('User');
    await dataType.saveButton.click();

    await expect(sheet.cell(0, 'Owner')).toHaveText(user.username);
    await expect(sheet.columnTypeIcon('Owner')).toHaveAttribute(
      'aria-label',
      'User',
    );
    expect(await api.columnMetadata(books, 'Owner')).toEqual({
      user_display_field: 'username',
    });

    await dataType.chooseType('Number');
    await chooseOption(dataType.numberType, 'Integer');
    await dataType.saveButton.click();

    await expect(sheet.cell(0, 'Owner')).toHaveText(userId);
    await expect(sheet.columnTypeIcon('Owner')).toHaveAttribute(
      'aria-label',
      'Number',
    );
    expect(await api.columnMetadata(books, 'Owner')).toEqual({});
    expect(await storedColumn(books.schema, 'Books', 'Owner')).toMatchObject({
      type: 'integer',
    });
  });

  test('changes a JSON column to File and back, which sets and clears the file storage', async ({
    api,
    books,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    const cover = sheet.cell(0, 'Cover');
    const { uploadButton } = new FileField(cover);
    await expect(cover).toHaveText('NULL');
    await sheet.columnHeader('Cover').click();
    await dataType.chooseType('File');
    await dataType.saveButton.click();

    await expect(sheet.columnTypeIcon('Cover')).toHaveAttribute(
      'aria-label',
      'File',
    );
    await cover.click();
    await expect(uploadButton).toBeVisible();
    await expect(cover).toHaveText('');
    expect(await api.columnMetadata(books, 'Cover')).toEqual({
      file_backend: 'default',
    });

    await sheet.columnHeader('Cover').click();
    await dataType.chooseType('JSON');
    await dataType.saveButton.click();

    await expect(sheet.columnTypeIcon('Cover')).toHaveAttribute(
      'aria-label',
      'JSON',
    );
    await cover.click();
    await expect(cover).toHaveText('NULL');
    await expect(uploadButton).toHaveCount(0);
    expect(await api.columnMetadata(books, 'Cover')).toEqual({});
  });
});

test.describe('the Data Type section of a column of a type that Mathesar does not know', () => {
  test.use({
    extraSql: `ALTER TABLE "Books" ADD COLUMN "Spot" point, ADD COLUMN "Words" tsvector;`,
  });

  test('shows the type as Other and lists it after the types the column can be converted to', async ({
    page,
    tablePage: { sheet },
    columnInspector: { dataType },
  }) => {
    await sheet.columnHeader('Spot').click();
    await expect(dataType.select).toHaveText('Other');
    await expect(dataType.databaseType).toHaveText('Database Type: point');
    await expect(await dataType.openTypes()).toHaveText(['Other']);
    await page.keyboard.press('Escape');

    await sheet.columnHeader('Words').click();
    await expect(dataType.databaseType).toHaveText('Database Type: tsvector');
    await expect(await dataType.openTypes()).toHaveText(['Text', 'Other']);
  });
});
