import { runSqlInSchema, uniqueName } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { chooseOption } from '../../support/ui/components/select';
import { explorationUrl } from '../../support/ui/pages/data-explorer-page';
import { expect, test } from './library';

test.describe('a saved exploration with a column that was dropped in PostgreSQL', () => {
  test.beforeEach(async ({ page, api, schema, library }) => {
    const { id } = await api.defineExploration(library.books, {
      name: uniqueName('Book lengths'),
      columns: ['Title', 'Pages'],
    });
    await runSqlInSchema(schema, 'ALTER TABLE "Books" DROP COLUMN "Pages"');
    await page.goto(explorationUrl(schema, id));
  });

  test(
    'shows an error from the server and no way to repair it',
    pinsKnownBug('exploration-dropped-column-no-recovery'),
    async ({ dataExplorer }) => {
      const { results } = dataExplorer;
      await expect(results.error).toHaveText(
        'The result could not be displayed. KeyError: None',
        { useInnerText: true },
      );
      await expect(results.recoveryButton).toHaveCount(0);
      await expect(results.refreshButton).toHaveText('Retry');
      await expect(results.sheet.columnHeaders).toHaveCount(0);
      await expect(dataExplorer.columns.baseColumnNames).toHaveText([
        'id',
        'Title',
        'Price',
        'Published',
        'In Stock',
        'Author',
      ]);
    },
  );

  test.fixme('offers to remove the missing column, which repairs the exploration', async ({
    dataExplorer: { results },
  }) => {
    await expect(results.error).toContainText(
      'Some of the columns present in the query are missing in the underlying base table.',
    );

    await results.recoveryButton.click();

    await expect(results.sheet.columnHeaders).toHaveText(['Books_Title']);
    await expect(results.sheet.recordRows).toHaveCount(5);
  });
});

test.describe('a saved exploration whose base table was dropped in PostgreSQL', () => {
  let name: string;
  let id: number;

  test.beforeEach(async ({ page, api, schema, library }) => {
    name = uniqueName('Borrowers');
    ({ id } = await api.defineExploration(library.loans, {
      name,
      columns: ['Borrower'],
    }));
    await runSqlInSchema(schema, 'DROP TABLE "Loans"');
    await page.goto(explorationUrl(schema, id));
  });

  test('shows errors in place of the result and of the column list', async ({
    dataExplorer,
  }) => {
    await expect(dataExplorer.heading).toHaveText(name);
    await expect(dataExplorer.baseTableLabel).toHaveText('Based on');
    await expect(dataExplorer.baseTableSelect).toBeVisible();
    await expect(dataExplorer.results.error).toContainText(
      'The result could not be displayed.',
    );
    await expect(dataExplorer.sidebar).toContainText(
      'Failed to fetch column information.',
    );
    await expect(dataExplorer.saveButton).toHaveCount(0);
    await expect(dataExplorer.inspector.name).toHaveValue(name);
  });

  test('can be based on another table and saved under the same address', async ({
    page,
    api,
    schema,
    library,
    dataExplorer,
  }) => {
    await expect(dataExplorer.results.error).toBeVisible();
    // A change before the column list has failed makes the app throw (rpc-batch-cancel-uncaught-error).
    await expect(dataExplorer.sidebar).toContainText(
      'Failed to fetch column information.',
    );

    await chooseOption(dataExplorer.baseTableSelect, 'Authors');
    await dataExplorer.addColumns('Name');
    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    await expect(page).toHaveURL(explorationUrl(schema, id));
    await expect(dataExplorer.heading).toHaveText(name);
    await dataExplorer.results.expectRows([
      ['Italo Calvino'],
      ['Jorge Borges'],
      ['Ursula Le Guin'],
    ]);
    expect(await api.findExploration(schema, name)).toMatchObject({
      id,
      baseTableOid: library.authors.oid,
      columns: [{ alias: 'Authors_Name' }],
    });
  });
});
