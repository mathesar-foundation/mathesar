import { DataExplorerPage } from '../../support/ui/pages/data-explorer-page';
import { expect, test } from './fixtures';
import { grantOnSchema, grantOnTable } from './privileges';

test.describe('what a standard user may do in the Data Explorer', () => {
  test('shows the error of PostgreSQL in place of the result until the role may read the base table', async ({
    books,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnSchema(books.schema, role.name, 'USAGE');
    const dataExplorer = new DataExplorerPage(await signInAs(user));
    const { results } = dataExplorer;
    await dataExplorer.explore(books);
    await dataExplorer.addColumns('Title');

    await expect(results.error).toContainText(
      'The result could not be displayed.',
    );
    await expect(results.error).toContainText(
      'permission denied for table Books',
    );
    await expect(results.refreshButton).toHaveText('Retry');
    await expect(results.sheet.recordRows).toHaveCount(0);

    await grantOnTable(books, role.name, 'SELECT');
    await results.refreshButton.click();
    await results.expectRows([['Dune'], ['Emma'], ['Ulysses']]);
    await expect(results.error).toHaveCount(0);
  });
});
