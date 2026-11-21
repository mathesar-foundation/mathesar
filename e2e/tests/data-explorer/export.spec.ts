import { runSqlInSchema, uniqueName } from '../../support/api/mathesar';
import { expect, test } from './library';

test('a saved exploration is exported as a CSV file with its name and its steps applied', async ({
  api,
  library,
  dataExplorer,
}) => {
  const name = uniqueName('Books by length');
  const { id } = await api.defineExploration(library.books, {
    name,
    columns: ['Title', 'Pages', 'In Stock', 'Published'],
    transformations: [
      { type: 'order', spec: [{ field: 'Books_Pages', direction: 'desc' }] },
    ],
  });
  await dataExplorer.gotoSaved(library.books.schema, id);
  await dataExplorer.exportLink.hover();
  await expect(dataExplorer.tooltip).toHaveText(
    `Export the ${name} exploration as a CSV file. Your current transformations will be applied to the exported data.`,
  );

  // WebKit saves a download under a name with underscores for spaces.
  await expect(dataExplorer.exportLink).toHaveAttribute(
    'download',
    `${name}.csv`,
  );
  const content = await dataExplorer.exportCsv();

  expect(content.split('\r\n')).toEqual([
    'Books_Title,Books_Pages,Books_In Stock,Books_Published',
    'Untitled,,,',
    'The Dispossessed,387,True,1974-05-01 AD',
    'Ficciones,203,True,1944-06-20 AD',
    'The Lathe of Heaven,184,False,1971-03-15 AD',
    'Invisible Cities,165,True,1972-11-03 AD',
    '',
  ]);
});

test('a result of more than 50,000 records is exported up to that number, which the tooltip says', async ({
  api,
  schema,
  dataExplorer,
}) => {
  await runSqlInSchema(
    schema,
    `CREATE TABLE "Numbers" (id integer PRIMARY KEY);
     INSERT INTO "Numbers" SELECT generate_series(1, 50001);`,
  );
  const numbers = await api.getTable(schema, 'Numbers');
  const name = uniqueName('All numbers');
  const { id } = await api.defineExploration(numbers, {
    name,
    columns: ['id'],
  });
  await dataExplorer.gotoSaved(schema, id);
  await dataExplorer.exportLink.hover();
  await expect(dataExplorer.tooltip).toHaveText(
    `Export the ${name} exploration as a CSV file. Your current transformations will be applied to the exported data. Exports are limited to 50,000 rows. Since your dataset is larger, only the first 50,000 rows will be exported.`,
  );

  const content = await dataExplorer.exportCsv();

  const lines = content.split('\r\n');
  expect(lines).toHaveLength(50_002);
  expect(lines.slice(0, 2)).toEqual(['Numbers_id', '1']);
  expect(lines.slice(-2)).toEqual(['50000', '']);
});
