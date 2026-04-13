import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { login } from './login';
import { expect } from '@playwright/test';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { connectDatabaseModal } from '../interactions/regions/connect-database-modal';
import { Database, Schema } from '../resources/database';

const connectDatabaseParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  databaseName: z.string(),
  sampleSchema: z.string(),
});

export const connectDatabase = defineTask({
  code: 'connect-database',
  params: connectDatabaseParams,
  outcome: z.object({
    database: Database.schema,
    schema: Schema.schema,
  }),

  task: async (t, params) => {
    await t.ensure(login, params.login);

    const result = await t.action(
      'Create new internal database with sample schema',
      {
        schema: z.object({
          database: Database.schema,
          schema: Schema.schema,
        }),
        resource: Database.creates('database').with(Schema.creates('schema')),
        fn: async ({ page }) => {
          const home = new HomePage(page);
          await home.goto();
          await home.connectDatabaseButton.click();

          const dialog = connectDatabaseModal(page);
          await dialog.createNewDatabase(
            params.databaseName,
            params.sampleSchema,
          );

          await expect(
            home.databaseLink(params.databaseName),
          ).toBeVisible();

          return {
            database: {
              databaseName: params.databaseName,
              databaseDisplayName: params.databaseName,
            },
            schema: {
              databaseName: params.databaseName,
              schemaName: params.sampleSchema,
            },
          };
        },
      },
    );

    await t.check('Database is listed on the home page', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(
        home.databaseEntry(result.database.databaseName),
      ).toBeVisible();
    });

    await t.check('Schema is present inside the database', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.databaseLink(result.database.databaseName).click();

      const database = new DatabasePage(page);
      await expect(database.schemaLink(result.schema.schemaName)).toBeVisible();
    });

    return result;
  },

  standalone: {
    params: {
      login: { user: 'admin', password: 'mathesar_password' },
      databaseName: 'test_db',
      sampleSchema: 'Hardware Store',
    },
  },
});
