import { pinsKnownBug } from '../../support/known-bugs';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { chooseOption } from '../../support/ui/components/select';
import type { DataExplorerPage } from '../../support/ui/pages/data-explorer-page';
import {
  type SummarizeStep,
  chooseColumn,
  selectOptions,
} from '../../support/ui/pages/exploration-transformations';
import { type Library, expect, test } from './library';

/** Explores "Books" with these columns and summarizes by the first one. */
async function summarizeBooks(
  dataExplorer: DataExplorerPage,
  library: Library,
  ...columns: string[]
): Promise<SummarizeStep> {
  await dataExplorer.explore(library.books);
  await dataExplorer.addColumns(...columns);
  await dataExplorer.addTransformation('Summarize');
  return dataExplorer.transformations.summarize(1);
}

test.describe('a summarization', () => {
  test('groups by the first column and lists the distinct values of the others', async ({
    library,
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'Pages',
    );

    await expect(transformations.stepHeaders).toHaveText(['1 Summarization']);
    await expect(summarization.groupColumn).toHaveText('Books_Author');
    await expect(summarization.aggregations).toHaveText([
      'Books_Title as List',
      'Books_Pages as List',
    ]);
    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Author',
      'Books_Title distinct list',
      'Books_Pages distinct list',
    ]);
    await results.expectRows([
      ['1', 'The Dispossessed The Lathe of Heaven', '184 387'],
      ['2', 'Invisible Cities', '165'],
      ['3', 'Ficciones', '203'],
      ['NULL', 'Untitled', 'NULL'],
    ]);
  });

  test('offers the functions that suit the type of each column', async ({
    page,
    library,
    dataExplorer,
  }) => {
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'Pages',
      'Published',
    );
    const functionsByColumn = {
      Books_Title: ['List', 'Count', 'Median', 'Mode', 'Max', 'Min'],
      Books_Pages: [
        'List',
        'Count',
        'Sum',
        'Median',
        'Mode',
        'Max',
        'Min',
        'Mean',
      ],
      Books_Published: [
        'List',
        'Count',
        'Median',
        'Mode',
        'Max',
        'Min',
        'Peak month',
      ],
    };

    for (const [column, functions] of Object.entries(functionsByColumn)) {
      await expect(
        await selectOptions(summarization.aggregationFunction(column)),
      ).toHaveText(functions);
      await page.keyboard.press('Escape');
    }
  });

  test('counts, adds up, averages and finds the smallest value and the share of true', async ({
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'Pages',
      'Price',
      'Published',
      'In Stock',
    );

    const functionByColumn = {
      Books_Title: 'Count',
      Books_Pages: 'Sum',
      Books_Price: 'Mean',
      Books_Published: 'Min',
      'Books_In Stock': 'Percentage True',
    };
    for (const [column, name] of Object.entries(functionByColumn)) {
      await chooseOption(summarization.aggregationFunction(column), name);
    }

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Author',
      'Books_Title count',
      'Books_Pages sum',
      'Books_Price mean',
      'Books_Published min',
      'Books_In Stock percentage true',
    ]);
    await results.expectRows([
      ['1', '2', '571', '11.245', '03/15/1971', '50'],
      ['2', '1', '165', '11', '11/03/1972', '100'],
      ['3', '1', '203', '14.25', '06/20/1944', '100'],
      ['NULL', '1', 'NULL', 'NULL', 'NULL', 'NULL'],
    ]);
  });

  test('finds the largest, the middle and the most frequent value and the peak month', async ({
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'Pages',
      'Price',
      'Published',
    );

    const functionByColumn = {
      Books_Title: 'Max',
      Books_Pages: 'Median',
      Books_Price: 'Mode',
      Books_Published: 'Peak month',
    };
    for (const [column, name] of Object.entries(functionByColumn)) {
      await chooseOption(summarization.aggregationFunction(column), name);
    }

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Author',
      'Books_Title max',
      'Books_Pages median',
      'Books_Price mode',
      'Books_Published peak_month',
    ]);
    await results.expectRows([
      ['1', 'The Lathe of Heaven', '184', '9.99', '4'],
      ['2', 'Invisible Cities', '165', '11', '11'],
      ['3', 'Ficciones', '203', '14.25', '6'],
      ['NULL', 'Untitled', 'NULL', 'NULL', 'NULL'],
    ]);
  });

  test(
    'offers "Max" for a boolean column, which PostgreSQL cannot compute',
    pinsKnownBug('summarize-boolean-max-min-fails'),
    async ({ page, library, dataExplorer }) => {
      const summarization = await summarizeBooks(
        dataExplorer,
        library,
        'Author',
        'In Stock',
      );
      const inStock = summarization.aggregationFunction('Books_In Stock');
      await expect(await selectOptions(inStock)).toHaveText([
        'List',
        'Count',
        'Median',
        'Mode',
        'Percentage True',
        'Max',
        'Min',
      ]);
      await page.keyboard.press('Escape');

      await chooseOption(inStock, 'Max');

      await expect(dataExplorer.results.error).toContainText(
        'function max(boolean) does not exist',
      );
    },
  );

  test.fixme('offers only functions that work for a boolean column', async ({
    library,
    dataExplorer,
  }) => {
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'In Stock',
    );

    await expect(
      await selectOptions(summarization.aggregationFunction('Books_In Stock')),
    ).toHaveText(['List', 'Count', 'Median', 'Mode', 'Percentage True']);
  });

  test('also groups by a column that is taken out of the aggregations', async ({
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'In Stock',
    );
    await expect(summarization.notAggregated.trigger).toHaveCount(0);

    await summarization.stopAggregatingButton('Books_In Stock').click();

    await expect(summarization.notAggregated.values).toHaveText([
      'Books_In Stock',
    ]);
    await expect(summarization.aggregations).toHaveText([
      'Books_Title as List',
    ]);
    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Author',
      'Books_In Stock',
      'Books_Title distinct list',
    ]);
    await results.expectRows([
      ['1', 'The Lathe of Heaven'],
      ['1', 'The Dispossessed'],
      ['2', 'Invisible Cities'],
      ['3', 'Ficciones'],
      ['NULL', 'Untitled'],
    ]);
    await expect(results.checkbox(0, 'Books_In Stock')).not.toBeChecked();
    await expect(results.checkbox(1, 'Books_In Stock')).toBeChecked();
  });

  test('aggregates a column as a list again once it is no longer grouped by', async ({
    library,
    dataExplorer,
  }) => {
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
      'In Stock',
    );
    await summarization.stopAggregatingButton('Books_In Stock').click();
    await expect(dataExplorer.results.sheet.recordRows).toHaveCount(5);

    await summarization.notAggregated.removeButton('Books_In Stock').click();

    await expect(summarization.notAggregated.trigger).toHaveCount(0);
    await expect(summarization.aggregations).toHaveText([
      'Books_Title as List',
      'Books_In Stock as List',
    ]);
    await expect(dataExplorer.results.sheet.recordRows).toHaveCount(4);
  });

  test.describe('with a column picked in "Not Aggregated"', () => {
    let summarization: SummarizeStep;

    test.beforeEach(async ({ library, dataExplorer }) => {
      summarization = await summarizeBooks(
        dataExplorer,
        library,
        'Author',
        'Title',
        'Pages',
        'In Stock',
      );
      await summarization.stopAggregatingButton('Books_In Stock').click();
      await chooseOption(
        summarization.aggregationFunction('Books_Pages'),
        'Sum',
      );
      await dataExplorer.results.expectLoaded();

      await summarization.notAggregated.toggle('Books_Title');
    });

    test(
      'keeps aggregating that column and resets the functions of the others to "List"',
      pinsKnownBug('summarize-not-aggregated-picker-resets-aggregations'),
      async ({ dataExplorer: { results } }) => {
        await expect(summarization.notAggregated.values).toHaveText([
          'Books_In Stock',
          'Books_Title',
        ]);
        await expect(summarization.aggregations).toHaveText([
          'Books_Title as List',
          'Books_Pages as List',
        ]);
        await expect(results.sheet.columnHeaders).toHaveText([
          'Books_Author',
          'Books_In Stock',
          'Books_Title',
          'Books_Title distinct list',
          'Books_Pages distinct list',
        ]);
      },
    );

    test.fixme('moves that column out of the aggregations and leaves the others as they are', async ({
      dataExplorer: { results },
    }) => {
      await expect(summarization.notAggregated.values).toHaveText([
        'Books_In Stock',
        'Books_Title',
      ]);
      await expect(summarization.aggregations).toHaveText([
        'Books_Pages as Sum',
      ]);
      await expect(results.sheet.columnHeaders).toHaveText([
        'Books_Author',
        'Books_In Stock',
        'Books_Title',
        'Books_Pages sum',
      ]);
    });
  });

  test('groups dates by year or by month', async ({
    page,
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Published',
      'Title',
    );
    await expect(summarization.grouping).toHaveText('Value');
    await expect(await selectOptions(summarization.grouping)).toHaveText([
      'Value',
      'Year',
      'Year, Month',
    ]);
    await page.keyboard.press('Escape');

    await chooseOption(summarization.grouping, 'Year');
    await results.expectRows([
      ['1944', 'Ficciones'],
      ['1971', 'The Lathe of Heaven'],
      ['1972', 'Invisible Cities'],
      ['1974', 'The Dispossessed'],
      ['NULL', 'Untitled'],
    ]);

    await chooseOption(summarization.grouping, 'Year, Month');
    await results.expectRows([
      ['1944-06', 'Ficciones'],
      ['1971-03', 'The Lathe of Heaven'],
      ['1972-11', 'Invisible Cities'],
      ['1974-05', 'The Dispossessed'],
      ['NULL', 'Untitled'],
    ]);
  });

  test('starts over when another column is grouped by', async ({
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Published',
      'Author',
      'Title',
    );
    await chooseOption(summarization.grouping, 'Year');
    await chooseOption(
      summarization.aggregationFunction('Books_Title'),
      'Count',
    );
    await results.expectLoaded();

    await chooseColumn(summarization.groupColumn, 'Books_Author');

    await expect(summarization.grouping).toHaveCount(0);
    await expect(summarization.aggregations).toHaveText([
      'Books_Published as List',
      'Books_Title as List',
    ]);
    await results.expectRows([
      ['1', '03/15/1971 05/01/1974', 'The Dispossessed The Lathe of Heaven'],
      ['2', '11/03/1972', 'Invisible Cities'],
      ['3', '06/20/1944', 'Ficciones'],
      ['NULL', 'NULL', 'Untitled'],
    ]);
  });

  test('can be added once per exploration', async ({
    library,
    dataExplorer,
  }) => {
    await summarizeBooks(dataExplorer, library, 'Author', 'Title');

    await dataExplorer.transformations.addStepButton.click();

    await expect(
      dataExplorer.transformations.menuEntry('Summarize'),
    ).toBeDisabled();
  });

  test('takes in a column that is added later, as a list', async ({
    library,
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
    );
    await dataExplorer.selectColumnsTab.click();
    await dataExplorer.addColumns('Pages');

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Author',
      'Books_Title distinct list',
      'Books_Pages distinct list',
    ]);
    await dataExplorer.transformResultsTab.click();
    await expect(summarization.aggregations).toHaveText([
      'Books_Title as List',
      'Books_Pages as List',
    ]);
  });

  test('shows in the inspector which column an aggregated column comes from', async ({
    library,
    dataExplorer,
  }) => {
    const { results, inspector } = dataExplorer;
    await summarizeBooks(dataExplorer, library, 'Author', 'Title');

    await results.columnHeaderButton('Books_Title distinct list').click();

    await expect(inspector.name).toHaveValue('Books_Title distinct list');
    await expect(inspector.aggregationSource).toHaveText(
      'Aggregated from Books_Title',
      { useInnerText: true },
    );
    await expect(inspector.columnSource).toHaveText(
      'Source Column Title from Books',
      { useInnerText: true },
    );
    await expect(inspector.removeColumnButton).toBeDisabled();
  });

  test('is locked while a later step works on its columns', async ({
    page,
    library,
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    const summarization = await summarizeBooks(
      dataExplorer,
      library,
      'Author',
      'Title',
    );
    await chooseOption(
      summarization.aggregationFunction('Books_Title'),
      'Count',
    );
    await results.expectLoaded();

    await dataExplorer.addTransformation('Filter');
    const filter = transformations.filter(2);

    await expect(summarization.groupColumn).toBeDisabled();
    await expect(
      summarization.aggregationFunction('Books_Title'),
    ).toBeDisabled();
    await expect(
      summarization.stopAggregatingButton('Books_Title'),
    ).toBeDisabled();
    await expect(await selectOptions(filter.column)).toHaveText([
      'Books_Author',
      'Books_Title count',
    ]);
    await page.keyboard.press('Escape');

    await chooseColumn(filter.column, 'Books_Title count');
    await chooseOption(filter.condition, 'is greater than');
    await fillFormattedInput(filter.value, '1');

    await results.expectRows([['1', '2']]);
  });
});
