import { DataExplorerPage } from '../../support/ui/pages/data-explorer-page';
import { expect, expectSettled, seedLibrary, test } from './fixtures';

test('a saved exploration with its results', async ({
  page,
  api,
  createNamedDatabase,
}) => {
  // Exploration names are unique in the instance. A database of a fixed
  // name takes the exploration of an interrupted run with it.
  const database = await createNamedDatabase('visual_data_explorer');
  const library = await seedLibrary(api, database);
  const { id } = await api.defineExploration(library.books, {
    name: 'Books by length',
    description: 'The longest book first',
    columns: ['Title', 'Pages', 'Available'],
    transformations: [
      { type: 'order', spec: [{ field: 'Books_Pages', direction: 'desc' }] },
    ],
  });
  const dataExplorer = new DataExplorerPage(page);
  await dataExplorer.gotoSaved(library.schema, id);
  await expect(dataExplorer.results.sheet.recordRows).toHaveCount(5);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('exploration.png');
});
