import { uniqueName } from '../../support/api/mathesar';
import { recordRpcCalls } from '../../support/rpc-log';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { chooseOption } from '../../support/ui/components/select';
import { chooseColumn } from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

test.describe('the steps of "Transform Results"', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
  });

  test('cannot be added before the exploration has a column', async ({
    dataExplorer,
  }) => {
    await dataExplorer.transformResultsTab.click();

    await expect(dataExplorer.sidebarIntroduction).toHaveText(
      'Transformations can be used to summarize data, filter data, and more. Note that transformations are applied in the order they are listed.',
    );
    await expect(dataExplorer.transformations.addStepButton).toBeDisabled();

    await dataExplorer.selectColumnsTab.click();
    await dataExplorer.addColumns('Title');
    await dataExplorer.transformResultsTab.click();
    await expect(dataExplorer.transformations.addStepButton).toBeEnabled();
  });

  test('are applied in the order of the list', async ({ dataExplorer }) => {
    const { transformations, results } = dataExplorer;
    await dataExplorer.addColumns('Author', 'Pages');
    await dataExplorer.addTransformation('Filter');
    const filter = transformations.filter(1);
    await chooseColumn(filter.column, 'Books_Pages');
    await chooseOption(filter.condition, 'is greater than');
    await fillFormattedInput(filter.value, '190');
    await expect(results.sheet.recordRows).toHaveCount(2);

    await dataExplorer.addTransformation('Summarize');

    await expect(transformations.stepHeaders).toHaveText([
      '1 Filter',
      '2 Summarization',
    ]);
    // Only the books that passed the filter are summarized.
    await results.expectRows([
      ['1', '387'],
      ['3', '203'],
    ]);
  });

  test('can only be deleted from the end, which restores the result before the step', async ({
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    await dataExplorer.addColumns('Title');
    await dataExplorer.addTransformation('Filter');
    await transformations.filter(1).value.fill('the');
    await expect(results.sheet.recordRows).toHaveCount(2);
    await dataExplorer.addTransformation('Sort');
    await chooseOption(transformations.sort(2).direction, 'Z-A');
    await results.expectRows([['The Lathe of Heaven'], ['The Dispossessed']]);
    await expect(transformations.filter(1).deleteButton).toHaveCount(0);

    await transformations.sort(2).deleteButton.click();
    await expect(transformations.stepHeaders).toHaveText(['1 Filter']);
    await results.expectRows([['The Dispossessed'], ['The Lathe of Heaven']]);

    await transformations.filter(1).deleteButton.click();
    await expect(transformations.stepHeaders).toHaveCount(0);
    await expect(results.sheet.recordRows).toHaveCount(5);
  });

  test('fold away with a click on their header', async ({ dataExplorer }) => {
    const { transformations } = dataExplorer;
    await dataExplorer.addColumns('Title');
    await dataExplorer.addTransformation('Filter');
    const filter = transformations.filter(1);
    await expect(filter.value).toBeVisible();

    await filter.header.click();
    await expect(filter.value).toBeHidden();

    await filter.header.click();
    await expect(filter.value).toBeVisible();
  });
});

test('the steps of a saved exploration show what was saved and run nothing until one changes', async ({
  page,
  api,
  library,
  dataExplorer,
}) => {
  const { transformations, results } = dataExplorer;
  const { id } = await api.defineExploration(library.books, {
    name: uniqueName('Pages by author'),
    columns: ['Title', 'Author', 'Pages', 'Price'],
    transformations: [
      {
        type: 'filter',
        spec: {
          contains_case_insensitive: [
            { column_name: ['Books_Title'] },
            { literal: ['the'] },
          ],
        },
      },
      { type: 'order', spec: [{ field: 'Books_Pages', direction: 'desc' }] },
      { type: 'hide', spec: ['Books_Price'] },
      {
        type: 'summarize',
        spec: {
          base_grouping_column: 'Books_Author',
          grouping_expressions: [
            {
              input_alias: 'Books_Author',
              output_alias: 'Books_Author_grouped',
            },
          ],
          aggregation_expressions: [
            {
              function: 'distinct_aggregate_to_array',
              input_alias: 'Books_Title',
              output_alias: 'Books_Title_agged',
            },
            {
              function: 'sum',
              input_alias: 'Books_Pages',
              output_alias: 'Books_Pages_agged',
            },
          ],
        },
      },
    ],
  });
  await dataExplorer.gotoSaved(library.books.schema, id);
  const calls = recordRpcCalls(page);

  await dataExplorer.transformResultsTab.click();

  await expect(transformations.stepHeaders).toHaveText([
    '1 Filter',
    '2 Sort',
    '3 Hide',
    '4 Summarization',
  ]);
  await expect(transformations.filter(1).column).toHaveText('Books_Title');
  await expect(transformations.filter(1).value).toHaveValue('the');
  await expect(transformations.sort(2).column).toHaveText('Books_Pages');
  await expect(transformations.sort(2).direction).toHaveText('9-0');
  await expect(transformations.hide(3).columns.values).toHaveText([
    'Books_Price',
  ]);
  const summarization = transformations.summarize(4);
  await expect(summarization.groupColumn).toHaveText('Books_Author');
  await expect(summarization.aggregations).toHaveText([
    'Books_Title as List',
    'Books_Pages as Sum',
  ]);
  await expect(dataExplorer.saveButton).toBeDisabled();

  await chooseOption(summarization.aggregationFunction('Books_Pages'), 'Max');

  await results.expectRows([
    ['1', 'The Dispossessed The Lathe of Heaven', '387'],
  ]);
  expect(calls).toEqual(['explorations.run']);
  await expect(dataExplorer.unsavedMark).toBeVisible();
});
