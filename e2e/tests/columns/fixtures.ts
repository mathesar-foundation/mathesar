import {
  type MathesarApi,
  type Schema,
  type Table,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { runSql } from '../../support/api/postgres';
import { NewColumnDropdown } from '../../support/ui/components/new-column-dropdown';
import { ColumnInspector } from '../../support/ui/pages/column-inspector';
import { TableTab } from '../../support/ui/pages/table-tab';
import { test as base } from '../table/books';

export interface StoredColumn {
  name: string;
  type: string;
  nullable: boolean;
  /** The expression, for example `'none'::text`. */
  default: string | null;
  description: string | null;
}

interface ColumnsOptions {
  /** Runs in the schema after "Books" is created and before its page opens. */
  extraSql: string;
}

interface ColumnsFixtures {
  /** The Column tab of the inspector on the page of `books`. */
  columnInspector: ColumnInspector;
  /** The Table tab of the inspector on the page of `books`. */
  tableTab: TableTab;
  newColumn: NewColumnDropdown;
}

const RELATION = `(quote_ident($1) || '.' || quote_ident($2))::regclass`;

/** The columns of a table or view as PostgreSQL stores them, in order. */
export function storedColumns(
  schema: Schema,
  table: string,
): Promise<StoredColumn[]> {
  return runSql<StoredColumn>(
    schema.database.name,
    `SELECT a.attname AS name,
       format_type(a.atttypid, a.atttypmod) AS type,
       NOT a.attnotnull AS nullable,
       pg_get_expr(d.adbin, d.adrelid) AS default,
       col_description(a.attrelid, a.attnum) AS description
     FROM pg_attribute a
       LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
     WHERE a.attrelid = ${RELATION} AND a.attnum > 0 AND NOT a.attisdropped
     ORDER BY a.attnum`,
    [schema.name, table],
  );
}

export async function storedColumn(
  schema: Schema,
  table: string,
  column: string,
): Promise<StoredColumn | undefined> {
  return (await storedColumns(schema, table)).find(
    ({ name }) => name === column,
  );
}

/** The display settings and other metadata that Mathesar stores for a column, found by name. */
export async function columnMetadata(
  api: MathesarApi,
  table: Table,
  column: string,
): Promise<Record<string, unknown> | null | undefined> {
  const columns = await api.rpc.call<
    { name: string; metadata: Record<string, unknown> | null }[]
  >('columns.list_with_metadata', {
    database_id: table.schema.database.id,
    table_oid: table.oid,
  });
  return columns.find(({ name }) => name === column)?.metadata;
}

export interface StoredTable {
  name: string;
  description: string | null;
}

/** The tables of a schema as PostgreSQL stores them, by name. */
export function storedTables(schema: Schema): Promise<StoredTable[]> {
  return runSql<StoredTable>(
    schema.database.name,
    `SELECT relname AS name, obj_description(oid, 'pg_class') AS description
     FROM pg_class
     WHERE relnamespace = quote_ident($1)::regnamespace AND relkind = 'r'
     ORDER BY relname`,
    [schema.name],
  );
}

/** The attnum of the column that records who last edited each record, if the table has one. */
export async function trackedColumnAttnum(
  api: MathesarApi,
  table: Table,
): Promise<number | null | undefined> {
  const metadata = await api.rpc.call<
    { table_oid: number; user_tracking_attnum: number | null }[]
  >('tables.metadata.list', { database_id: table.schema.database.id });
  return metadata.find(({ table_oid: oid }) => oid === table.oid)
    ?.user_tracking_attnum;
}

/** The columns of each unique constraint of a table, as "Code" or "A, B". */
export async function uniqueConstraints(
  schema: Schema,
  table: string,
): Promise<string[]> {
  const rows = await runSql<{ columns: string }>(
    schema.database.name,
    `SELECT string_agg(a.attname, ', ' ORDER BY k.ord) AS columns
     FROM pg_constraint c
       CROSS JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
     WHERE c.conrelid = ${RELATION} AND c.contype = 'u'
     GROUP BY c.oid
     ORDER BY 1`,
    [schema.name, table],
  );
  return rows.map(({ columns }) => columns);
}

export const test = base.extend<ColumnsOptions & ColumnsFixtures>({
  extraSql: ['', { option: true }],

  books: async ({ api, books, extraSql }, use) => {
    await runSqlInSchema(books.schema, extraSql);
    await use(await api.getTable(books.schema, 'Books'));
  },

  columnInspector: async ({ page, tablePage }, use) => {
    await use(new ColumnInspector(page, tablePage.inspector));
  },

  tableTab: async ({ page, tablePage }, use) => {
    await use(new TableTab(page, tablePage.inspector));
  },

  newColumn: async ({ page }, use) => {
    await use(new NewColumnDropdown(page));
  },
});

export { expect } from '../../support/fixtures';
