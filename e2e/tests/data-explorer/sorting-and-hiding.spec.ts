import { pinsKnownBug } from '../../support/known-bugs';
import { chooseOption } from '../../support/ui/components/select';
import {
  chooseColumn,
  selectOptions,
} from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

test.describe('a sort step', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages', 'Author');
    await dataExplorer.addTransformation('Sort');
  });

  test('starts on the first column in ascending order and can be reversed', async ({
    dataExplorer: { transformations, results },
  }) => {
    const sort = transformations.sort(1);
    await expect(transformations.stepHeaders).toHaveText(['1 Sort']);
    await expect(sort.column).toHaveText('Books_Title');
    await expect(sort.direction).toHaveText('A-Z');

    await chooseOption(sort.direction, 'Z-A');

    await results.expectRows([
      ['Untitled', 'NULL', 'NULL'],
      ['The Lathe of Heaven', '184', '1'],
      ['The Dispossessed', '387', '1'],
      ['Invisible Cities', '165', '2'],
      ['Ficciones', '203', '3'],
    ]);
  });

  test('sorts numbers with NULL as the largest value', async ({
    page,
    dataExplorer: { transformations, results },
  }) => {
    const sort = transformations.sort(1);
    await chooseColumn(sort.column, 'Books_Pages');
    await results.expectRows([
      ['Invisible Cities', '165', '2'],
      ['The Lathe of Heaven', '184', '1'],
      ['Ficciones', '203', '3'],
      ['The Dispossessed', '387', '1'],
      ['Untitled', 'NULL', 'NULL'],
    ]);
    await expect(await selectOptions(sort.direction)).toHaveText([
      '0-9',
      '9-0',
    ]);
    await page.keyboard.press('Escape');

    await chooseOption(sort.direction, '9-0');

    await expect(sort.direction).toHaveText('9-0');
    await results.expectRows([
      ['Untitled', 'NULL', 'NULL'],
      ['The Dispossessed', '387', '1'],
      ['Ficciones', '203', '3'],
      ['The Lathe of Heaven', '184', '1'],
      ['Invisible Cities', '165', '2'],
    ]);
  });

  test(
    'keeps the direction label of the previous column type after the column changes',
    pinsKnownBug('sort-direction-label-not-updated'),
    async ({ dataExplorer: { transformations, results } }) => {
      const sort = transformations.sort(1);
      await chooseColumn(sort.column, 'Books_Pages');
      await expect(results.sheet.cell(0, 'Books_Pages')).toHaveText('165');

      await expect(sort.direction).toHaveText('A-Z');
    },
  );

  test.fixme('names the direction after the type of the new column', async ({
    dataExplorer: { transformations, results },
  }) => {
    const sort = transformations.sort(1);
    await chooseColumn(sort.column, 'Books_Pages');
    await expect(results.sheet.cell(0, 'Books_Pages')).toHaveText('165');

    await expect(sort.direction).toHaveText('0-9');
  });

  test('is overruled by a later sort step and then only breaks ties', async ({
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    await chooseOption(transformations.sort(1).direction, 'Z-A');
    await results.expectLoaded();

    await dataExplorer.addTransformation('Sort');
    await chooseColumn(transformations.sort(2).column, 'Books_Author');

    await expect(transformations.stepHeaders).toHaveText(['1 Sort', '2 Sort']);
    await results.expectRows([
      ['The Lathe of Heaven', '184', '1'],
      ['The Dispossessed', '387', '1'],
      ['Invisible Cities', '165', '2'],
      ['Ficciones', '203', '3'],
      ['Untitled', 'NULL', 'NULL'],
    ]);
  });

  test('can be added once per column', async ({ page, dataExplorer }) => {
    const { transformations } = dataExplorer;
    await dataExplorer.addTransformation('Sort');
    await expect(transformations.sort(2).column).toHaveText('Books_Pages');
    await expect(
      await selectOptions(transformations.sort(2).column),
    ).toHaveText(['Books_Pages', 'Books_Author']);
    await page.keyboard.press('Escape');

    await dataExplorer.addTransformation('Sort');
    await expect(transformations.sort(3).column).toHaveText('Books_Author');

    await transformations.addStepButton.click();
    await expect(transformations.menuEntry('Sort')).toBeDisabled();
    await expect(transformations.menuEntry('Filter')).toBeEnabled();
  });
});

test.describe('a hide step', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages', 'Price');
    await dataExplorer.addTransformation('Hide');
  });

  test('takes the chosen columns out of the result', async ({
    dataExplorer: { transformations, results },
  }) => {
    const hide = transformations.hide(1);
    await expect(transformations.stepHeaders).toHaveText(['1 Hide']);
    await expect(results.sheet.columnHeaders).toHaveCount(3);

    await hide.columns.toggle('Books_Title', 'Books_Price');

    await expect(hide.columns.values).toHaveText([
      'Books_Title',
      'Books_Price',
    ]);
    await expect(results.sheet.columnHeaders).toHaveText(['Books_Pages']);
    await results.expectRows([['165'], ['184'], ['203'], ['387'], ['NULL']]);
  });

  test('shows a column again once it is taken off the list', async ({
    dataExplorer: { transformations, results },
  }) => {
    const hide = transformations.hide(1);
    await hide.columns.toggle('Books_Title', 'Books_Price');
    await expect(results.sheet.columnHeaders).toHaveText(['Books_Pages']);

    await hide.columns.removeButton('Books_Title').click();
    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Pages',
    ]);

    await hide.columns.clearButton.click();
    await expect(hide.columns.values).toHaveCount(0);
    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Pages',
      'Books_Price',
    ]);
  });

  test('shows every column when all of them are on the list', async ({
    dataExplorer: { transformations, results },
  }) => {
    const hide = transformations.hide(1);
    await hide.columns.toggle('Books_Title', 'Books_Pages');
    await expect(results.sheet.columnHeaders).toHaveText(['Books_Price']);

    await hide.columns.toggle('Books_Price');

    await expect(hide.columns.values).toHaveCount(3);
    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Pages',
      'Books_Price',
    ]);
  });

  test(
    'lets a later sort step start on a hidden column, which breaks the result',
    pinsKnownBug('sort-step-offers-hidden-column'),
    async ({ dataExplorer }) => {
      const { transformations, results } = dataExplorer;
      await transformations.hide(1).columns.toggle('Books_Title');
      await expect(results.sheet.columnHeaders).toHaveCount(2);

      await dataExplorer.transformations.addStep('Sort');

      await expect(transformations.sort(2).column).toHaveText('Books_Title');
      await expect(results.error).toContainText(
        'The result could not be displayed.',
      );
      await expect(results.error).toContainText(
        "SortFieldNotFound: 'Books_Title'",
      );
    },
  );

  test.fixme('starts a later sort step on a column that is still shown', async ({
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    await transformations.hide(1).columns.toggle('Books_Title');
    await expect(results.sheet.columnHeaders).toHaveCount(2);

    await dataExplorer.transformations.addStep('Sort');

    await expect(transformations.sort(2).column).toHaveText('Books_Pages');
    await expect(results.error).toHaveCount(0);
    await results.expectRows([
      ['165', '11'],
      ['184', '9.99'],
      ['203', '14.25'],
      ['387', '12.5'],
      ['NULL', 'NULL'],
    ]);
  });
});
