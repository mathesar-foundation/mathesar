import { ImportPreviewPage } from '../../support/ui/pages/import-preview-page';
import { expect, expectSettled, test } from './fixtures';

const LOANS_CSV = `Borrower,Title,Pages,Due,Returned
Ada,Dune,412,2026-02-01,true
Grace,Emma,474,2026-02-15,false
Alan,Ulysses,730,2026-03-01,
`;

test('the preview of an import with inferred column types', async ({
  page,
  api,
  library,
}) => {
  // Only the user who uploads a file can open its preview, and the upload
  // takes no basic authentication. So it goes through the browser session.
  const { cookies } = await page.context().storageState();
  const csrfToken = cookies.find(({ name }) => name === 'csrftoken');
  const response = await page.request.post('/api/db/v0/data_files/', {
    headers: { 'X-CSRFToken': csrfToken?.value ?? '' },
    multipart: {
      file: {
        name: 'Loans.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(LOANS_CSV),
      },
      header: 'true',
    },
  });
  const { id } = (await response.json()) as { id: number };
  const table = await api.importDataFile(library.schema, id);
  const previewPage = new ImportPreviewPage(page);
  await previewPage.goto(table);
  await expect(previewPage.confirmButton).toBeEnabled();
  await expect(previewPage.rows).toHaveCount(3);
  await expectSettled(page);

  await expect(page).toHaveScreenshot('import-preview.png');
});
