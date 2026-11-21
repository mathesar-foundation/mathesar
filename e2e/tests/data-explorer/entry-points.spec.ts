import { uniqueName } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { uncaughtErrorMessage } from '../../support/page-errors';
import { recordRpcCalls } from '../../support/rpc-log';
import { menuItem } from '../../support/ui/components/menu';
import {
  DataExplorerLinks,
  dataExplorerUrl,
  explorationUrl,
} from '../../support/ui/pages/data-explorer-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { schemaUrl } from '../../support/ui/urls';
import { expect, test } from './library';

test.describe('ways into the Data Explorer', () => {
  test('the schema page opens an empty Data Explorer, with a tutorial while the schema has no exploration', async ({
    page,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    await page.goto(schemaUrl(schema));
    await new DataExplorerLinks(page).openDataExplorer.click();

    await expect(page).toHaveURL(dataExplorerUrl(schema));
    await expect(page).toHaveTitle('Data Explorer | Mathesar');
    await expect(dataExplorer.breadcrumbLinks.last()).toHaveText(
      'Data Explorer',
    );
    await expect(dataExplorer.baseTableLabel).toHaveText('Exploring from');
    await expect(dataExplorer.baseTableSelect).toBeVisible();
    await expect(dataExplorer.tutorial).toBeVisible();
    await expect(dataExplorer.chooseTableHint).toBeVisible();
    await expect(dataExplorer.saveButton).toHaveCount(0);
  });

  test('"New Exploration" opens the Data Explorer without the tutorial once the schema has an exploration', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    await api.defineExploration(library.books, {
      name: uniqueName('Titles'),
      columns: ['Title'],
    });
    await page.goto(schemaUrl(schema));
    await new DataExplorerLinks(page).newExploration.click();

    await expect(page).toHaveURL(dataExplorerUrl(schema));
    await expect(dataExplorer.chooseTableHint).toBeVisible();
    await expect(dataExplorer.tutorial).toHaveCount(0);
  });

  test('"Explore Data" on the table page starts an exploration of that table', async ({
    page,
    library,
    dataExplorer,
  }) => {
    const tablePage = new TablePage(page);
    await tablePage.goto(library.books);
    await new DataExplorerLinks(page).exploreData.click();

    // The link carries the table in the hash, which the page removes.
    await expect(page).toHaveURL(dataExplorerUrl(library.books.schema));
    await expect(dataExplorer.baseTableLabel).toHaveText('Exploring from');
    await expect(dataExplorer.baseTableName).toHaveText('Books');
    await expect(dataExplorer.columns.baseColumnNames).toHaveText([
      'id',
      'Title',
      'Pages',
      'Price',
      'Published',
      'In Stock',
      'Author',
    ]);
    await expect(dataExplorer.addColumnsHint).toBeVisible();
  });

  test.describe('from a grouped table', () => {
    test.beforeEach(async ({ page, library }) => {
      const tablePage = new TablePage(page);
      await tablePage.goto(library.books);
      await tablePage.sheet.columnHeader('Author').click({ button: 'right' });
      await menuItem(page, 'Group by Column').click();
      await tablePage.inspector.tab('Table').click();
      await new DataExplorerLinks(page).summarizeInDataExplorer.click();
    });

    test('"Summarize in Data Explorer" counts the records of each group', async ({
      dataExplorer: { results, transformations, transformResultsTab },
    }) => {
      await expect(results.sheet.columnHeaders).toHaveText([
        'Author group',
        'Books count',
      ]);
      await results.expectRows([
        ['1', '2'],
        ['2', '1'],
        ['3', '1'],
        ['NULL', '1'],
      ]);

      await transformResultsTab.click();
      await expect(transformations.stepHeaders).toHaveText(['1 Summarization']);
      await expect(transformations.summarize(1).groupColumn).toHaveText(
        'Author',
      );
      await expect(transformations.summarize(1).aggregations).toHaveText([
        'id as Count',
      ]);
    });

    test(
      'the summarization of a grouped table cannot be saved and its export link has no exploration',
      pinsKnownBug('summarize-in-data-explorer-not-saveable'),
      async ({ dataExplorer }) => {
        await dataExplorer.results.expectRows([
          ['1', '2'],
          ['2', '1'],
          ['3', '1'],
          ['NULL', '1'],
        ]);
        await expect(dataExplorer.saveButton).toBeDisabled();
        await expect(dataExplorer.exportLink).toHaveAttribute(
          'href',
          /exploration_id=undefined/,
        );
      },
    );

    test.fixme('the summarization of a grouped table can be saved, and exported only after that', async ({
      dataExplorer,
    }) => {
      await dataExplorer.results.expectRows([
        ['1', '2'],
        ['2', '1'],
        ['3', '1'],
        ['NULL', '1'],
      ]);
      await expect(dataExplorer.saveButton).toBeEnabled();
      await expect(dataExplorer.exportLink).toHaveCount(0);
      await expect(dataExplorer.exportButton).toBeDisabled();
    });
  });
});

test.describe('a saved exploration', () => {
  test('opens from the schema page with its result, ready to edit', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    const name = uniqueName('Book lengths');
    const { id } = await api.defineExploration(library.books, {
      name,
      description: 'Pages per book',
      columns: ['Title', 'Pages'],
    });
    await page.goto(schemaUrl(schema));
    await new DataExplorerLinks(page).savedExploration(name).click();

    await expect(page).toHaveURL(explorationUrl(schema, id));
    await expect(page).toHaveTitle(`${name} | Mathesar`);
    await expect(dataExplorer.breadcrumbLinks.last()).toHaveText(name);
    await expect(dataExplorer.heading).toHaveText(name);
    await expect(dataExplorer.description).toHaveText('Pages per book');
    await expect(dataExplorer.baseTableLabel).toHaveText('Based on');
    await expect(dataExplorer.baseTableName).toHaveText('Books');
    await expect(dataExplorer.startOverButton).toHaveCount(0);
    await dataExplorer.results.expectRows([
      ['Ficciones', '203'],
      ['Invisible Cities', '165'],
      ['The Dispossessed', '387'],
      ['The Lathe of Heaven', '184'],
      ['Untitled', 'NULL'],
    ]);
    await expect(dataExplorer.inspector.selectedTab).toHaveText('Exploration');
    await expect(dataExplorer.inspector.name).toHaveValue(name);
    await expect(dataExplorer.columns.usageCount('Title')).toHaveText('1');
    await expect(dataExplorer.saveButton).toBeDisabled();
    await expect(dataExplorer.exportLink).toBeVisible();
  });

  test('is fetched, run and given its column list once when it opens', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { id } = await api.defineExploration(library.books, {
      name: uniqueName('Titles'),
      columns: ['Title'],
    });
    const calls = recordRpcCalls(page);

    await dataExplorer.gotoSaved(library.books.schema, id);

    expect([...calls].sort()).toEqual([
      'columns.list_with_metadata',
      'explorations.get',
      'explorations.run',
      'tables.get',
      'tables.list_joinable',
    ]);
  });

  test('an address without a numeric id opens an empty Data Explorer', async ({
    page,
    library,
    dataExplorer,
  }) => {
    await page.goto(`${schemaUrl(library.books.schema)}explorations/latest/`);

    await expect(dataExplorer.chooseTableHint).toBeVisible();
    await expect(dataExplorer.baseTableSelect).toBeVisible();
  });
});

test.describe('navigation between explorations', () => {
  test('Back and Forward move between the schema page and a saved exploration', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    const name = uniqueName('Titles');
    const { id } = await api.defineExploration(library.books, {
      name,
      columns: ['Title'],
    });
    const links = new DataExplorerLinks(page);
    await page.goto(schemaUrl(schema));
    await links.savedExploration(name).click();
    await expect(dataExplorer.heading).toHaveText(name);
    await dataExplorer.expectSidebarLoaded();

    await page.goBack();
    await expect(page).toHaveURL(schemaUrl(schema));
    await expect(links.savedExploration(name)).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(explorationUrl(schema, id));
    await expect(dataExplorer.heading).toHaveText(name);
    await expect(dataExplorer.results.sheet.recordRows).toHaveCount(5);
  });

  test('another exploration replaces the name, the base table, the steps and the result of the open one', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    const { results, transformations } = dataExplorer;
    const longBooks = uniqueName('Long books');
    const authorNames = uniqueName('Author names');
    const { id } = await api.defineExploration(library.books, {
      name: longBooks,
      columns: ['Title', 'Pages'],
      transformations: [
        { type: 'order', spec: [{ field: 'Books_Pages', direction: 'desc' }] },
      ],
    });
    await api.defineExploration(library.authors, {
      name: authorNames,
      columns: ['Name'],
    });
    await dataExplorer.gotoSaved(schema, id);
    await dataExplorer.transformResultsTab.click();
    await expect(transformations.stepHeaders).toHaveText(['1 Sort']);
    await results.columnHeaderButton('Books_Pages').click();
    await expect(dataExplorer.inspector.name).toHaveValue('Books_Pages');

    await dataExplorer.switchTo(authorNames);
    await expect(dataExplorer.heading).toHaveText(authorNames);
    await expect(dataExplorer.baseTableName).toHaveText('Authors');
    await expect(results.sheet.columnHeaders).toHaveText(['Authors_Name']);
    await results.expectRows([
      ['Italo Calvino'],
      ['Jorge Borges'],
      ['Ursula Le Guin'],
    ]);
    await expect(transformations.addStepButton).toBeVisible();
    await expect(transformations.stepHeaders).toHaveCount(0);
    await expect(dataExplorer.inspector.selectedTab).toHaveText('Exploration');
    await expect(dataExplorer.inspector.name).toHaveValue(authorNames);
    await dataExplorer.expectSidebarLoaded();

    await page.goBack();
    await expect(dataExplorer.heading).toHaveText(longBooks);
    await expect(transformations.stepHeaders).toHaveText(['1 Sort']);
    await results.expectRows([
      ['Untitled', 'NULL'],
      ['The Dispossessed', '387'],
      ['Ficciones', '203'],
      ['The Lathe of Heaven', '184'],
      ['Invisible Cities', '165'],
    ]);
  });

  test('changes that were not saved are dropped without a question when another exploration opens', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { schema } = library.books;
    const titles = uniqueName('Titles');
    const authorNames = uniqueName('Author names');
    const { id } = await api.defineExploration(library.books, {
      name: titles,
      columns: ['Title'],
    });
    await api.defineExploration(library.authors, {
      name: authorNames,
      columns: ['Name'],
    });
    await dataExplorer.gotoSaved(schema, id);
    await dataExplorer.addColumns('Pages');
    await expect(dataExplorer.unsavedMark).toBeVisible();

    await dataExplorer.switchTo(authorNames);
    await expect(dataExplorer.heading).toHaveText(authorNames);
    await expect(dataExplorer.saveButton).toBeDisabled();
    await dataExplorer.expectSidebarLoaded();

    await page.goBack();
    await expect(dataExplorer.heading).toHaveText(titles);
    await expect(dataExplorer.results.sheet.columnHeaders).toHaveText([
      'Books_Title',
    ]);
    await expect(dataExplorer.saveButton).toBeDisabled();
  });

  test('the breadcrumb link "Data Explorer" keeps the new exploration that is open', async ({
    library,
    dataExplorer,
  }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title');

    await dataExplorer.breadcrumbLinks.last().click();

    await expect(dataExplorer.baseTableName).toHaveText('Books');
    await expect(dataExplorer.results.sheet.columnHeaders).toHaveText([
      'Books_Title',
    ]);
    await expect(dataExplorer.unsavedMark).toBeVisible();
  });
});

test.describe('a change to an exploration while its column list still loads', () => {
  let uncaughtErrors: string[];

  test.beforeEach(async ({ page, api, library, dataExplorer }) => {
    const { schema } = library.books;
    const name = uniqueName('Titles');
    const { id } = await api.defineExploration(library.books, {
      name,
      columns: ['Title'],
    });
    uncaughtErrors = [];
    page.on('pageerror', (error) =>
      uncaughtErrors.push(uncaughtErrorMessage(error)),
    );
    const releaseColumnList = await holdRpcCalls(page, 'tables.list_joinable');
    await page.goto(explorationUrl(schema, id));
    await expect(dataExplorer.heading).toHaveText(name);

    await dataExplorer.inspector.description.fill('Changed');
    await expect(dataExplorer.description).toHaveText('Changed');
    releaseColumnList();
    await dataExplorer.expectSidebarLoaded();
  });

  test.describe('today', () => {
    test.use({ allowedBrowserErrors: /Response is not an array/ });

    test(
      'cancels the request for the columns, which throws an error that nothing catches',
      pinsKnownBug('rpc-batch-cancel-uncaught-error'),
      async () => {
        await expect
          .poll(() => uncaughtErrors)
          .toEqual(['Response is not an array']);
      },
    );
  });

  test.fixme('raises no error', () => {
    expect(uncaughtErrors).toEqual([]);
  });
});
