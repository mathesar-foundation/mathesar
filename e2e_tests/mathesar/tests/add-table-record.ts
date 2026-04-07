import { z } from "zod";
import { defineTest } from "../../framework/src";
import { connectDatabase } from "./connect-database";
import { expect } from "@playwright/test";
import { DatabasesView } from "../interactions/views/databases.view";
import { DatabaseView } from "../interactions/views/database.view";
import { SchemaView } from "../interactions/views/schema.view";
import { TableView } from "../interactions/views/table.view";

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

export const addTableRecord = defineTest({
  code: "add-table-record",
  params: addTableRecordParams,
  outcome: addTableRecordOutcome,

  scenario: async (t, params) => {
    const db = await t.step("Connect database", connectDatabase, {
      login: params.login,
      databaseName: params.database.databaseName,
      sampleSchema: params.database.sampleSchema,
    });

    const result = await t.action(
      "Navigate to table and add a new record",
      addTableRecordOutcome,
      async ({ page }) => {
        // Navigate: databases -> database -> schema -> table
        const databases = new DatabasesView(page);
        await databases.goto();
        await databases.databaseLink(db.databaseName).click();

        const database = new DatabaseView(page);
        await database.schemaLink(db.schemaName).click();

        const schema = new SchemaView(page);
        await schema.tableLink(params.tableName).click();

        const table = new TableView(page);
        await expect(table.heading).toContainText(params.tableName);

        // Add new record — creates an empty draft row at the bottom
        await table.grid.addRecord();
        await expect(table.grid.unsavedIndicator).toBeVisible();

        // Edit the name cell (index 1; index 0 is the id column)
        await table.grid.draftRow().cell(1).edit(params.record.name);

        // Wait for the record to save (unsaved indicator disappears)
        await table.grid.waitForSaved();

        await expect(
          table.grid.rowContaining(params.record.name).element,
        ).toBeVisible();

        return {
          tableName: params.tableName,
          recordName: params.record.name,
        };
      },
    );

    await t.check("New record is visible in the table", async ({ page }) => {
      // Navigate back to the table and verify the record exists
      const databases = new DatabasesView(page);
      await databases.goto();
      await databases.databaseLink(db.databaseName).click();

      const database = new DatabaseView(page);
      await database.schemaLink(db.schemaName).click();

      const schema = new SchemaView(page);
      await schema.tableLink(result.tableName).click();

      const table = new TableView(page);
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
      login: { user: "admin", password: "mathesar_password" },
      database: {
        databaseName: "test_db",
        sampleSchema: "Hardware Store",
      },
      tableName: "Store Locations",
      record: {
        name: "E2E Test Store",
      },
    },
  },
});
