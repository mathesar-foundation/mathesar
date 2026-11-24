import { type MathesarApi, uniqueName } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import {
  DataExplorerLinks,
  type DataExplorerPage,
  anyExplorationUrl,
  dataExplorerUrl,
  explorationIdIn,
  explorationUrl,
} from '../../support/ui/pages/data-explorer-page';
import { schemaUrl } from '../../support/ui/urls';
import { type Library, expect, test } from './library';

test.describe('a new exploration with columns', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages');
  });

  test('is marked as unsaved and cannot be exported yet', async ({
    dataExplorer,
  }) => {
    await expect(dataExplorer.unsavedMark).toBeVisible();
    await expect(dataExplorer.exportLink).toHaveCount(0);
    await expect(dataExplorer.exportButton).toBeDisabled();

    await dataExplorer.saveButton.hover();
    await expect(dataExplorer.tooltip).toHaveText(
      'Click to save changes to the exploration query definition and display options',
    );

    // The tooltip of "Save" fades out while the next one shows.
    await dataExplorer.exportHelp.hover();
    await expect(
      dataExplorer.tooltip.filter({
        hasText:
          'Exploration has unsaved changes. Please save the changes before exporting.',
      }),
    ).toBeVisible();
  });

  test('"Save" asks for a name, which must not be empty', async ({
    dataExplorer: { saveButton, saveModal },
  }) => {
    await saveButton.click();

    await expect(saveModal.title).toHaveText('Save Exploration');
    await expect(saveModal.name).toBeFocused();
    await expect(saveModal.name).toHaveValue('');
    await expect(saveModal.button('Save')).toBeDisabled();

    await saveModal.name.fill('x');
    await expect(saveModal.button('Save')).toBeEnabled();

    await saveModal.name.fill('  ');
    await expect(saveModal.body).toContainText(
      'The Exploration name cannot be empty.',
    );
    await expect(saveModal.button('Save')).toBeDisabled();
  });

  test('is stored under its name and moves to an address of its own', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { saveModal, inspector } = dataExplorer;
    const { schema } = library.books;
    const name = uniqueName('Book lengths');
    await dataExplorer.saveButton.click();
    await saveModal.name.fill(name);
    await saveModal.description.fill('Pages per book');
    await saveModal.button('Save').click();

    await saveModal.expectClosed();
    await expect(page).toHaveURL(anyExplorationUrl(schema));
    expect(await api.findExploration(schema, name)).toMatchObject({
      id: explorationIdIn(page.url()),
      description: 'Pages per book',
      baseTableOid: library.books.oid,
      columns: [
        { alias: 'Books_Title', attnum: library.books.columns.Title },
        { alias: 'Books_Pages', attnum: library.books.columns.Pages },
      ],
      transformations: [],
      displayNames: { Books_Title: 'Books_Title', Books_Pages: 'Books_Pages' },
    });
    await expect(page).toHaveTitle(`${name} | Mathesar`);
    await expect(dataExplorer.breadcrumbLinks.last()).toHaveText(name);
    await expect(dataExplorer.heading).toHaveText(name);
    await expect(dataExplorer.description).toHaveText('Pages per book');
    await expect(dataExplorer.baseTableLabel).toHaveText('Based on');
    await expect(dataExplorer.startOverButton).toHaveCount(0);
    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    await expect(dataExplorer.saveButton).toBeDisabled();
    await expect(dataExplorer.exportLink).toBeVisible();
    await expect(inspector.selectedTab).toHaveText('Column');
    await expect(inspector.tab('Exploration')).toBeVisible();
    await expect(dataExplorer.results.sheet.recordRows).toHaveCount(5);
  });

  test('is stored with its linked columns and its steps, and opens again as it was saved', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const { columns, transformations, results } = dataExplorer;
    const { books, authors } = library;
    const name = uniqueName('Books by author');
    const linkedAuthors = columns.linkedTable('Authors', 'Author');
    await linkedAuthors.toggle.click();
    await linkedAuthors.column('Name').click();
    await results.expectLoaded();
    await dataExplorer.addTransformation('Sort');
    await chooseOption(transformations.sort(1).direction, 'Z-A');
    const rows = [
      ['Untitled', 'NULL', 'NULL'],
      ['The Lathe of Heaven', '184', 'Ursula Le Guin'],
      ['The Dispossessed', '387', 'Ursula Le Guin'],
      ['Invisible Cities', '165', 'Italo Calvino'],
      ['Ficciones', '203', 'Jorge Borges'],
    ];
    await results.expectRows(rows);

    await dataExplorer.saveAs(name);

    expect(await api.findExploration(books.schema, name)).toMatchObject({
      columns: [
        { alias: 'Books_Title', attnum: books.columns.Title },
        { alias: 'Books_Pages', attnum: books.columns.Pages },
        {
          alias: 'Authors_Name',
          attnum: authors.columns.Name,
          joinPath: [
            [
              [books.oid, books.columns.Author],
              [authors.oid, authors.columns.id],
            ],
          ],
        },
      ],
      transformations: [
        { type: 'order', spec: [{ field: 'Books_Title', direction: 'desc' }] },
      ],
    });

    await page.reload();
    await expect(dataExplorer.heading).toHaveText(name);
    await results.expectRows(rows);
    await dataExplorer.transformResultsTab.click();
    await expect(transformations.stepHeaders).toHaveText(['1 Sort']);
    await expect(transformations.sort(1).direction).toHaveText('Z-A');
  });

  test('is not saved by Enter in the name field or after Escape', async ({
    page,
    api,
    schema,
    dataExplorer: { saveButton, saveModal },
  }) => {
    await saveButton.click();
    await saveModal.name.fill(uniqueName('Abandoned'));
    await saveModal.name.press('Enter');
    await saveModal.expectOpen();

    await page.keyboard.press('Escape');

    await saveModal.expectClosed();
    await expect(page).toHaveURL(dataExplorerUrl(schema));
    await expect(saveButton).toBeEnabled();
    expect(await api.listExplorations(schema)).toEqual([]);

    await saveButton.click();
    await expect(saveModal.name).toHaveValue('');
  });

  test('is not saved when the modal is cancelled', async ({
    page,
    api,
    schema,
    dataExplorer: { saveButton, saveModal },
  }) => {
    await saveButton.click();
    await saveModal.name.fill(uniqueName('Abandoned'));
    await saveModal.button('Cancel').click();

    await saveModal.expectClosed();
    await expect(page).toHaveURL(dataExplorerUrl(schema));
    expect(await api.listExplorations(schema)).toEqual([]);
  });
});

test.describe('the name of another exploration of the schema', () => {
  /** Saves an exploration under the name through the API, then types the name for a new one. */
  async function typeNameOfAnotherExploration(
    api: MathesarApi,
    library: Library,
    dataExplorer: DataExplorerPage,
    name: string,
  ): Promise<void> {
    await api.defineExploration(library.books, { name, columns: ['Title'] });
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages');
    await dataExplorer.saveButton.click();
    await dataExplorer.saveModal.name.fill(name);
  }

  test('is refused by the modal when it is all lower case', async ({
    api,
    library,
    dataExplorer,
  }) => {
    const { saveModal } = dataExplorer;
    const name = uniqueName('titles');
    await typeNameOfAnotherExploration(api, library, dataExplorer, name);

    await expect(saveModal.body).toContainText(
      'An Exploration with that name already exists.',
    );
    await expect(saveModal.button('Save')).toBeDisabled();
  });

  test.describe('with a capital letter', () => {
    test.use({ allowedBrowserErrors: /IntegrityError/ });

    test(
      'is accepted by the modal and then refused by the server',
      pinsKnownBug('exploration-duplicate-name-not-detected'),
      async ({ page, api, schema, library, dataExplorer }) => {
        const { saveModal } = dataExplorer;
        const name = uniqueName('Titles');
        await typeNameOfAnotherExploration(api, library, dataExplorer, name);

        await expect(saveModal.button('Save')).toBeEnabled();
        await saveModal.button('Save').click();

        await new Toasts(page).expectMessage(
          'duplicate key value violates unique constraint',
        );
        await saveModal.expectClosed();
        await expect(page).toHaveURL(dataExplorerUrl(schema));
        expect(await api.listExplorations(schema)).toHaveLength(1);
      },
    );
  });

  test.fixme('is refused by the modal when it has a capital letter', async ({
    api,
    library,
    dataExplorer,
  }) => {
    const { saveModal } = dataExplorer;
    const name = uniqueName('Titles');
    await typeNameOfAnotherExploration(api, library, dataExplorer, name);

    await expect(saveModal.body).toContainText(
      'An Exploration with that name already exists.',
    );
    await expect(saveModal.button('Save')).toBeDisabled();
  });
});

test('a saved exploration takes the place of the Data Explorer in the browser history', async ({
  page,
  library,
  dataExplorer,
}) => {
  const { schema } = library.books;
  const links = new DataExplorerLinks(page);
  const name = uniqueName('Titles');
  await page.goto(schemaUrl(schema));
  await links.newExploration.click();
  await chooseOption(dataExplorer.baseTableSelect, 'Books');
  await dataExplorer.addColumns('Title');
  await dataExplorer.saveAs(name);
  await expect(dataExplorer.heading).toHaveText(name);

  await page.goBack();

  await expect(page).toHaveURL(schemaUrl(schema));
  await expect(links.savedExploration(name)).toBeVisible();
});

test.describe('a saved exploration', () => {
  let name: string;
  let id: number;
  let otherName: string;

  test.beforeEach(async ({ api, library, dataExplorer }) => {
    name = uniqueName('Book lengths');
    otherName = uniqueName('Author names');
    ({ id } = await api.defineExploration(library.books, {
      name,
      columns: ['Title', 'Pages'],
    }));
    await api.defineExploration(library.authors, {
      name: otherName,
      columns: ['Name'],
    });
    await dataExplorer.gotoSaved(library.books.schema, id);
  });

  test('stores new columns and steps on "Save", at the same address', async ({
    page,
    api,
    schema,
    library,
    dataExplorer,
  }) => {
    const { transformations, results } = dataExplorer;
    await dataExplorer.addColumns('Price');
    await dataExplorer.addTransformation('Filter');
    await transformations.filter(1).value.fill('the');
    await expect(results.sheet.recordRows).toHaveCount(2);
    await expect(dataExplorer.unsavedMark).toBeVisible();
    await expect(dataExplorer.exportButton).toBeDisabled();

    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    await expect(dataExplorer.saveModal.root).toHaveCount(0);
    await expect(dataExplorer.exportLink).toBeVisible();
    await expect(page).toHaveURL(explorationUrl(schema, id));
    expect(await api.findExploration(schema, name)).toMatchObject({
      id,
      columns: [
        { alias: 'Books_Title' },
        { alias: 'Books_Pages' },
        { alias: 'Books_Price', attnum: library.books.columns.Price },
      ],
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
      ],
    });
  });

  test('drops changes that were not saved when the page is reloaded', async ({
    page,
    api,
    schema,
    dataExplorer,
  }) => {
    await dataExplorer.addColumns('Price');
    await expect(dataExplorer.unsavedMark).toBeVisible();

    await page.reload();

    await expect(dataExplorer.results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Books_Pages',
    ]);
    await expect(dataExplorer.saveButton).toBeDisabled();
    expect((await api.findExploration(schema, name))?.columns).toHaveLength(2);
  });

  test('is deleted from the inspector after confirmation, which leads to the schema page', async ({
    page,
    api,
    schema,
    dataExplorer,
  }) => {
    const { deleteModal } = dataExplorer;
    const links = new DataExplorerLinks(page);
    await dataExplorer.inspector.deleteButton.click();
    await expect(deleteModal.body).toHaveText(
      'Are you sure you want to proceed?',
    );

    await deleteModal.button('Delete Exploration').click();

    await expect(page).toHaveURL(schemaUrl(schema));
    await expect(links.savedExploration(otherName)).toBeVisible();
    await expect(links.savedExploration(name)).toHaveCount(0);
    expect(await api.findExploration(schema, name)).toBeUndefined();
  });

  test('stays when the deletion is cancelled', async ({
    page,
    api,
    schema,
    dataExplorer,
  }) => {
    await dataExplorer.inspector.deleteButton.click();
    await dataExplorer.deleteModal.button('Cancel').click();

    await dataExplorer.deleteModal.expectClosed();
    await expect(page).toHaveURL(explorationUrl(schema, id));
    await expect(dataExplorer.heading).toHaveText(name);
    expect(await api.findExploration(schema, name)).toBeDefined();
  });
});
