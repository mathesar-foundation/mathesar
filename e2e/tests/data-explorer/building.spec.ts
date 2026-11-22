import { pinsKnownBug } from '../../support/known-bugs';
import { dataExplorerUrl } from '../../support/ui/pages/data-explorer-page';
import { selectOptions } from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

test.describe('the base table of a new exploration', () => {
  test('is chosen from the tables of the schema', async ({
    library,
    dataExplorer,
  }) => {
    await dataExplorer.goto(library.books.schema);

    await expect(await selectOptions(dataExplorer.baseTableSelect)).toHaveText([
      'Authors',
      'Books',
      'Loans',
    ]);
  });

  test('has a help text that explains it', async ({
    library,
    dataExplorer,
  }) => {
    await dataExplorer.goto(library.books.schema);
    await dataExplorer.baseTableHelp.hover();

    await expect(dataExplorer.tooltip).toHaveText(
      'The base table is the table that is being explored and determines the columns that are available for exploration.',
    );
  });

  test('once chosen, lists its columns and asks for a first one', async ({
    page,
    library,
    dataExplorer,
  }) => {
    await dataExplorer.explore(library.books);

    await expect(page).toHaveURL(dataExplorerUrl(library.books.schema));
    await expect(dataExplorer.baseTableName).toHaveText('Books');
    await expect(dataExplorer.baseTableSelect).toHaveCount(0);
    await expect(dataExplorer.columns.baseColumnNames).toHaveText([
      'id',
      'Title',
      'Pages',
      'Price',
      'Published',
      'In Stock',
      'Author',
    ]);
    await expect(
      dataExplorer.columns.section('From Related Tables'),
    ).toContainText(
      'At least one column from the base table is required to add columns from related tables.',
    );
    await expect(dataExplorer.addColumnsHint).toBeVisible();
    await expect(dataExplorer.saveButton).toBeDisabled();
    await expect(dataExplorer.exportButton).toBeDisabled();
    await expect(dataExplorer.inspectorToggle).toBeDisabled();
  });

  test('"Start Over" drops the columns and asks for a base table again', async ({
    library,
    dataExplorer,
  }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title');

    await dataExplorer.startOverButton.click();

    await expect(dataExplorer.baseTableSelect).toBeVisible();
    await expect(dataExplorer.chooseTableHint).toBeVisible();
    await expect(dataExplorer.results.sheet.columnHeaders).toHaveCount(0);
    await expect(dataExplorer.saveButton).toHaveCount(0);
  });
});

test.describe('columns of the base table', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
  });

  test('join the result in the order they are added, named after table and column', async ({
    dataExplorer,
  }) => {
    const { results, inspector } = dataExplorer;
    await dataExplorer.addColumns('Pages', 'Title');

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Pages',
      'Books_Title',
    ]);
    await results.expectRows([
      ['165', 'Invisible Cities'],
      ['184', 'The Lathe of Heaven'],
      ['203', 'Ficciones'],
      ['387', 'The Dispossessed'],
      ['NULL', 'Untitled'],
    ]);
    await expect(results.selectedColumnHeaders).toHaveText(['Books_Title']);
    await expect(inspector.selectedTab).toHaveText('Column');
    await expect(inspector.name).toHaveValue('Books_Title');
    await expect(inspector.columnSource).toHaveText(
      'Source Column Title from Books',
      { useInnerText: true },
    );
    await expect(dataExplorer.unsavedMark).toBeVisible();
    await expect(
      dataExplorer.columns.section('References From Base Table'),
    ).toBeVisible();
    await expect(
      dataExplorer.columns.section('References To Base Table'),
    ).toBeVisible();
  });

  test('can be added twice, which numbers the copy and counts the uses', async ({
    dataExplorer,
  }) => {
    const { columns, results } = dataExplorer;
    await dataExplorer.addColumns('Title');
    await expect(columns.usageCount('Title')).toHaveText('1');
    await expect(columns.usageCount('Pages')).toHaveCount(0);

    await dataExplorer.addColumns('Title');

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Title_1',
    ]);
    await expect(columns.usageCount('Title')).toHaveText('2');
    await columns.usageCount('Title').hover();
    await expect(dataExplorer.tooltip).toHaveText(
      'This column has been added 2 times.',
    );
  });
});

test.describe('columns of linked tables', () => {
  test('a table that the base table references adds its value to each row', async ({
    library,
    dataExplorer,
  }) => {
    const { columns, results, inspector } = dataExplorer;
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title');
    const authors = columns.linkedTable('Authors', 'Author');
    await authors.toggle.click();
    await expect(authors.columnNames).toHaveText(['id', 'Name', 'Country']);

    await authors.column('Name').click();

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Authors_Name',
    ]);
    await results.expectRows([
      ['Ficciones', 'Jorge Borges'],
      ['Invisible Cities', 'Italo Calvino'],
      ['The Dispossessed', 'Ursula Le Guin'],
      ['The Lathe of Heaven', 'Ursula Le Guin'],
      ['Untitled', 'NULL'],
    ]);
    await expect(inspector.name).toHaveValue('Authors_Name');
    await expect(inspector.columnSource).toHaveText(
      'Source Column Name from Authors',
      { useInnerText: true },
    );
  });

  test('a column is reached through two foreign keys in a row', async ({
    library,
    dataExplorer,
  }) => {
    const { columns, results } = dataExplorer;
    await dataExplorer.explore(library.loans);
    await dataExplorer.addColumns('Borrower');
    const books = columns.linkedTable('Books', 'Book');
    const authors = columns.linkedTable('Authors', 'Author');
    await books.toggle.click();
    await authors.toggle.click();

    await authors.column('Name').click();

    await expect(results.sheet.columnHeaders).toHaveText([
      'Loans_Borrower',
      'Authors_Name',
    ]);
    await results.expectRows([
      ['Ana', 'Ursula Le Guin'],
      ['Ben', 'Ursula Le Guin'],
      ['Cy', 'Italo Calvino'],
    ]);
  });

  test('a linked table stays unfolded while the other tab of the panel is open', async ({
    library,
    dataExplorer,
  }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title');
    const authors = dataExplorer.columns.linkedTable('Authors', 'Author');
    await expect(authors.column('Name')).toBeHidden();
    await authors.toggle.click();
    await expect(authors.column('Name')).toBeVisible();

    await dataExplorer.transformResultsTab.click();
    await dataExplorer.selectColumnsTab.click();

    await expect(authors.column('Name')).toBeVisible();
  });
});

test('the only column of the base table cannot be removed while a column of a linked table is left', async ({
  library,
  dataExplorer,
}) => {
  const { results, inspector, columns } = dataExplorer;
  await dataExplorer.explore(library.books);
  await dataExplorer.addColumns('Title');
  const authors = columns.linkedTable('Authors', 'Author');
  await authors.toggle.click();
  await authors.column('Name').click();
  await results.expectLoaded();

  await results.columnHeaderButton('Books_Title').click();
  await expect(inspector.removeColumnButton).toBeDisabled();
  await inspector.removeColumnHelp.hover();
  await expect(dataExplorer.tooltip).toHaveText(
    'This column cannot be deleted because at least one column from the base table is required. Please add another column from the base table before deleting this column.',
  );

  await results.columnHeaderButton('Authors_Name').click();
  await expect(inspector.removeColumnButton).toBeEnabled();
});

test.describe('columns of tables that reference the base table', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title');
    const loans = dataExplorer.columns.linkedTable('Loans', 'Book');
    await loans.toggle.click();
    await expect(loans.columnNames).toHaveText(['id', 'Borrower', 'Due']);
    await loans.column('Borrower').click();
  });

  test('ask whether to summarize, since a row can have several values', async ({
    dataExplorer: { summarizeModal },
  }) => {
    await expect(summarizeModal.title).toHaveText(
      'Summarize the Borrower column?',
    );
    await expect(summarizeModal.body).toContainText(
      'By default, Mathesar shows only one related record per row when adding a column with multiple related records.',
    );
    await expect(
      summarizeModal.button('No, continue without summarizing'),
    ).toBeFocused();
  });

  test('without a summary, repeat the row for each value', async ({
    dataExplorer: { summarizeModal, results, inspector, selectColumnsTab },
  }) => {
    await summarizeModal.button('No, continue without summarizing').click();

    await summarizeModal.expectClosed();
    await results.expectRows([
      ['Ficciones', 'NULL'],
      ['Invisible Cities', 'Cy'],
      ['The Dispossessed', 'Ana'],
      ['The Dispossessed', 'Ben'],
      ['The Lathe of Heaven', 'NULL'],
      ['Untitled', 'NULL'],
    ]);
    await expect(selectColumnsTab).toHaveAttribute('aria-selected', 'true');
    await expect(inspector.columnSource).toHaveText(
      'Source Column Borrower from Loans',
      { useInnerText: true },
    );
  });

  test(
    'are named after the base table instead of their own table',
    pinsKnownBug('referencing-table-column-named-after-base-table'),
    async ({ dataExplorer: { summarizeModal, results } }) => {
      await summarizeModal.button('No, continue without summarizing').click();

      await expect(results.sheet.columnHeaders).toHaveText([
        'Books_Title',
        'Books_Borrower',
      ]);
    },
  );

  test.fixme('are named after their own table', async ({
    dataExplorer: { summarizeModal, results },
  }) => {
    await summarizeModal.button('No, continue without summarizing').click();

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Loans_Borrower',
    ]);
  });

  test('summarized as a list, show all values in the row of the first column', async ({
    dataExplorer: {
      summarizeModal,
      results,
      transformations,
      transformResultsTab,
    },
  }) => {
    await summarizeModal.button('Yes, summarize as a list').click();

    await summarizeModal.expectClosed();
    await results.expectRows([
      ['Ficciones', 'NULL'],
      ['Invisible Cities', 'Cy'],
      ['The Dispossessed', 'Ana Ben'],
      ['The Lathe of Heaven', 'NULL'],
      ['Untitled', 'NULL'],
    ]);
    await expect(transformResultsTab).toHaveAttribute('aria-selected', 'true');
    await expect(transformations.stepHeaders).toHaveText(['1 Summarization']);
    await expect(transformations.summarize(1).groupColumn).toHaveText(
      'Books_Title',
    );
  });

  test('are added as a list without a question once the exploration is summarized', async ({
    dataExplorer,
  }) => {
    const { summarizeModal, results, columns } = dataExplorer;
    await summarizeModal.button('Yes, summarize as a list').click();
    await results.expectLoaded();
    await dataExplorer.selectColumnsTab.click();

    await columns.linkedTable('Loans', 'Book').column('Due').click();

    await summarizeModal.expectClosed();
    await results.expectRows([
      ['Ficciones', 'NULL', 'NULL'],
      ['Invisible Cities', 'Cy', '03/12/2024'],
      ['The Dispossessed', 'Ana Ben', '01/10/2024 02/11/2024'],
      ['The Lathe of Heaven', 'NULL', 'NULL'],
      ['Untitled', 'NULL', 'NULL'],
    ]);
  });

  test('are not added when the question is closed, which Escape does not do', async ({
    page,
    dataExplorer: { summarizeModal, results },
  }) => {
    await page.keyboard.press('Escape');
    await summarizeModal.expectOpen();

    await summarizeModal.close();

    await summarizeModal.expectClosed();
    await expect(results.sheet.columnHeaders).toHaveText(['Books_Title']);
  });
});

test.describe('removing columns', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages', 'Price');
  });

  test('the inspector removes the selected column and selects the column that takes its place', async ({
    dataExplorer: { results, inspector, columns },
  }) => {
    await results.columnHeaderButton('Books_Pages').click();
    await inspector.removeColumnButton.click();

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Price',
    ]);
    await results.expectRows([
      ['Ficciones', '14.25'],
      ['Invisible Cities', '11'],
      ['The Dispossessed', '12.5'],
      ['The Lathe of Heaven', '9.99'],
      ['Untitled', 'NULL'],
    ]);
    await expect(columns.usageCount('Pages')).toHaveCount(0);
    await expect(results.selectedColumnHeaders).toHaveText(['Books_Price']);
    await expect(inspector.name).toHaveValue('Books_Price');
  });

  test('several selected columns are removed at once', async ({
    dataExplorer: { results, inspector },
  }) => {
    await results.columnHeaderButton('Books_Pages').click();
    await results
      .columnHeaderButton('Books_Price')
      .click({ modifiers: ['Shift'] });
    await expect(inspector.panel).toContainText('2 columns selected');

    await inspector.removeColumnButton.click();

    await expect(results.sheet.columnHeaders).toHaveText(['Books_Title']);
  });

  test('removing every column asks for a first column again', async ({
    dataExplorer,
  }) => {
    const { results, inspector } = dataExplorer;
    await results.columnHeaderButton('Books_Title').click();
    await results
      .columnHeaderButton('Books_Price')
      .click({ modifiers: ['Shift'] });
    await inspector.removeColumnButton.click();

    await expect(dataExplorer.addColumnsHint).toBeVisible();
    await expect(dataExplorer.baseTableName).toHaveText('Books');
    await expect(dataExplorer.saveButton).toBeDisabled();
    await expect(dataExplorer.inspectorToggle).toBeDisabled();
    await expect(
      dataExplorer.columns.section('From Related Tables'),
    ).toBeVisible();
  });

  test('a column that a transformation uses stays', async ({
    dataExplorer,
  }) => {
    const { results, inspector } = dataExplorer;
    await dataExplorer.addTransformation('Sort');
    await expect(dataExplorer.transformations.sort(1).column).toHaveText(
      'Books_Title',
    );
    await results.columnHeaderButton('Books_Title').click();

    await expect(inspector.removeColumnButton).toBeDisabled();
    await inspector.removeColumnHelp.hover();
    await expect(dataExplorer.tooltip).toHaveText(
      'This column cannot be deleted because it is either used in transformations or a result of transformations. Please remove the column from the transformations before deleting it.',
    );

    await results.columnHeaderButton('Books_Pages').click();
    await expect(inspector.removeColumnButton).toBeEnabled();
  });
});
