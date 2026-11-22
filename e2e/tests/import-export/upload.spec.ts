import path from 'node:path';

import type { Route } from '@playwright/test';

import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { Toasts } from '../../support/ui/components/toast';
import { isMarkedDocument, markDocument } from '../../support/ui/document-mark';
import {
  dataFile,
  expect,
  storedColumns,
  storedRecords,
  storedTableNames,
  test,
} from './fixtures';

/** What `JSON.parse` throws for an HTML page, as each browser words it. */
const HTML_IS_NOT_JSON = {
  chromium: 'is not valid JSON',
  firefox:
    'JSON.parse: unexpected character at line 1 column 1 of the JSON data',
  webkit: "JSON Parse error: Unrecognized token '<'",
};

/** Failed answers to an upload, with what the page says for a file and for pasted text. */
const failedUploads = [
  {
    failure: 'an error answer that is not JSON',
    answer: (route: Route): Promise<void> =>
      route.fulfill({ status: 502, body: '' }),
    fileMessage: 'HTTP 502: Bad Gateway',
    textMessage:
      'When making an XHR request, the server responded with an error, but the response body was not valid JSON.',
  },
  {
    failure: 'a network error',
    answer: (route: Route): Promise<void> => route.abort(),
    fileMessage: 'Network error occurred',
    textMessage: 'An unexpected error has occurred',
  },
];

function answerWithHtml(route: Route): Promise<void> {
  return route.fulfill({
    status: 201,
    contentType: 'text/html',
    body: '<p>Created</p>',
  });
}

test.describe('import upload page', () => {
  test.beforeEach(async ({ uploadPage, schema }) => {
    await uploadPage.goto(schema);
  });

  test('starts with the file upload, type inference on and nothing to submit', async ({
    page,
    uploadPage,
    database,
    schema,
  }) => {
    await expect(page).toHaveTitle('Import | Mathesar');
    await expect(uploadPage.heading).toHaveText(
      'Create a table by importing your data',
    );
    await expect(uploadPage.headerLinks).toHaveText([
      '',
      database.name,
      schema.name,
      'Import',
    ]);
    await expect(uploadPage.dataSources).toHaveText([
      'Upload a file',
      'Copy and Paste Text',
    ]);
    await expect(uploadPage.uploadFileOption).toBeChecked();
    await expect(uploadPage.dropZone).toBeVisible();
    await expect(uploadPage.inferTypesOption).toBeChecked();
    await expect(uploadPage.resetButton).toBeDisabled();
    await expect(uploadPage.proceedButton).toBeDisabled();
    await expect(uploadPage.documentationLink).toHaveAttribute(
      'href',
      'https://docs.mathesar.org/user-guide/importing-data/',
    );
  });

  test('uploads the file picked in the file chooser at once', async ({
    page,
    uploadPage,
  }) => {
    const fileChooser = page.waitForEvent('filechooser');
    await uploadPage.dropZone.click();
    await (await fileChooser).setFiles(dataFile('books.csv'));

    await expect(uploadPage.chosenFile).toContainText('books.csv');
    await expect(uploadPage.chosenFile).toContainText('Uploaded 100%');
    await expect(uploadPage.chosenFile).toContainText('85.00 B');
    await expect(uploadPage.dropZone).toBeHidden();
    await expect(uploadPage.resetButton).toBeEnabled();
    await expect(uploadPage.proceedButton).toBeEnabled();
  });

  test('opens the file chooser with Enter on the drop zone', async ({
    page,
    uploadPage,
  }) => {
    const fileChooser = page.waitForEvent('filechooser');
    await uploadPage.dropZone.focus();
    await expect(uploadPage.dropZone).toBeFocused();
    await page.keyboard.press('Enter');
    await (await fileChooser).setFiles(dataFile('books.csv'));
    await expect(uploadPage.chosenFile).toContainText('Uploaded 100%');
  });

  test('takes a file dropped on the drop zone instead of letting the browser open it', async ({
    uploadPage,
  }) => {
    expect(await uploadPage.dropFile(dataFile('books.csv'))).toBe(true);

    await expect(uploadPage.chosenFile).toContainText('books.csv');
    await expect(uploadPage.chosenFile).toContainText('Uploaded 100%');
    await expect(uploadPage.proceedButton).toBeEnabled();
  });

  test('highlights the drop zone while a file is dragged over it', async ({
    uploadPage,
  }) => {
    await uploadPage.dragFileOver(dataFile('books.csv'));
    await uploadPage.expectDropZoneHighlighted(true);

    await uploadPage.dragFileAway();
    await uploadPage.expectDropZoneHighlighted(false);
  });

  test('cancels an upload that is still running', async ({ uploadPage }) => {
    await uploadPage.holdUploads();
    await uploadPage.chooseFile(dataFile('books.csv'));
    await expect(uploadPage.chosenFile).toContainText('books.csv');
    await expect(uploadPage.proceedButton).toBeDisabled();
    const abortedUpload = uploadPage.waitForAbortedUpload();
    await uploadPage.cancelUploadButton.click();

    await abortedUpload;
    await expect(uploadPage.chosenFile).toBeHidden();
    await expect(uploadPage.dropZone).toBeVisible();
    await expect(uploadPage.cancelUploadButton).toBeHidden();
  });

  test('Reset returns the form to its initial state', async ({
    uploadPage,
  }) => {
    await uploadPage.chooseFile(dataFile('books.csv'));
    await expect(uploadPage.chosenFile).toContainText('Uploaded 100%');
    await uploadPage.allTextOption.check();
    await uploadPage.resetButton.click();

    await expect(uploadPage.dropZone).toBeVisible();
    await expect(uploadPage.chosenFile).toBeHidden();
    await expect(uploadPage.inferTypesOption).toBeChecked();
    await expect(uploadPage.resetButton).toBeDisabled();
    await expect(uploadPage.proceedButton).toBeDisabled();
  });

  test('Proceed creates the table of the file and opens its preview', async ({
    page,
    api,
    uploadPage,
    previewPage,
    schema,
  }) => {
    await uploadPage.chooseFile(dataFile('books.csv'));
    await expect(uploadPage.proceedButton).toBeEnabled();
    const rpcCalls = recordRpcCalls(page);
    await uploadPage.proceedButton.click();

    await expect(page).toHaveURL(/\/import\/\d+\/\?inference=true$/);
    await expect(previewPage.heading).toHaveText(
      'Finish setting up your table',
    );
    await expect(previewPage.tableName).toHaveValue('books');
    await previewPage.expectColumns([
      ['id', 'Number'],
      ['Title', 'Text'],
      ['Pages', 'Number'],
      ['Published', 'Date'],
    ]);
    expect(rpcCalls).toEqual([
      'tables.import',
      'tables.metadata.set',
      'tables.get_with_metadata',
      'columns.list_with_metadata',
      'data_modeling.suggest_types',
      'tables.get_import_preview',
    ]);
    // Until the import is confirmed, the table holds the values as text.
    expect(await storedRecords(schema, 'books')).toEqual([
      { id: 1, Title: 'Dune', Pages: '412', Published: '1965-08-01' },
      { id: 2, Title: 'Emma', Pages: '474', Published: '1815-12-23' },
      { id: 3, Title: 'Ulysses', Pages: '730', Published: '1922-02-02' },
    ]);
    expect(
      await api.isImportConfirmed({ oid: previewPage.tableOid(), schema }),
    ).toBe(false);
  });

  for (const [delimiter, fileName] of [
    ['tabs', 'cities.tsv'],
    ['semicolons', 'cities-semicolon.csv'],
    ['pipes', 'cities-pipe.csv'],
    ['colons', 'cities-colon.csv'],
  ] as const) {
    test(`splits a file into columns at ${delimiter}`, async ({
      uploadPage,
      previewPage,
      schema,
    }) => {
      await uploadPage.chooseFile(dataFile(fileName));
      await uploadPage.proceedButton.click();

      await previewPage.expectColumns([
        ['id', 'Number'],
        ['City', 'Text'],
        ['Country', 'Text'],
        ['Population', 'Number'],
      ]);
      await expect(previewPage.cells).toHaveText([
        ...['1', 'Lima', 'Peru', '10,000,000'],
        ...['2', 'Oslo', 'Norway', '700,000'],
      ]);
      expect(await storedRecords(schema, path.parse(fileName).name)).toEqual([
        { id: 1, City: 'Lima', Country: 'Peru', Population: '10000000' },
        { id: 2, City: 'Oslo', Country: 'Norway', Population: '700000' },
      ]);
    });
  }

  test('opens the preview without type inference when "Text" is chosen for all columns', async ({
    page,
    uploadPage,
    previewPage,
  }) => {
    await uploadPage.chooseFile(dataFile('books.csv'));
    await uploadPage.allTextOption.check();
    await uploadPage.proceedButton.click();

    await expect(page).toHaveURL(/\?inference=false$/);
    await expect(previewPage.allTextOption).toBeChecked();
    await previewPage.expectColumns([
      ['id', 'Number'],
      ['Title', 'Text'],
      ['Pages', 'Text'],
      ['Published', 'Text'],
    ]);
  });

  test('renames a column called "id" and says so in the preview', async ({
    page,
    uploadPage,
    previewPage,
    schema,
  }) => {
    await uploadPage.chooseFile(dataFile('with-id-column.csv'));
    await uploadPage.proceedButton.click();

    await previewPage.expectColumns([
      ['id', 'Number'],
      ['id 1', 'Number'],
      ['Name', 'Text'],
    ]);
    expect(await storedColumns(schema, 'with-id-column')).toEqual([
      { name: 'id', type: 'integer' },
      { name: 'id 1', type: 'text' },
      { name: 'Name', type: 'text' },
    ]);
    const renameMark = previewPage.column(1).marks;
    await expect(renameMark).toHaveText(/^id\s*id 1$/);
    await renameMark.hover();
    await expect(previewPage.tooltip).toHaveText(
      'Your imported data\'s "id" column has been renamed to "id 1" to prevent conflicts with Mathesar\'s reserved "id" Primary Key column. You may choose to rename the columns if desired.',
    );

    await page.reload();
    await expect(renameMark).toHaveText(/^id\s*id 1$/);
  });

  test.describe('pasted text', () => {
    test.beforeEach(async ({ uploadPage }) => {
      await uploadPage.pasteTextOption.check();
    });

    test('replaces the drop zone and is required', async ({ uploadPage }) => {
      await expect(uploadPage.dropZone).toBeHidden();
      await expect(uploadPage.pastedText).toBeVisible();
      await expect(uploadPage.resetButton).toBeEnabled();
      await expect(uploadPage.proceedButton).toBeDisabled();

      await uploadPage.pastedText.fill('City;Population\nLima;10000000\n');
      await expect(uploadPage.proceedButton).toBeEnabled();

      await uploadPage.pastedText.fill('');
      await expect(uploadPage.proceedButton).toBeDisabled();
    });

    test('becomes a table with a generated name', async ({
      uploadPage,
      previewPage,
      schema,
    }) => {
      await uploadPage.pastedText.fill(
        'City;Population\nLima;10000000\nOslo;700000\n',
      );
      await uploadPage.proceedButton.click();

      await expect(previewPage.tableName).toHaveValue('Table 1');
      await previewPage.expectColumns([
        ['id', 'Number'],
        ['City', 'Text'],
        ['Population', 'Number'],
      ]);
      await expect(previewPage.cells).toHaveText([
        ...['1', 'Lima', '10,000,000'],
        ...['2', 'Oslo', '700,000'],
      ]);
      expect(await storedRecords(schema, 'Table 1')).toEqual([
        { id: 1, City: 'Lima', Population: '10000000' },
        { id: 2, City: 'Oslo', Population: '700000' },
      ]);
    });

    test('takes whitespace alone as data and creates a table without rows', async ({
      uploadPage,
      previewPage,
      schema,
    }) => {
      await uploadPage.pastedText.fill('   ');
      await expect(uploadPage.proceedButton).toBeEnabled();
      await uploadPage.proceedButton.click();

      await previewPage.expectColumns([
        ['id', 'Number'],
        ['Column 0', 'Text'],
      ]);
      expect(await storedRecords(schema, 'Table 1')).toEqual([]);
    });

    test('that is not a table is reported in place of the form', async ({
      uploadPage,
      schema,
    }) => {
      await uploadPage.pastedText.fill('Title,Pages\nDune\nEmma,474,1815\n');
      await uploadPage.proceedButton.click();

      await expect(uploadPage.errors).toContainText([
        'Unable to tabulate data.',
      ]);
      await expect(uploadPage.proceedButton).toBeHidden();
      expect(await storedTableNames(schema)).toEqual([]);
    });

    for (const { failure, answer, textMessage } of failedUploads) {
      test(`reports ${failure} in place of the form`, async ({
        uploadPage,
      }) => {
        await uploadPage.answerUploads(answer);
        await uploadPage.pastedText.fill('City;Population\nLima;10000000\n');
        await uploadPage.proceedButton.click();

        await expect(uploadPage.errors).toHaveText([textMessage]);
        await expect(uploadPage.proceedButton).toBeHidden();
      });
    }

    test('reloads the page when the upload is answered with 401', async ({
      page,
      uploadPage,
    }) => {
      await uploadPage.answerUploads((route) =>
        route.fulfill({
          status: 401,
          json: { detail: 'Authentication credentials were not provided.' },
        }),
      );
      await uploadPage.pastedText.fill('City;Population\nLima;10000000\n');
      await markDocument(page);
      await uploadPage.proceedButton.click();

      await expect(uploadPage.uploadFileOption).toBeChecked();
      expect(await isMarkedDocument(page)).toBe(false);
      await expect(uploadPage.proceedButton).toBeDisabled();
    });

    test.describe('whose upload is answered with something other than JSON', () => {
      test.use({
        allowedBrowserErrors:
          /is not valid JSON|JSON\.parse: unexpected character|JSON Parse error/,
      });

      test(
        'stays on "Processing Data" and throws an uncaught error',
        pinsKnownBug('import-paste-answer-not-json'),
        async ({ page, uploadPage, browserName }) => {
          await uploadPage.answerUploads(answerWithHtml);
          await uploadPage.pastedText.fill('City;Population\nLima;10000000\n');
          const uncaughtError = page.waitForEvent('pageerror');
          await uploadPage.proceedButton.click();

          expect((await uncaughtError).message).toContain(
            HTML_IS_NOT_JSON[browserName],
          );
          await expect(uploadPage.processingHeading).toBeVisible();
          await expect(uploadPage.errors).toHaveCount(0);
        },
      );
    });

    test.fixme('reports an upload answered with something other than JSON in place of the form', async ({
      uploadPage,
    }) => {
      await uploadPage.answerUploads(answerWithHtml);
      await uploadPage.pastedText.fill('City;Population\nLima;10000000\n');
      await uploadPage.proceedButton.click();

      await expect(uploadPage.errors).toHaveCount(1);
      await expect(uploadPage.processingHeading).toBeHidden();
    });
  });

  test.describe('a file upload that fails', () => {
    for (const { failure, answer, fileMessage } of failedUploads) {
      test(`reports ${failure} in a toast and offers the drop zone again`, async ({
        page,
        uploadPage,
      }) => {
        await uploadPage.answerUploads(answer);
        await uploadPage.chooseFile(dataFile('books.csv'));

        await new Toasts(page).expectMessage(fileMessage);
        await expect(uploadPage.dropZone).toBeVisible();
        await expect(uploadPage.chosenFile).toBeHidden();
        await expect(uploadPage.proceedButton).toBeDisabled();
      });
    }

    test('shows the file as uploaded without a way to proceed when the answer is not JSON', async ({
      page,
      uploadPage,
    }) => {
      await uploadPage.answerUploads(answerWithHtml);
      await uploadPage.chooseFile(dataFile('books.csv'));

      await expect(uploadPage.chosenFile).toContainText('Uploaded 100%');
      await expect(uploadPage.cancelUploadButton).toBeHidden();
      await expect(uploadPage.proceedButton).toBeDisabled();
      await expect(uploadPage.resetButton).toBeDisabled();
      await expect(new Toasts(page).items).toHaveCount(0);
    });
  });

  test.describe('files that cannot be imported', () => {
    test(
      'shows the response of the server as it is when the file is empty',
      pinsKnownBug('import-upload-error-raw-json'),
      async ({ page, uploadPage }) => {
        await uploadPage.chooseFile(dataFile('empty.csv'));

        await expect(new Toasts(page).items).toHaveText(
          `{"errors": {"file": ["The submitted file is empty."], "__all__": ["One of ['file', 'paste'] should be specified."]}}`,
        );
        await expect(uploadPage.dropZone).toBeVisible();
        await expect(uploadPage.proceedButton).toBeDisabled();
      },
    );

    test.fixme('says that the file is empty', async ({ page, uploadPage }) => {
      await uploadPage.chooseFile(dataFile('empty.csv'));

      await expect(new Toasts(page).items).toHaveText(
        'The submitted file is empty.',
      );
      await expect(uploadPage.dropZone).toBeVisible();
      await expect(uploadPage.proceedButton).toBeDisabled();
    });

    test('rejects a file that is not text', async ({ page, uploadPage }) => {
      await uploadPage.chooseFile(dataFile('pixel.png'));

      await new Toasts(page).expectMessage('Unable to create DataFile.');
      await expect(uploadPage.dropZone).toBeVisible();
      await expect(uploadPage.proceedButton).toBeDisabled();
    });

    test('rejects a file whose rows differ in their number of fields', async ({
      page,
      uploadPage,
    }) => {
      await uploadPage.chooseFile(dataFile('ragged-rows.csv'));

      await new Toasts(page).expectMessage('Unable to tabulate data.');
      await expect(uploadPage.dropZone).toBeVisible();
      await expect(uploadPage.proceedButton).toBeDisabled();
    });

    test('reports a file that cannot become a table in place of the form', async ({
      uploadPage,
      schema,
    }) => {
      await uploadPage.chooseFile(dataFile('duplicate-column-names.csv'));
      await uploadPage.proceedButton.click();

      await expect(uploadPage.errors).toHaveText([
        'DuplicateColumn: column "Name" specified more than once SQLSTATE: 42701',
      ]);
      await expect(uploadPage.proceedButton).toBeHidden();
      expect(await storedTableNames(schema)).toEqual([]);
    });
  });

  test('says that the data is processed while the table is created', async ({
    page,
    uploadPage,
    previewPage,
  }) => {
    const createTable = await holdRpcCalls(page, 'tables.import');
    await uploadPage.chooseFile(dataFile('books.csv'));
    await uploadPage.proceedButton.click();

    await expect(uploadPage.processingHeading).toBeVisible();
    await expect(uploadPage.processingWarning).toBeVisible();
    await expect(uploadPage.proceedButton).toBeHidden();

    createTable();
    await expect(previewPage.heading).toHaveText(
      'Finish setting up your table',
    );
  });
});
