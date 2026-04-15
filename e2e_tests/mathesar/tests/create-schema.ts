import { z } from 'zod';
import { defineTask } from '../../framework/src';
import { expect } from '@playwright/test';
import { connectDatabase } from './connect-database';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { createSchemaModal } from '../interactions/regions/create-schema-modal';
import { Schema } from '../resources/database';

const createSchemaParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  databaseName: z.string(),
  schemaName: z.string(),
});

export const createSchema = defineTask({
  code: 'create-schema',
  params: createSchemaParams,
  outcome: z.object({
    schema: Schema.schema,
  }),

  task: async (t, params) => {
    // Ensure the database exists (with no sample schema — we're adding our
    // own schema to it explicitly).
    const db = await t.ensure(connectDatabase, {
      login: params.login,
      databaseName: params.databaseName,
    });

    const result = await t.action(
      'Open Create Schema modal and submit',
      {
        schema: z.object({ schema: Schema.schema }),
        resource: Schema.creates('schema'),
        fn: async ({ page }) => {
          const home = new HomePage(page);
          await home.goto();
          await home.databaseLink(db.database.databaseName).click();

          const database = new DatabasePage(page);
          await database.createSchemaButton.click();

          const dialog = createSchemaModal(page);
          await dialog.createSchema(params.schemaName);

          // Wait for the schema to appear in the schemas list on the
          // database page — this confirms the create request completed.
          await expect(
            database.schemaLink(params.schemaName),
          ).toBeVisible();

          return {
            schema: {
              databaseName: params.databaseName,
              schemaName: params.schemaName,
            },
          };
        },
      },
    );

    await t.check('New schema appears in the database', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.databaseLink(db.database.databaseName).click();
      const database = new DatabasePage(page);
      await expect(database.schemaLink(result.schema.schemaName)).toBeVisible();
    });

    return result;
  },
});
