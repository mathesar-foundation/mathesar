import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { chooseOption } from '../../support/ui/components/select';
import {
  chooseColumn,
  selectOptions,
} from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

const ALL_BOOKS = [
  ['Ficciones', '203', '06/20/1944'],
  ['Invisible Cities', '165', '11/03/1972'],
  ['The Dispossessed', '387', '05/01/1974'],
  ['The Lathe of Heaven', '184', '03/15/1971'],
  ['Untitled', 'NULL', 'NULL'],
];

// The fourth column, "In Stock", is a checkbox and adds no text to a row.
test.describe('a filter step', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages', 'Published', 'In Stock');
    await dataExplorer.addTransformation('Filter');
  });

  test('starts on the first column and keeps the rows that contain the typed text', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await expect(transformations.stepHeaders).toHaveText(['1 Filter']);
    await expect(filter.column).toHaveText('Books_Title');
    await expect(filter.condition).toHaveText('contains');
    await results.expectRows(ALL_BOOKS);

    await filter.value.fill('THE');

    await results.expectRows([
      ['The Dispossessed', '387', '05/01/1974'],
      ['The Lathe of Heaven', '184', '03/15/1971'],
    ]);
    await expect(results.statusBar).toContainText('Showing 1–2 of 2');
  });

  test('offers the conditions that suit the type of the column', async ({
    page,
    dataExplorer: { transformations },
  }) => {
    const filter = transformations.filter(1);
    const emptiness = ['is empty', 'is not empty'];
    const conditionsByColumn = {
      Books_Title: ['contains', 'starts with', 'equals', ...emptiness],
      Books_Pages: [
        'equals',
        ...emptiness,
        'is lesser than',
        'is greater than',
        'is lesser or equal to',
        'is greater or equal to',
      ],
      Books_Published: [
        'is same as',
        ...emptiness,
        'is before',
        'is after',
        'is before or same as',
        'is after or same as',
      ],
      'Books_In Stock': ['equals', ...emptiness],
    };

    for (const [column, conditions] of Object.entries(conditionsByColumn)) {
      await chooseColumn(filter.column, column);
      await expect(await selectOptions(filter.condition)).toHaveText(
        conditions,
      );
      await page.keyboard.press('Escape');
    }
  });

  test('compares numbers', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await chooseColumn(filter.column, 'Books_Pages');
    await chooseOption(filter.condition, 'is greater than');
    await fillFormattedInput(filter.value, '200');

    await results.expectRows([
      ['Ficciones', '203', '06/20/1944'],
      ['The Dispossessed', '387', '05/01/1974'],
    ]);
  });

  test('compares dates that are typed into the date input', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await chooseColumn(filter.column, 'Books_Published');
    await chooseOption(filter.condition, 'is before');
    await fillFormattedInput(filter.value, '1972-01-01');
    await filter.value.press('Tab');

    await expect(filter.value).toHaveValue('01/01/1972');
    await results.expectRows([
      ['Ficciones', '203', '06/20/1944'],
      ['The Lathe of Heaven', '184', '03/15/1971'],
    ]);
  });

  test('matches a boolean that is chosen from a list', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await chooseColumn(filter.column, 'Books_In Stock');
    await expect(filter.condition).toHaveText('equals');
    await chooseOption(filter.value, 'false');

    await results.expectRows([['The Lathe of Heaven', '184', '03/15/1971']]);
    await expect(results.checkbox(0, 'Books_In Stock')).not.toBeChecked();
  });

  test('needs no value for "is empty"', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await chooseColumn(filter.column, 'Books_Pages');
    await chooseOption(filter.condition, 'is empty');

    await expect(filter.value).toHaveCount(0);
    await results.expectRows([['Untitled', 'NULL', 'NULL']]);
  });

  test('loses its value when the column changes and then filters nothing', async ({
    dataExplorer: { transformations, results },
  }) => {
    const filter = transformations.filter(1);
    await filter.value.fill('the');
    await expect(results.sheet.recordRows).toHaveCount(2);

    await chooseColumn(filter.column, 'Books_Pages');

    await expect(filter.condition).toHaveText('equals');
    await expect(filter.value).toHaveValue('');
    await results.expectRows(ALL_BOOKS);
  });

  test('is narrowed further by a second filter step', async ({
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    await transformations.filter(1).value.fill('the');
    await expect(results.sheet.recordRows).toHaveCount(2);

    await dataExplorer.addTransformation('Filter');
    const second = transformations.filter(2);
    await chooseColumn(second.column, 'Books_Pages');
    await chooseOption(second.condition, 'is greater than');
    await fillFormattedInput(second.value, '200');

    await expect(transformations.stepHeaders).toHaveText([
      '1 Filter',
      '2 Filter',
    ]);
    await results.expectRows([['The Dispossessed', '387', '05/01/1974']]);
  });
});
