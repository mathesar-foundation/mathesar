import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { connectDatabase } from './connect-database';
import { expect } from '@playwright/test';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { TablePage } from '../interactions/regions/table.page';

const addTableRecordParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  database: z.object({
    databaseName: z.string(),
    sampleSchema: z.string(),
  }),
  tableName: z.string(),
  record: z.object({
    name: z.string(),
  }),
});

const addTableRecordOutcome = z.object({
  tableName: z.string(),
  recordName: z.string(),
});

export const addTableRecord = defineTask({
  code: 'add-table-record',
  params: addTableRecordParams,
  outcome: addTableRecordOutcome,

  task: async (t, params) => {
    const db = await t.ensure(connectDatabase, {
      login: params.login,
      databaseName: params.database.databaseName,
      sampleSchema: params.database.sampleSchema,
    });

    const result = await t.action(
      'Navigate to table and add a new record',
      {
        schema: addTableRecordOutcome,
        fn: async ({ page }) => {
          const home = new HomePage(page);
          await home.goto();
          await home.databaseLink(db.database.databaseName).click();

          const database = new DatabasePage(page);
          await database.schemaLink(db.schema.schemaName).click();

          const schema = new SchemaPage(page);
          await schema.tableLink(params.tableName).click();

          const table = new TablePage(page);
          await expect(table.heading).toContainText(params.tableName);

          await table.grid.addRecord();
          await expect(table.grid.unsavedIndicator).toBeVisible();

          await table.grid.draftRow().cell(2).edit(params.record.name);

          await table.grid.waitForSaved();

          await expect(
            table.grid.rowContaining(params.record.name).element,
          ).toBeVisible();

          return {
            tableName: params.tableName,
            recordName: params.record.name,
          };
        },
      },
    );

    await t.check('New record is visible in the table', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.databaseLink(db.database.databaseName).click();

      const database = new DatabasePage(page);
      await database.schemaLink(db.schema.schemaName).click();

      const schema = new SchemaPage(page);
      await schema.tableLink(result.tableName).click();

      const table = new TablePage(page);
      await expect(
        table.grid.rowContaining(result.recordName).element,
      ).toBeVisible();
    });

    return {
      tableName: result.tableName,
      recordName: result.recordName,
    };
  },

  standalone: {
    params: {
      login: { user: 'admin', password: 'mathesar_password' },
      database: {
        databaseName: 'test_db',
        sampleSchema: 'Hardware Store',
      },
      tableName: 'Store Locations',
      record: {
        name: 'E2E Test Store',
      },
    },
  },
});
