import { z } from 'zod';
import { expect } from '@playwright/test';
import { defineTask } from '../../framework/src';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { TablePage } from '../interactions/regions/table.page';
import { extractColumnsDialog } from '../interactions/regions/extract-columns-dialog';
import { Table } from '../resources/table';

const extractColumnsToNewTableParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  /** The parent table from which columns are being extracted. */
  table: Table.schema,
  /** Column names (as shown in the grid) to extract. Order doesn't matter. */
  sourceColumns: z.array(z.string()).min(1),
  newTableName: z.string(),
  /**
   * Optional override for the name of the link (FK) column that will be
   * added to the parent table. Mathesar auto-populates this from the new
   * table's name (singular) — pass a value only when you want to override.
   */
  linkColumnName: z.string().optional(),
});

const extractColumnsToNewTableOutcome = z.object({
  newTable: Table.schema,
  parentTable: Table.schema,
});

export const extractColumnsToNewTable = defineTask({
  code: 'extract-columns-to-new-table',
  params: extractColumnsToNewTableParams,
  outcome: extractColumnsToNewTableOutcome,

  task: async (t, params) => {
    return await t.action(
      'Select a column, open extract dialog, add remaining columns, submit',
      {
        schema: extractColumnsToNewTableOutcome,
        // No resource op: the parent Table came in via params, and the
        // DAG validator would otherwise require an upstream Schema/Table
        // create inside *this* task's tree (the parent isn't tracked
        // through param flow). Callers compose via `t.perform()`, which
        // caches by task+params hash and handles re-runs correctly.
        fn: async ({ page }) => {
          // Navigate to the parent table explicitly — prior composed steps
          // may have been cached and skipped.
          const home = new HomePage(page);
          await home.goto();
          await home.databaseLink(params.table.databaseName).click();
          const database = new DatabasePage(page);
          await database.schemaLink(params.table.schemaName).click();
          const schema = new SchemaPage(page);
          await schema.tableLink(params.table.tableName).click();

          const table = new TablePage(page);
          await expect(table.heading).toHaveText(params.table.tableName);
          await table.waitForLoaded();

          // Mathesar's grid only honors Shift for multi-select (Ctrl/Cmd
          // click is a no-op). So we select only the FIRST source column
          // in the grid, open the dialog, and use the dialog's own
          // `Columns to Extract` MultiSelect field to add the rest.
          const [firstColumn, ...otherColumns] = params.sourceColumns;
          await table.grid.selectColumn(firstColumn);

          // Inspector's Column tab auto-opens after a header click.
          // `click()` auto-waits for visibility, so no explicit wait needed.
          const inspector = table.columnInspector;
          await inspector.extractButton.click();

          const dialog = extractColumnsDialog(page);
          for (const extra of otherColumns) {
            await dialog.addColumn(extra);
          }

          await dialog.submit({
            tableName: params.newTableName,
            linkColumnName: params.linkColumnName,
          });

          // The parent table's grid will refresh with the new FK column in
          // place of the extracted columns.
          await table.waitForLoaded();

          return {
            newTable: {
              databaseName: params.table.databaseName,
              schemaName: params.table.schemaName,
              tableName: params.newTableName,
            },
            parentTable: params.table,
          };
        },
      },
    );
  },
});
