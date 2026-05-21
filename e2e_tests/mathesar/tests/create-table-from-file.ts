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
  primaryKeyPopover,
  typeEditorPopover,
} from '../interactions/regions/import-preview.page';
import { TablePage } from '../interactions/regions/table.page';
import { Table } from '../resources/table';
import { readCsvHeaderAndFirstRow } from '../utils/csv';

/** One column-type override applied on the import preview. */
const columnRetypeSchema = z.object({
  name: z.string(),
  /** Display name of the type (e.g. 'Text', 'Date & Time'). */
  newType: z.string(),
});

const primaryKeySchema = z.discriminatedUnion('strategy', [
  /** Add a new auto-incrementing `id` column (default Mathesar behavior). */
  z.object({ strategy: z.literal('new') }),
  /** Use an existing CSV column as the primary key. */
  z.object({ strategy: z.literal('existing'), columnName: z.string() }),
]);

const createTableFromFileParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  databaseName: z.string(),
  /**
   * Name of the target schema. The schema must already exist — use
   * `createSchema` (or `connectDatabase` with `sampleSchema`) to prepare it.
   * Defaults to `public`, which every Mathesar-connected database has.
   */
  schemaName: z.string(),
  csvFile: z.string(),
  tableName: z.string(),
  /** Zero or more column-type overrides applied during the preview. */
  columnRetypes: z.array(columnRetypeSchema).default([]),
  /** Primary-key strategy for the new table. */
  primaryKey: primaryKeySchema,
});

const createTableFromFileOutcome = z.object({
  table: Table.schema,
});

export const createTableFromFile = defineTask({
  code: 'create-table-from-file',
  params: createTableFromFileParams,
  outcome: createTableFromFileOutcome,

  task: async (t, params) => {
    // Ensure the database exists. The caller is responsible for pre-creating
    // the target schema if it's anything other than `public`.
    await t.ensure(connectDatabase, {
      login: params.login,
      databaseName: params.databaseName,
    });

    const result = await t.action(
      'Upload CSV, configure preview, and create the table',
      {
        schema: createTableFromFileOutcome,
        resource: Table.creates('table'),
        fn: async ({ page }) => {
          const home = new HomePage(page);
          await home.goto();
          await home.databaseLink(params.databaseName).click();

          const database = new DatabasePage(page);
          await database.schemaLink(params.schemaName).click();

          const schema = new SchemaPage(page);
          await schema.importFromFileLink.click();

          const upload = new ImportUploadPage(page);
          await expect(upload.heading).toBeVisible();
          await upload.uploadFile(params.csvFile);
          await expect(upload.proceedButton).toBeEnabled();
          await upload.proceedButton.click();

          const preview = new ImportPreviewPage(page);
          await expect(preview.heading).toBeVisible();
          await preview.waitForLoaded();

          // If requested, select an existing column as the primary key.
          // This is the first customization because changing the PK
          // triggers a preview refresh that would otherwise reset later
          // customizations.
          if (params.primaryKey.strategy === 'existing') {
            await preview.primaryKeyButton.click();
            const pkPopover = primaryKeyPopover(page);
            await pkPopover.chooseExistingColumn(params.primaryKey.columnName);
            await preview.waitForLoaded();
          }

          // Apply any column-type overrides via the type editor popover.
          for (const retype of params.columnRetypes) {
            await preview.column(retype.name).openTypeEditor();
            const popover = typeEditorPopover(page);
            await popover.selectType(retype.newType);
            await popover.save();
          }

          // Set the table name LAST — after any form refreshes triggered
          // by the PK/retype changes — and assert the value was accepted
          // so we fail fast if Svelte's `bind:value` overwrites it.
          await preview.waitForLoaded();
          await preview.tableNameInput.fill(params.tableName);
          await expect(preview.tableNameInput).toHaveValue(params.tableName);

          await preview.confirmButton.click();

          // Landing on the table page means the table was created successfully.
          await expect(page).toHaveURL(
            /\/db\/\d+\/schemas\/\d+\/tables\/\d+\/?$/,
          );

          return {
            table: {
              databaseName: params.databaseName,
              schemaName: params.schemaName,
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

        // After the import we may have renamed columns via `primaryKey`.
        // The CSV header is still a reliable source of expected column
        // names because Mathesar preserves names when using an existing PK.
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
      schemaName: 'public',
      csvFile: path.resolve(__dirname, '../data/patents.csv'),
      tableName: 'patents',
      columnRetypes: [
        { name: 'Patent Expiration Date', newType: 'Date & Time' },
      ],
      primaryKey: { strategy: 'new' },
    },
  },
});
