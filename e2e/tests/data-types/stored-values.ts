import { type Table, runSqlInSchema } from '../../support/api/mathesar';
import { quoteIdentifier } from '../../support/api/postgres';

/** The values of a column as PostgreSQL prints them, in the order of "id". */
export async function storedValues(
  table: Table,
  column: string,
): Promise<(string | null)[]> {
  const rows = await runSqlInSchema<{ value: string | null }>(
    table.schema,
    `SELECT ${quoteIdentifier(column)}::text AS value
     FROM ${quoteIdentifier(table.name)} ORDER BY id`,
  );
  return rows.map(({ value }) => value);
}
