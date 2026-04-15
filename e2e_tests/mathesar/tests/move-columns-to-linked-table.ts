import { z } from 'zod';
import { expect } from '@playwright/test';
import { defineTask } from '../../framework/src';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { TablePage } from '../interactions/regions/table.page';
import { moveColumnsDialog } from '../interactions/regions/move-columns-dialog';
import { Table } from '../resources/table';

const moveColumnsToLinkedTableParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  /** The table from which columns are being moved. */
  table: Table.schema,
  /** Columns to move — order doesn't matter. */
  sourceColumns: z.array(z.string()).min(1),
  /** Display name of the already-linked target table. */
  linkedTableName: z.string(),
});

const moveColumnsToLinkedTableOutcome = z.object({
  table: Table.schema,
  linkedTableName: z.string(),
  movedColumns: z.array(z.string()),
});

export const moveColumnsToLinkedTable = defineTask({
  code: 'move-columns-to-linked-table',
  params: moveColumnsToLinkedTableParams,
  outcome: moveColumnsToLinkedTableOutcome,

  task: async (t, params) => {
    return await t.action(
      'Select a column, open move dialog, add remaining columns, submit',
      {
        schema: moveColumnsToLinkedTableOutcome,
        // No resource op — see rationale in `extract-columns-to-new-table.ts`.
        fn: async ({ page }) => {
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

          // See the rationale in `extract-columns-to-new-table.ts`: the
          // grid doesn't support non-contiguous click-to-multi-select, so
          // we select 1 column and add the rest via the dialog's
          // `Columns to Move` MultiSelect field.
          const [firstColumn, ...otherColumns] = params.sourceColumns;
          await table.grid.selectColumn(firstColumn);

          // `Move Columns To Linked Table` only renders when the current
          // table has at least one outgoing FK. The caller must ensure
          // that's already the case (via a prior extract).
          const inspector = table.columnInspector;
          await inspector.moveButton.click();

          const dialog = moveColumnsDialog(page);
          for (const extra of otherColumns) {
            await dialog.addColumn(extra);
          }

          await dialog.submit({ linkedTableName: params.linkedTableName });

          // Wait for the grid to refresh without the moved columns.
          await table.waitForLoaded();

          return {
            table: params.table,
            linkedTableName: params.linkedTableName,
            movedColumns: params.sourceColumns,
          };
        },
      },
    );
  },
});
