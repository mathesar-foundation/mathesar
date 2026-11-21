import type { Table } from '../../support/api/mathesar';
import { chooseColumn } from '../../support/ui/components/column-options';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { tableUrl } from '../../support/ui/urls';
import { expect, storedColumns, storedPrimaryKey, test } from './fixtures';

test.describe('primary key of an import', () => {
  let table: Table;

  test.beforeEach(async ({ openPreview }) => {
    table = await openPreview('coded-books.csv');
  });

  test('starts collapsed, with the integer column that Mathesar added', async ({
    previewPage,
  }) => {
    const { primaryKey } = previewPage;
    await expect(primaryKey.strategy).toBeHidden();

    await primaryKey.toggle.click();
    await expect(primaryKey.strategy).toHaveText(
      'Add a new primary key column',
    );
    await expect(primaryKey.columnType).toHaveText('Integer');
    await expect(primaryKey.defaultValue).toHaveText(
      'Auto-incrementing Identity',
    );
    await expect(primaryKey.updateButton).toBeHidden();
    await expect(primaryKey.discardButton).toBeHidden();
  });

  test('a UUID column replaces the integer column that Mathesar added', async ({
    page,
    previewPage,
    schema,
  }) => {
    const { primaryKey } = previewPage;
    await primaryKey.toggle.click();
    await chooseOption(primaryKey.columnType, 'UUID');
    await expect(primaryKey.defaultValue).toHaveText('Random UUIDv4');
    await primaryKey.updateButton.click();

    await previewPage.expectColumnsReloaded([
      ['Code', 'Number'],
      ['Title', 'Text'],
      ['Pages', 'Number'],
      ['id', 'UUID'],
    ]);
    await expect(primaryKey.strategy).toBeHidden();
    await expect(previewPage.column(3).included).toBeDisabled();

    await previewPage.confirmButton.click();
    await expect(page).toHaveURL(tableUrl(table));
    expect(await storedColumns(schema, 'coded-books')).toEqual([
      { name: 'Code', type: 'numeric' },
      { name: 'Title', type: 'text' },
      { name: 'Pages', type: 'numeric' },
      { name: 'id', type: 'uuid' },
    ]);
    expect(await storedPrimaryKey(schema, 'coded-books')).toEqual([
      { name: 'id', default: 'gen_random_uuid()', identity: null },
    ]);
  });

  test('a column of the file becomes the primary key in place of the added one', async ({
    page,
    previewPage,
    schema,
  }) => {
    const { primaryKey } = previewPage;
    await primaryKey.toggle.click();
    await chooseOption(
      primaryKey.strategy,
      'Choose an existing column for the primary key',
    );
    await expect(primaryKey.column).toHaveText('Code');
    await expect(primaryKey.defaultValue).toHaveText(
      'Auto-incrementing Identity',
    );
    await primaryKey.updateButton.click();

    await previewPage.expectColumnsReloaded([
      ['Code', 'Number'],
      ['Title', 'Text'],
      ['Pages', 'Number'],
    ]);
    await expect(previewPage.column(0).included).toBeDisabled();
    await primaryKey.toggle.click();
    await expect(primaryKey.strategy).toHaveText(
      'Choose an existing column for the primary key',
    );

    await previewPage.confirmButton.click();
    await expect(page).toHaveURL(tableUrl(table));
    expect(await storedPrimaryKey(schema, 'coded-books')).toEqual([
      { name: 'Code', default: null, identity: 'BY DEFAULT' },
    ]);
  });

  test('a text column can only become a primary key without a default, with a warning', async ({
    previewPage,
  }) => {
    const { primaryKey } = previewPage;
    await primaryKey.toggle.click();
    await chooseOption(
      primaryKey.strategy,
      'Choose an existing column for the primary key',
    );
    await expect(primaryKey.noDefaultWarning).toBeHidden();
    await chooseColumn(primaryKey.column, 'Title');

    await expect(primaryKey.defaultValue).toHaveText('No default');
    await expect(primaryKey.noDefaultWarning).toBeVisible();
    const defaultValues = await openSelect(primaryKey.defaultValue);
    await expect(defaultValues.getByRole('option')).toHaveText(['No default']);
  });

  test('Discard Changes restores the added column', async ({ previewPage }) => {
    const { primaryKey } = previewPage;
    await primaryKey.toggle.click();
    await chooseOption(primaryKey.columnType, 'UUID');
    await primaryKey.discardButton.click();

    await expect(primaryKey.columnType).toHaveText('Integer');
    await expect(primaryKey.defaultValue).toHaveText(
      'Auto-incrementing Identity',
    );
    await expect(primaryKey.updateButton).toBeHidden();
    await expect(primaryKey.discardButton).toBeHidden();
  });
});
