import { z } from "zod";
import { defineTest } from "../../framework/src";
import { login } from "./login";
import { expect } from "@playwright/test";
import { DatabasesView } from "../interactions/views/databases.view";
import { DatabaseView } from "../interactions/views/database.view";
import { connectDatabaseModal } from "../interactions/regions/connect-database-modal";

const connectDatabaseParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  databaseName: z.string(),
  sampleSchema: z.string(),
});

const connectDatabaseOutcome = z.object({
  databaseName: z.string(),
  databaseDisplayName: z.string(),
  schemaName: z.string(),
});

export const connectDatabase = defineTest({
  code: "connect-database",
  params: connectDatabaseParams,
  outcome: connectDatabaseOutcome,

  scenario: async (t, params) => {
    await t.step("Login", login, params.login);

    const result = await t.action(
      "Create new internal database with sample schema",
      connectDatabaseOutcome,
      async ({ page }) => {
        const databases = new DatabasesView(page);
        await databases.goto();
        await databases.connectDatabaseButton.click();

        const dialog = connectDatabaseModal(page);
        await dialog.createNewDatabase(
          params.databaseName,
          params.sampleSchema,
        );

        // Wait for database to appear in the list
        await expect(
          databases.databaseLink(params.databaseName),
        ).toBeVisible();

        return {
          databaseName: params.databaseName,
          databaseDisplayName: params.databaseName,
          schemaName: params.sampleSchema,
        };
      },
    );

    await t.check("Database is listed on the home page", async ({ page }) => {
      const databases = new DatabasesView(page);
      await databases.goto();
      await expect(
        databases.databaseEntry(result.databaseName),
      ).toBeVisible();
    });

    await t.check("Schema is present inside the database", async ({ page }) => {
      const databases = new DatabasesView(page);
      await databases.goto();
      await databases.databaseLink(result.databaseName).click();

      const database = new DatabaseView(page);
      await expect(database.schemaLink(result.schemaName)).toBeVisible();
    });

    return {
      databaseName: result.databaseName,
      databaseDisplayName: result.databaseDisplayName,
      schemaName: result.schemaName,
    };
  },

  standalone: {
    params: {
      login: { user: "admin", password: "mathesar_password" },
      databaseName: "test_db",
      sampleSchema: "Hardware Store",
    },
  },
});
