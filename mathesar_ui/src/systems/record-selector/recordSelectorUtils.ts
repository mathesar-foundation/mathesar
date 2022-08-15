import type { Column } from '@mathesar/api/tables/columns';
import type { Result as ApiRecord } from '@mathesar/api/tables/records';

export function getPkValueInRecord(
  record: ApiRecord,
  columns: Column[],
): string | number {
  const pkColumn = columns.find((c) => c.primary_key);
  if (!pkColumn) {
    throw new Error('No primary key column found.');
  }
  const pkValue = record[pkColumn.id];
  if (!(typeof pkValue === 'string' || typeof pkValue === 'number')) {
    throw new Error('Primary key value is not a string or number.');
  }
  return pkValue;
}
