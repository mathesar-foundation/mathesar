import { z } from 'zod';
import * as path from 'node:path';
import { expect } from '@playwright/test';
import { defineTask } from '../../framework/src';
import { connectDatabase } from './connect-database';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { ImportUploadPage } from '../interactions/regions/import-upload.page';
import {
  ImportPreviewPage,
  typeEditorPopover,
} from '../interactions/regions/import-preview.page';
import { TablePage } from '../interactions/regions/table.page';
import { Table } from '../resources/table';
import { readCsvHeaderAndFirstRow } from '../utils/csv';

const createTableFromFileParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  databaseName: z.string(),
  csvFile: z.string(),
  tableName: z.string(),
  columnToRetype: z.object({
    name: z.string(),
    newType: z.string(),
  }),
});

const createTableFromFileOutcome = z.object({
  table: Table.schema,
});

export const createTableFromFile = defineTask({
  code: 'create-table-from-file',
  params: createTableFromFileParams,
  outcome: createTableFromFileOutcome,

  task: async (t, params) => {
    // Connect a database without any sample schema — the default `public`
    // schema is still auto-created and returned as the schema outcome.
    const db = await t.ensure(connectDatabase, {
      login: params.login,
      databaseName: params.databaseName,
    });

    const result = await t.action(
      'Upload CSV, adjust a column type, and create the table',
      {
        schema: createTableFromFileOutcome,
        resource: Table.creates('table'),
        fn: async ({ page }) => {
          const home = new HomePage(page);
          await home.goto();
          await home.databaseLink(db.database.databaseName).click();

          const database = new DatabasePage(page);
          await database.schemaLink(db.schema.schemaName).click();

          const schema = new SchemaPage(page);
          await schema.importFromFileLink.click();

          const upload = new ImportUploadPage(page);
          await expect(upload.heading).toBeVisible();
          await upload.uploadFile(params.csvFile);
          await expect(upload.proceedButton).toBeEnabled();
          await upload.proceedButton.click();

          const preview = new ImportPreviewPage(page);
          await expect(preview.heading).toBeVisible();
          await expect(preview.tableNameInput).toHaveValue(params.tableName);
          await preview.waitForLoaded();

          // Change one column's type via the type editor popover.
          await preview
            .column(params.columnToRetype.name)
            .openTypeEditor();
          const popover = typeEditorPopover(page);
          await popover.selectType(params.columnToRetype.newType);
          await popover.save();

          await preview.confirmButton.click();

          // Landing on the table page means the table was created successfully.
          await expect(page).toHaveURL(
            /\/db\/\d+\/schemas\/\d+\/tables\/\d+\/?$/,
          );

          return {
            table: {
              databaseName: db.database.databaseName,
              schemaName: db.schema.schemaName,
              tableName: params.tableName,
            },
          };
        },
      },
    );

    await t.check('New table appears on the schema page', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.databaseLink(result.table.databaseName).click();
      const database = new DatabasePage(page);
      await database.schemaLink(result.table.schemaName).click();
      const schema = new SchemaPage(page);
      await expect(schema.tableLink(result.table.tableName)).toBeVisible();
    });

    await t.check(
      'Table page shows expected heading, columns, and sample row',
      async ({ page }) => {
        // Derive expected column names and a sample value from the CSV itself,
        // so this task can be composed with any CSV without hardcoded values.
        const { header, firstRow } = readCsvHeaderAndFirstRow(params.csvFile);
        const sampleValue = [...firstRow]
          .map((v) => v.trim())
          .sort((a, b) => b.length - a.length)[0];
        if (!sampleValue) {
          throw new Error(
            `First data row of ${params.csvFile} has no non-empty values`,
          );
        }

        const home = new HomePage(page);
        await home.goto();
        await home.databaseLink(result.table.databaseName).click();
        const database = new DatabasePage(page);
        await database.schemaLink(result.table.schemaName).click();
        const schema = new SchemaPage(page);
        await schema.tableLink(result.table.tableName).click();

        const table = new TablePage(page);
        await expect(page).toHaveURL(
          /\/db\/\d+\/schemas\/\d+\/tables\/\d+\/?$/,
        );
        await expect(table.heading).toHaveText(result.table.tableName);

        for (const col of header) {
          await expect(table.grid.columnHeader(col)).toBeVisible();
        }

        await expect(
          table.grid.rowContaining(sampleValue).element.first(),
        ).toBeVisible();
      },
    );

    return result;
  },

  standalone: {
    params: {
      login: { user: 'admin', password: 'mathesar_password' },
      databaseName: 'patents_db',
      csvFile: path.resolve(__dirname, '../data/patents.csv'),
      tableName: 'patents',
      columnToRetype: { name: 'Patent Expiration Date', newType: 'Date & Time' },
    },
  },
});
