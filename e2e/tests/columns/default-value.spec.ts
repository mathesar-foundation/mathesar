import { env } from '../../support/env';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { DateTimePicker } from '../../support/ui/components/date-time-picker';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { RowSeeker } from '../../support/ui/components/row-seeker';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { expect, storedColumn, test } from './fixtures';

test.use({
  extraSql: `ALTER TABLE "Books"
               ADD COLUMN "In Stock" boolean,
               ADD COLUMN "Published" date,
               ADD COLUMN "Added" timestamp DEFAULT now(),
               ADD COLUMN "Owner" integer;`,
});

test.describe('the Default Value section', () => {
  test('shows the stored default of the column', async ({
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Notes').click();
    await expect(defaultValue.customDefault).toBeChecked();
    await expect(defaultValue.value).toHaveValue('none');

    await sheet.columnHeader('Author').click();
    await expect(defaultValue.noDefault).toBeChecked();
    await expect(defaultValue.value).toHaveCount(0);
    await expect(defaultValue.saveButton).toHaveCount(0);
  });

  test('sets a custom default', async ({
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Author').click();
    await defaultValue.customDefault.check();
    await expect(defaultValue.saveButton).toBeVisible();
    await defaultValue.value.fill('Anonymous');
    await defaultValue.saveButton.click();

    await expect(defaultValue.saveButton).toHaveCount(0);
    await expect(defaultValue.value).toHaveValue('Anonymous');
    expect(await storedColumn(books.schema, 'Books', 'Author')).toMatchObject({
      default: "'Anonymous'::text",
    });
  });

  test('"No default value" removes the default', async ({
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Notes').click();
    await defaultValue.noDefault.check();
    await expect(defaultValue.value).toHaveCount(0);
    await defaultValue.saveButton.click();

    await expect(defaultValue.saveButton).toHaveCount(0);
    await expect(defaultValue.noDefault).toBeChecked();
    expect(await storedColumn(books.schema, 'Books', 'Notes')).toMatchObject({
      default: null,
    });
  });

  test('after the default is removed, Custom default offers the removed value again', async ({
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Notes').click();
    await defaultValue.noDefault.check();
    await defaultValue.saveButton.click();
    await expect(defaultValue.saveButton).toHaveCount(0);

    await defaultValue.customDefault.check();
    await expect(defaultValue.value).toHaveValue('none');
  });

  test('Cancel brings back the stored default and saves nothing', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await sheet.columnHeader('Notes').click();
    await defaultValue.value.fill('other');
    await defaultValue.cancelButton.click();

    await expect(defaultValue.value).toHaveValue('none');
    await expect(defaultValue.saveButton).toHaveCount(0);
    expect(rpcCalls).not.toContain('columns.patch');
    expect(await storedColumn(books.schema, 'Books', 'Notes')).toMatchObject({
      default: "'none'::text",
    });
  });

  test('is not offered for a column whose default the database generates', async ({
    tablePage: { sheet },
    columnInspector,
  }) => {
    await sheet.columnHeader('id').click();
    await expect(columnInspector.dataType.root).toBeVisible();
    await expect(columnInspector.defaultValue.root).toHaveCount(0);

    await sheet.columnHeader('Added').click();
    await expect(columnInspector.name.input).toHaveValue('Added');
    await expect(columnInspector.defaultValue.root).toHaveCount(0);
  });

  test('a number default is stored as a number', async ({
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Pages').click();
    await defaultValue.customDefault.check();
    await fillFormattedInput(defaultValue.value, '100');
    await defaultValue.saveButton.click();

    await expect(defaultValue.saveButton).toHaveCount(0);
    expect(await storedColumn(books.schema, 'Books', 'Pages')).toMatchObject({
      default: '100',
    });
  });

  test('a boolean default is chosen from a select', async ({
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('In Stock').click();
    await defaultValue.customDefault.check();
    await chooseOption(defaultValue.booleanValue, 'true');
    await defaultValue.saveButton.click();

    await expect(defaultValue.saveButton).toHaveCount(0);
    await expect(defaultValue.booleanValue).toHaveText('true');
    expect(await storedColumn(books.schema, 'Books', 'In Stock')).toMatchObject(
      { default: 'true' },
    );
  });

  test(
    'a custom default saved without a value is sent as the text "null" and refused',
    pinsKnownBug('default-value-without-input'),
    async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { defaultValue },
    }) => {
      await sheet.columnHeader('In Stock').click();
      await defaultValue.customDefault.check();
      await expect(defaultValue.booleanValue).toHaveText('');
      await defaultValue.saveButton.click();

      await new Toasts(page).expectMessage(
        'InvalidTextRepresentation: invalid input syntax for type boolean: "null"',
      );
      await expect(defaultValue.saveButton).toBeVisible();
      expect(
        await storedColumn(books.schema, 'Books', 'In Stock'),
      ).toMatchObject({ default: null });
    },
  );

  test.fixme('a custom default cannot be saved before a value is chosen', async ({
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('In Stock').click();
    await defaultValue.customDefault.check();

    await expect(defaultValue.saveButton).toBeDisabled();
  });

  test(
    'a saved date default leaves Save and Cancel on screen',
    pinsKnownBug('date-default-shows-unsaved'),
    async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { defaultValue },
    }) => {
      await sheet.columnHeader('Published').click();
      await defaultValue.customDefault.check();
      await defaultValue.value.click();
      await expect(new DateTimePicker(page).root).toBeVisible();
      await expect(defaultValue.value).toBeFocused();
      await page.keyboard.type('03/15/2024');
      await page.keyboard.press('Enter');
      await defaultValue.saveButton.click();

      await expect
        .poll(
          async () =>
            (await storedColumn(books.schema, 'Books', 'Published'))?.default,
        )
        .toBe("'2024-03-15'::date");
      await expect(defaultValue.value).toHaveValue('03/15/2024');
      await expect(defaultValue.saveButton).toBeVisible();
      await expect(defaultValue.cancelButton).toBeVisible();
    },
  );

  test.fixme('a saved date default is shown as saved', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { defaultValue },
  }) => {
    await sheet.columnHeader('Published').click();
    await defaultValue.customDefault.check();
    await defaultValue.value.click();
    await page.keyboard.type('03/15/2024');
    await page.keyboard.press('Enter');
    await defaultValue.saveButton.click();

    await expect(defaultValue.saveButton).toHaveCount(0);
    await expect(defaultValue.value).toHaveValue('03/15/2024');
    expect(
      await storedColumn(books.schema, 'Books', 'Published'),
    ).toMatchObject({ default: "'2024-03-15'::date" });
  });

  test.describe('of a User column', () => {
    test.beforeEach(async ({ api, books }) => {
      await api.makeUserColumn(books, 'Owner');
    });

    test('sets a default user, picked from the list of users', async ({
      page,
      api,
      books,
      tablePage: { sheet },
      columnInspector: { defaultValue },
    }) => {
      await sheet.columnHeader('Owner').click();
      await expect(defaultValue.customDefault).toHaveCount(0);
      await defaultValue.defaultUser.check();
      await defaultValue.pickUserButton.click();
      await new RowSeeker(page).option(env.admin.username).click();
      await defaultValue.saveButton.click();

      await expect(defaultValue.saveButton).toHaveCount(0);
      await expect(defaultValue.root).toContainText(env.admin.username);
      const admin = await api.findUser(env.admin.username);
      expect(await storedColumn(books.schema, 'Books', 'Owner')).toMatchObject({
        default: String(admin?.id),
      });
    });
  });
});
