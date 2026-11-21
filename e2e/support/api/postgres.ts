import { Client, type QueryResult, type QueryResultRow } from 'pg';

import { env } from '../env';

/** Runs SQL on the stack's PostgreSQL server, bypassing Mathesar. */
export async function runSql<Row extends QueryResultRow = QueryResultRow>(
  database: string,
  sql: string,
  values?: unknown[],
): Promise<Row[]> {
  const client = new Client({ ...env.postgres, database });
  await client.connect();
  try {
    // A string with several statements yields one result per statement.
    const result = (await client.query<Row>(sql, values)) as
      QueryResult<Row> | QueryResult<Row>[];
    const last = Array.isArray(result) ? result.at(-1) : result;
    return last?.rows ?? [];
  } finally {
    await client.end();
  }
}

export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
