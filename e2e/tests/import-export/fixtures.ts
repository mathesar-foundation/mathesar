import fs from 'node:fs';
import path from 'node:path';

import {
  type Schema,
  type Table,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { test as base, expect } from '../../support/fixtures';
import { ImportPreviewPage } from '../../support/ui/pages/import-preview-page';
import { ImportUploadPage } from '../../support/ui/pages/import-upload-page';

/** The path of a file in `data/`. */
export function dataFile(name: string): string {
  return path.join(__dirname, 'data', name);
}

export interface StoredColumn {
  name: string;
  type: string;
}

/** The columns of a table with their PostgreSQL types. Mathesar's own types are domains. */
export function storedColumns(
  schema: Schema,
  tableName: string,
): Promise<StoredColumn[]> {
  return runSql<StoredColumn>(
    schema.database.name,
    `SELECT column_name AS name,
            coalesce(domain_schema || '.' || domain_name, data_type) AS type
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema.name, tableName],
  );
}

/** The records of a table as JSON, ordered by the first column. Dates arrive as text. */
export async function storedRecords(
  schema: Schema,
  tableName: string,
): Promise<unknown[]> {
  const rows = await runSqlInSchema<{ record: unknown }>(
    schema,
    `SELECT to_jsonb(t) AS record
     FROM (SELECT * FROM ${quoteIdentifier(tableName)} ORDER BY 1) AS t`,
  );
  return rows.map(({ record }) => record);
}

export interface StoredKeyColumn {
  name: string;
  default: string | null;
  /** `BY DEFAULT` or `ALWAYS` for an identity column. */
  identity: string | null;
}

export function storedPrimaryKey(
  schema: Schema,
  tableName: string,
): Promise<StoredKeyColumn[]> {
  return runSql<StoredKeyColumn>(
    schema.database.name,
    `SELECT column_name AS name, column_default AS "default",
            identity_generation AS identity
     FROM information_schema.table_constraints
     JOIN information_schema.key_column_usage
       USING (constraint_schema, constraint_name, table_schema, table_name)
     JOIN information_schema.columns
       USING (table_schema, table_name, column_name)
     WHERE constraint_type = 'PRIMARY KEY'
       AND table_schema = $1 AND table_name = $2`,
    [schema.name, tableName],
  );
}

export async function storedTableNames(schema: Schema): Promise<string[]> {
  const rows = await runSql<{ name: string }>(
    schema.database.name,
    `SELECT table_name AS name FROM information_schema.tables
     WHERE table_schema = $1 ORDER BY table_name`,
    [schema.name],
  );
  return rows.map(({ name }) => name);
}

interface ImportFixtures {
  uploadPage: ImportUploadPage;
  previewPage: ImportPreviewPage;
  /**
   * Uploads a file of `data/` as the admin and creates its table, which waits
   * for confirmation. This is what the upload page leaves behind.
   */
  startImport: (
    fileName: string,
    options?: { header?: boolean },
  ) => Promise<Table>;
  /** Starts the import of a file of `data/` and opens its preview, loaded. */
  openPreview: (
    fileName: string,
    options?: { header?: boolean; inference?: boolean },
  ) => Promise<Table>;
}

export const test = base.extend<ImportFixtures>({
  uploadPage: async ({ page }, use) => {
    await use(new ImportUploadPage(page));
  },

  previewPage: async ({ page }, use) => {
    await use(new ImportPreviewPage(page));
  },

  startImport: async ({ page, api, schema }, use) => {
    await use(async (fileName, { header = true } = {}) => {
      // Only the user who uploads a file can open its preview, and the upload
      // takes no basic authentication. So it goes through the browser session.
      const { cookies } = await page.context().storageState();
      const csrfToken = cookies.find(({ name }) => name === 'csrftoken');
      const response = await page.request.post('/api/db/v0/data_files/', {
        headers: { 'X-CSRFToken': csrfToken?.value ?? '' },
        multipart: {
          file: fs.createReadStream(dataFile(fileName)),
          header: String(header),
        },
      });
      const { id } = (await response.json()) as { id: number };
      return api.importDataFile(schema, id);
    });
  },

  openPreview: async ({ startImport, previewPage }, use) => {
    await use(async (fileName, { header, inference } = {}) => {
      const table = await startImport(fileName, { header });
      await previewPage.goto(table, inference);
      await expect(previewPage.confirmButton).toBeEnabled();
      return table;
    });
  },
});

export { expect };
