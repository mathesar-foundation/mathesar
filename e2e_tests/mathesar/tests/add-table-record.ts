import { z } from "zod";
import { defineTest } from "../../framework/src";
import { connectDatabase } from "./connect-database";
import { expect } from "@playwright/test";
import { DatabasesPage } from "../pages/databases.page";
import { DatabasePage } from "../pages/database.page";
import { SchemaPage } from "../pages/schema.page";
import { TablePage } from "../pages/table.page";

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
        const databasesPage = new DatabasesPage(page);
        await databasesPage.goto();
        await databasesPage.databaseLink(db.databaseName).click();

        const databasePage = new DatabasePage(page);
        await databasePage.schemaLink(db.schemaName).click();

        const schemaPage = new SchemaPage(page);
        await schemaPage.tableLink(params.tableName).click();

        const tablePage = new TablePage(page);
        await expect(tablePage.heading).toContainText(params.tableName);

        // Add new record — creates an empty draft row at the bottom
        await tablePage.newRecordButton.click();
        await expect(page.getByText("+1 unsaved")).toBeVisible();

        // Find the new row by its "DEFAULT" id placeholder (virtual
        // scrolling means .last() may pick up an offscreen placeholder).
        const newRow = page
          .locator('[data-sheet-element="data-row"]')
          .filter({ hasText: "DEFAULT" })
          .first();

        // Double-click the name cell (index 1; index 0 is the id column)
        // to enter edit mode, type the value, then Tab to commit the cell
        // and trigger a save.
        await newRow
          .locator('[data-sheet-element="data-cell"]')
          .nth(1)
          .dblclick();
        await page.keyboard.type(params.record.name);
        await page.keyboard.press("Tab");

        // Wait for the record to save (unsaved indicator disappears)
        await expect(page.getByText("unsaved")).toBeHidden();

        await expect(
          page.getByText(params.record.name, { exact: true }),
        ).toBeVisible();

        return {
          tableName: params.tableName,
          recordName: params.record.name,
        };
      },
    );

    await t.check("New record is visible in the table", async ({ page }) => {
      // Navigate back to the table and verify the record exists
      const databasesPage = new DatabasesPage(page);
      await databasesPage.goto();
      await databasesPage.databaseLink(db.databaseName).click();

      const databasePage = new DatabasePage(page);
      await databasePage.schemaLink(db.schemaName).click();

      const schemaPage = new SchemaPage(page);
      await schemaPage.tableLink(result.tableName).click();

      await expect(page.getByText(result.recordName)).toBeVisible();
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
