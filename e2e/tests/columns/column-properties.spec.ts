import { runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { recordRpcCalls } from '../../support/rpc-log';
import { failRpcMethod } from '../../support/rpc-failures';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { descriptionIcon } from '../../support/ui/pages/column-inspector';
import { tableUrl } from '../../support/ui/urls';
import {
  expect,
  storedColumn,
  storedColumns,
  test,
  uniqueConstraints,
} from './fixtures';

test.describe('the name of a column', () => {
  test.beforeEach(async ({ tablePage: { sheet } }) => {
    await sheet.columnHeader('Author').click();
  });

  test('a click turns the name into a field that has the focus, and Save waits for a change', async ({
    page,
    columnInspector: { name },
  }) => {
    await name.input.click();

    await expect(name.input).toBeFocused();
    await expect(name.saveButton).toBeDisabled();
    await expect(name.cancelButton).toBeVisible();
    await page.keyboard.type('s');
    await expect(name.input).toHaveValue('Authors');
    await expect(name.saveButton).toBeEnabled();
  });

  test('renames the column in the header and in PostgreSQL', async ({
    books,
    tablePage: { sheet },
    columnInspector: { name },
  }) => {
    await name.input.click();
    await name.input.fill('Writer');
    await name.saveButton.click();

    await expect(sheet.columnHeaders).toHaveText([
      'id',
      'Title',
      'Writer',
      'Pages',
      'Code',
      'Notes',
    ]);
    await expect(sheet.cell(0, 'Writer')).toHaveText('Frank Herbert');
    await expect(name.saveButton).toHaveCount(0);
    await expect(name.input).toHaveValue('Writer');
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual(['id', 'Title', 'Writer', 'Pages', 'Code', 'Notes']);
  });

  test('rejects an empty name and the name of another column', async ({
    columnInspector: { name },
  }) => {
    await name.input.click();
    await name.input.fill('');
    await expect(name.errors).toHaveText('Column name cannot be empty.');
    await expect(name.saveButton).toBeDisabled();

    await name.input.fill('Title');
    await expect(name.errors).toHaveText(
      'A column with that name already exists.',
    );
    await expect(name.saveButton).toBeDisabled();

    await name.input.fill('title');
    await expect(name.errors).toHaveCount(0);
    await expect(name.saveButton).toBeEnabled();
  });

  test('Cancel brings back the name and saves nothing', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { name },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await name.input.click();
    await name.input.fill('Writer');
    await name.cancelButton.click();

    await expect(name.cancelButton).toHaveCount(0);
    await expect(name.input).toHaveValue('Author');
    await expect(sheet.columnHeader('Author')).toBeVisible();
    expect(rpcCalls).not.toContain('columns.patch');
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual(['id', 'Title', 'Author', 'Pages', 'Code', 'Notes']);
  });

  test('Enter and Escape leave the field open without saving', async ({
    page,
    columnInspector: { name },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await name.input.click();
    await name.input.fill('Writer');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    await expect(name.input).toBeFocused();
    await expect(name.input).toHaveValue('Writer');
    await name.cancelButton.click();
    await expect(name.input).toHaveValue('Author');
    expect(rpcCalls).not.toContain('columns.patch');
  });

  test('a rename that the server refuses shows the error and keeps the old name', async ({
    page,
    tablePage: { sheet },
    columnInspector: { name },
  }) => {
    await failRpcMethod(page, 'columns.patch', 'The column is locked');
    await name.input.click();
    await name.input.fill('Writer');
    await name.saveButton.click();

    await new Toasts(page).expectMessage(
      'Unable to rename column. The column is locked',
    );
    await expect(name.saveButton).toHaveCount(0);
    await expect(name.input).toHaveValue('Author');
    await expect(sheet.columnHeader('Author')).toBeVisible();
  });
});

test.describe('the description of a column', () => {
  test('saves a description of several lines and shows it on the column header', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { description },
  }) => {
    await sheet.columnHeader('Author').click();
    await description.input.click();
    await page.keyboard.type('Who wrote it');
    await page.keyboard.press('Enter');
    await page.keyboard.type('First edition only');
    await description.saveButton.click();

    await expect(description.saveButton).toHaveCount(0);
    await expect(description.input).toHaveValue(
      'Who wrote it\nFirst edition only',
    );
    await descriptionIcon(sheet, 'Author').hover();
    await expect(tooltip(page)).toHaveText('Who wrote it First edition only');
    expect(await storedColumn(books.schema, 'Books', 'Author')).toMatchObject({
      description: 'Who wrote it\nFirst edition only',
    });
  });

  test('a description that the server refuses shows the error', async ({
    page,
    tablePage: { sheet },
    columnInspector: { description },
  }) => {
    await failRpcMethod(page, 'columns.patch', 'The column is locked');
    await sheet.columnHeader('Author').click();
    await description.input.click();
    await description.input.fill('Who wrote it');
    await description.saveButton.click();

    await new Toasts(page).expectMessage(
      'Unable to update column description. The column is locked',
    );
    await expect(description.saveButton).toHaveCount(0);
    await expect(descriptionIcon(sheet, 'Author')).toHaveCount(0);
  });

  test.describe('that is stored', () => {
    test.use({
      extraSql: `COMMENT ON COLUMN "Books"."Author" IS 'Who wrote it'`,
    });

    test('an emptied description is removed from PostgreSQL and from the header', async ({
      books,
      tablePage: { sheet },
      columnInspector: { description },
    }) => {
      await expect(descriptionIcon(sheet, 'Author')).toBeVisible();
      await sheet.columnHeader('Author').click();
      await expect(description.input).toHaveValue('Who wrote it');
      await description.input.click();
      await description.input.fill('');
      await description.saveButton.click();

      await expect(description.saveButton).toHaveCount(0);
      await expect(descriptionIcon(sheet, 'Author')).toHaveCount(0);
      expect(await storedColumn(books.schema, 'Books', 'Author')).toMatchObject(
        { description: null },
      );
    });
  });
});

test.describe('Restrict to Unique', () => {
  test('adds a unique constraint, with a spinner while it saves', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { uniqueCheckbox, savingSpinner },
  }) => {
    await sheet.columnHeader('Author').click();
    await expect(uniqueCheckbox).not.toBeChecked();
    const release = await holdRpcCalls(page, 'constraints.add');
    await uniqueCheckbox.click();
    await expect(savingSpinner).toBeVisible();
    await expect(uniqueCheckbox).toHaveCount(0);
    release();

    await expect(uniqueCheckbox).toBeChecked();
    await expect(savingSpinner).toHaveCount(0);
    await new Toasts(page).expectMessage(
      'Column Author will no longer allow duplicates.',
    );
    expect(await uniqueConstraints(books.schema, 'Books')).toEqual([
      'Author',
      'Code',
    ]);
  });

  test.describe('on a column with two unique constraints', () => {
    test.use({
      extraSql: `ALTER TABLE "Books"
                   ADD CONSTRAINT "Books_Code_again" UNIQUE ("Code"),
                   ADD CONSTRAINT "Books_Title_Code" UNIQUE ("Title", "Code");`,
    });

    test('cleared, drops both and keeps a constraint that spans more columns', async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { uniqueCheckbox },
    }) => {
      await sheet.columnHeader('Code').click();
      await expect(uniqueCheckbox).toBeChecked();
      await uniqueCheckbox.click();

      await new Toasts(page).expectMessage(
        'Column Code will allow duplicates.',
      );
      await expect(uniqueCheckbox).not.toBeChecked();
      expect(await uniqueConstraints(books.schema, 'Books')).toEqual([
        'Title, Code',
      ]);
    });
  });

  test.describe('on a column with a repeated value', () => {
    test.use({
      extraSql: `UPDATE "Books" SET "Author" = 'Jane Austen' WHERE "Title" = 'Hamlet'`,
    });

    test('is refused with the error of the database', async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { uniqueCheckbox },
    }) => {
      await sheet.columnHeader('Author').click();
      await uniqueCheckbox.click();

      await new Toasts(page).expectMessage(
        'Unable to update "Allow Duplicates" of column Author. UniqueViolation: could not create unique index "Books_Author_key"',
      );
      await expect(uniqueCheckbox).not.toBeChecked();
      expect(await uniqueConstraints(books.schema, 'Books')).toEqual(['Code']);
    });
  });
});

test.describe('Disallow NULL Values', () => {
  test.describe('on a column without NULL', () => {
    test.use({
      extraSql: `UPDATE "Books" SET "Pages" = 100 WHERE "Pages" IS NULL`,
    });

    test('makes the column NOT NULL', async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { notNullCheckbox },
    }) => {
      await sheet.columnHeader('Pages').click();
      await expect(notNullCheckbox).not.toBeChecked();
      await notNullCheckbox.click();

      await new Toasts(page).expectMessage(
        'Column Pages will no longer allow NULL',
      );
      await expect(notNullCheckbox).toBeChecked();
      expect(await storedColumn(books.schema, 'Books', 'Pages')).toMatchObject({
        nullable: false,
      });
    });
  });

  test('is refused with the error of the database while the column holds NULL', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { notNullCheckbox },
  }) => {
    await sheet.columnHeader('Author').click();
    await notNullCheckbox.click();

    await new Toasts(page).expectMessage(
      'Unable to update "Allow NULL" of column Author. NotNullViolation: column "Author" of relation "Books" contains null values',
    );
    await expect(notNullCheckbox).not.toBeChecked();
    expect(await storedColumn(books.schema, 'Books', 'Author')).toMatchObject({
      nullable: true,
    });
  });

  test('cleared, allows NULL in the column', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { notNullCheckbox },
  }) => {
    await sheet.columnHeader('Title').click();
    await expect(notNullCheckbox).toBeChecked();
    await notNullCheckbox.click();

    await new Toasts(page).expectMessage('Column Title will allow NULL');
    await expect(notNullCheckbox).not.toBeChecked();
    expect(await storedColumn(books.schema, 'Books', 'Title')).toMatchObject({
      nullable: true,
    });
  });
});

test.describe('keys', () => {
  test.use({
    extraSql: `CREATE TABLE "Authors" (
                 id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
                 "Name" text
               );
               ALTER TABLE "Books" ADD COLUMN "Writer" integer REFERENCES "Authors" (id);`,
  });

  test('the primary key column shows a tag instead of the options', async ({
    tablePage: { sheet },
    columnInspector,
  }) => {
    await sheet.columnHeader('id').click();

    await expect(columnInspector.primaryKeyTag).toBeVisible();
    await expect(columnInspector.uniqueCheckbox).toHaveCount(0);
    await expect(columnInspector.notNullCheckbox).toHaveCount(0);
  });

  test('a foreign key column links to the table it refers to', async ({
    api,
    books,
    tablePage: { sheet },
    columnInspector,
  }) => {
    await sheet.columnHeader('Writer').click();

    const authors = await api.getTable(books.schema, 'Authors');
    await expect(columnInspector.properties.root).toContainText('Linked To');
    await expect(columnInspector.linkedTable).toHaveText('Authors');
    await expect(columnInspector.linkedTable).toHaveAttribute(
      'href',
      tableUrl(authors),
    );
    await expect(columnInspector.uniqueCheckbox).toBeVisible();
  });
});

test.describe('changes made elsewhere', () => {
  test('the Column tab shows the stored state again after Refresh', async ({
    books,
    tablePage,
    columnInspector,
  }) => {
    await tablePage.sheet.columnHeader('Pages').click();
    await expect(columnInspector.notNullCheckbox).not.toBeChecked();
    await runSqlInSchema(
      books.schema,
      `UPDATE "Books" SET "Pages" = 1 WHERE "Pages" IS NULL;
       ALTER TABLE "Books" ALTER COLUMN "Pages" SET NOT NULL;`,
    );
    await tablePage.refreshButton.click();

    await expect(columnInspector.notNullCheckbox).toBeChecked();
  });
});
