import { z } from 'zod';
import { expect } from '@playwright/test';
import { defineTask } from '../../framework/src';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { TablePage } from '../interactions/regions/table.page';
import { Table } from '../resources/table';

const renameColumnParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  table: Table.schema,
  currentName: z.string(),
  newName: z.string(),
});

const renameColumnOutcome = z.object({
  table: Table.schema,
  oldName: z.string(),
  newName: z.string(),
});

export const renameColumn = defineTask({
  code: 'rename-column',
  params: renameColumnParams,
  outcome: renameColumnOutcome,

  task: async (t, params) => {
    return await t.action(
      'Select column in grid and rename via inspector',
      {
        schema: renameColumnOutcome,
        // No resource op: the Table already exists (created upstream by
        // whatever task produced the `table` param). The framework's
        // per-resource cache is only populated by `creates()`, and a column
        // rename doesn't change the Table's identity/lifecycle. Callers use
        // `t.perform(renameColumn, ...)`, which caches by task+params hash.
        fn: async ({ page }) => {
          // Navigate to the target table explicitly. Prior composed steps
          // may have been cached and skipped, so we can't rely on browser
          // state.
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

          // Clicking a column header selects it and auto-opens the Column
          // tab in the inspector.
          await table.grid.selectColumn(params.currentName);

          const inspector = table.columnInspector;
          await inspector.waitForLoaded();

          // EditableTextWithActions is NOT a plain input. It renders a
          // read-only input that re-mounts into an editable form on focus
          // (via `on:focus={makeEditable}`), with the value reset to the
          // initial value. A naive `fill(newName)` focuses the read-only
          // input first, then the re-mount happens, and fill's "type"
          // appends to the re-mounted value — producing "milestone_idid"
          // instead of "id". So we explicitly:
          //   1. Click to focus → triggers makeEditable → re-mount
          //   2. Wait for the Save button (only present in edit mode)
          //   3. Clear, then type the new value
          //   4. Click Save
          await inspector.columnNameInput.click();
          await expect(inspector.columnNameSaveButton).toBeVisible();
          await inspector.columnNameInput.clear();
          await inspector.columnNameInput.pressSequentially(params.newName);
          await expect(inspector.columnNameInput).toHaveValue(params.newName);
          await inspector.columnNameSaveButton.click();

          // The Save button disappears once the rename commits — use that
          // as the wait signal so we don't race the next step.
          await expect(inspector.columnNameSaveButton).toBeHidden();

          // Confirm the renamed header is in the grid.
          await expect(table.grid.columnHeader(params.newName)).toBeVisible();

          return {
            table: params.table,
            oldName: params.currentName,
            newName: params.newName,
          };
        },
      },
    );
  },
});
